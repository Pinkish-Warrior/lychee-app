import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { classifyNote } from "./classification";
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
} from "./db";

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
  }),

  notes: router({
    capture: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1, "Note content cannot be empty"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { content } = input;
        const userId = ctx.user.id;

        const classification = await classifyNote(content);

        const result = await createNote(
          userId,
          content,
          classification.category,
          classification.confidence,
          classification.reasoning
        );

        return {
          success: true,
          classification,
          shouldReview: shouldReviewNote(classification.confidence),
        };
      }),

    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const allNotes = await getNotesByUserId(userId);
      return allNotes.slice(-10).reverse();
    }),

    getReviewQueue: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const reviewNotes = await getReviewQueueNotes(userId, CLASSIFICATION_THRESHOLDS.HIGH);
      return reviewNotes.reverse();
    }),

    getByCategory: protectedProcedure
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

    delete: protectedProcedure
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

    getDashboardFiltered: protectedProcedure
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

    correctClassification: protectedProcedure
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

    updateContent: protectedProcedure
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
  }),
});

export type AppRouter = typeof appRouter;
