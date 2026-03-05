import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, subscribedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { classifyNote, findRelatedNotes } from "./classification";
import { CLASSIFICATION_THRESHOLDS, shouldReviewNote } from "./config";
import {
  createNote,
  getNotesByUserId,
  getNotesByUserAndCategory,
  getReviewQueueNotes,
  updateNoteCategory,
  logFeedback,
  deleteNote,
  updateNoteContent,
  archiveNote,
  restoreNote,
  getArchivedNotes,
  getCategoryStats,
  getUserByEmail,
  upsertUser,
  createNoteLink,
  getNoteLinks,
  getUserSubscription,
  updateSubscription,
  saveUserApiKey,
  getUserAiConfig,
} from "./db";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const STUDENT_EMAIL_DOMAINS = [".ac.uk", ".edu", ".ac.ie", ".ac.za", ".edu.au", ".ac.nz", ".ac.in", ".edu.sg"];

function isStudentEmail(email: string): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return STUDENT_EMAIL_DOMAINS.some(domain => lower.endsWith(domain));
}

function getStripe() {
  if (!ENV.stripeSecretKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
  return new Stripe(ENV.stripeSecretKey);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user?.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const { ONE_YEAR_MS } = await import("@shared/const");
        const token = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),

    signup: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        await upsertUser({ openId: input.email, name: input.name, email: input.email, passwordHash, lastSignedIn: new Date(), subscriptionStatus: "trialing", trialEndsAt } as any);
        const { ONE_YEAR_MS } = await import("@shared/const");
        const token = await sdk.createSessionToken(input.email, { name: input.name, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),
  }),

  notes: router({
    capture: subscribedProcedure
      .input(
        z.object({
          content: z.string().min(1, "Note content cannot be empty"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { content } = input;
        const userId = ctx.user.id;
        const userConfig = await getUserAiConfig(userId) ?? undefined;

        const classification = await classifyNote(content, userConfig);

        const result = await createNote(
          userId,
          content,
          classification.category,
          classification.confidence,
          classification.reasoning
        );

        // Auto-link: find related notes and create graph edges (best-effort)
        try {
          const newNoteId = (result[0] as any).insertId as number;
          const existingNotes = await getNotesByUserId(userId);
          const related = await findRelatedNotes(content, existingNotes.filter((n) => n.id !== newNoteId), userConfig);
          await Promise.all(
            related.map((r) => createNoteLink(userId, newNoteId, r.noteId, r.strength, r.reason))
          );
        } catch (e) {
          console.warn("[Graph] Auto-linking failed:", e);
        }

        return {
          success: true,
          classification,
          shouldReview: shouldReviewNote(classification.confidence),
        };
      }),

    getDashboard: subscribedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const allNotes = await getNotesByUserId(userId);
      return allNotes.slice(-10).reverse();
    }),

    getReviewQueue: subscribedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const reviewNotes = await getReviewQueueNotes(userId, CLASSIFICATION_THRESHOLDS.HIGH);
      return reviewNotes.reverse();
    }),

    getByCategory: subscribedProcedure
      .input(
        z.object({
          category: z.enum(["People", "Projects", "Ideas", "Admin"]),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const notes = await getNotesByUserAndCategory(userId, input.category);
        return notes.reverse();
      }),

    delete: subscribedProcedure
      .input(
        z.object({
          noteId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const { noteId } = input;

        await deleteNote(noteId, userId);
        return { success: true };
      }),

    getDashboardFiltered: subscribedProcedure
      .input(
        z.object({
          category: z.enum(["People", "Projects", "Ideas", "Admin"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        let allNotes;
        if (input.category) {
          allNotes = await getNotesByUserAndCategory(userId, input.category);
        } else {
          allNotes = await getNotesByUserId(userId);
        }
        return allNotes.slice(-10).reverse();
      }),

    correctClassification: subscribedProcedure
      .input(
        z.object({
          noteId: z.number(),
          correctedCategory: z.enum(["People", "Projects", "Ideas", "Admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const { noteId, correctedCategory } = input;

        const allNotes = await getNotesByUserId(userId);
        const note = allNotes.find((n) => n.id === noteId);

        if (!note) {
          throw new Error("Note not found");
        }

        await updateNoteCategory(noteId, correctedCategory, true, note.category);

        const confidence = parseFloat(note.confidence as unknown as string);
        await logFeedback(noteId, userId, confidence, note.category, correctedCategory);

        return { success: true };
      }),

    updateContent: subscribedProcedure
      .input(
        z.object({
          noteId: z.number(),
          newContent: z.string().min(1, "Note content cannot be empty"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const { noteId, newContent } = input;

        await updateNoteContent(noteId, userId, newContent);
        return { success: true };
      }),

    archive: subscribedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await archiveNote(input.noteId, ctx.user.id);
        return { success: true };
      }),

    restore: subscribedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await restoreNote(input.noteId, ctx.user.id);
        return { success: true };
      }),

    getArchived: subscribedProcedure.query(async ({ ctx }) => {
      const archived = await getArchivedNotes(ctx.user.id);
      return archived.reverse();
    }),

    getCategoryStats: subscribedProcedure.query(async ({ ctx }) => {
      return await getCategoryStats(ctx.user.id);
    }),
  }),

  graph: router({
    getData: subscribedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const [allNotes, allLinks] = await Promise.all([
        getNotesByUserId(userId),
        getNoteLinks(userId),
      ]);

      const nodes = allNotes.map((note) => ({
        id: note.id,
        label: note.content.slice(0, 60) + (note.content.length > 60 ? "…" : ""),
        category: note.category,
        confidence: note.confidence,
        isCorrected: note.isCorrected,
        createdAt: note.createdAt,
      }));

      const links = allLinks.map((link) => ({
        source: link.sourceId,
        target: link.targetId,
        strength: link.strength,
        reason: link.reason,
      }));

      return { nodes, links };
    }),

    linkNotes: subscribedProcedure
      .input(
        z.object({
          sourceId: z.number(),
          targetId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createNoteLink(ctx.user.id, input.sourceId, input.targetId, 1.0, input.reason);
        return { success: true };
      }),
  }),
  billing: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getUserSubscription(ctx.user.id);
      const isStudent = isStudentEmail(ctx.user.email ?? "");
      const isAdmin = ctx.user.role === "admin";
      return { ...sub, isStudent, isAdmin };
    }),

    createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      const user = ctx.user;
      const isStudent = isStudentEmail(user.email ?? "");
      const priceId = isStudent ? ENV.stripeStudentPriceId : ENV.stripeStandardPriceId;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email ?? undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { trial_period_days: 15, metadata: { userId: String(user.id) } },
        metadata: { userId: String(user.id) },
        success_url: `${ENV.isProduction ? "https://your-domain.com" : "http://localhost:5173"}/billing?success=1`,
        cancel_url: `${ENV.isProduction ? "https://your-domain.com" : "http://localhost:5173"}/billing?canceled=1`,
      });

      return { url: session.url };
    }),

    createPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = getStripe();
      const sub = await getUserSubscription(ctx.user.id);
      if (!sub?.stripeCustomerId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe customer found" });

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${ENV.isProduction ? "https://your-domain.com" : "http://localhost:5173"}/billing`,
      });

      return { url: session.url };
    }),

    grantLifetime: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateSubscription(input.userId, { subscriptionStatus: "lifetime" });
        return { success: true };
      }),
  }),

  settings: router({
    getApiKeyStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select({ aiProvider: users.aiProvider, openaiApiKey: users.openaiApiKey, geminiApiKey: users.geminiApiKey, claudeApiKey: users.claudeApiKey }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!result.length) return { provider: "gemini", hasKey: false };
      const row = result[0];
      const provider = row.aiProvider ?? "gemini";
      const hasKey = !!(provider === "openai" ? row.openaiApiKey : provider === "gemini" ? row.geminiApiKey : row.claudeApiKey);
      return { provider, hasKey };
    }),

    saveApiKey: protectedProcedure
      .input(z.object({
        provider: z.enum(["openai", "gemini", "claude"]),
        apiKey: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveUserApiKey(ctx.user.id, input.provider, input.apiKey);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
