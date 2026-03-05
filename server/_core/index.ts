import "dotenv/config";
import { webcrypto } from "node:crypto";

// Polyfill globalThis.crypto for Node.js < 19 (required by jose for JWT signing)
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

import express from "express";
import { createServer } from "http";
import net from "net";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { ENV } from "./env";
import * as db from "../db";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migrations] DATABASE_URL not set, skipping migrations");
    return;
  }
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);
    await migrate(db, { migrationsFolder: "drizzle" });
    await connection.end();
    console.log("[Migrations] Applied successfully");
  } catch (error) {
    console.error("[Migrations] Failed:", error);
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function seedAdminUser() {
  const { adminEmail, adminPassword } = ENV;
  if (!adminEmail || !adminPassword) return;
  const hash = await bcrypt.hash(adminPassword, 10);
  await db.upsertUser({
    openId: adminEmail,
    name: adminEmail.split("@")[0],
    email: adminEmail,
    passwordHash: hash,
    lastSignedIn: new Date(),
    role: "admin",
  } as any);
  console.log("[Seed] Admin user upserted:", adminEmail);
}

async function startServer() {
  await runMigrations();
  await seedAdminUser();

  const app = express();
  const server = createServer(app);

  // Stripe webhook — must be registered BEFORE express.json() to receive raw body
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
      res.sendStatus(400);
      return;
    }
    const stripe = new Stripe(ENV.stripeSecretKey);
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret);
    } catch (err) {
      console.error("[Stripe webhook] Signature verification failed:", err);
      res.sendStatus(400);
      return;
    }

    const getCustomerId = (obj: any): string | null => obj?.customer ?? null;
    const getMetaUserId = (obj: any): number | null => {
      const id = obj?.metadata?.userId;
      return id ? parseInt(id) : null;
    };

    try {
      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const sub = event.data.object as Stripe.Subscription;
        const userId = getMetaUserId(sub);
        if (userId) {
          const plan = (sub.items.data[0]?.price.id === ENV.stripeStudentPriceId) ? "student" : "standard";
          const status = sub.status === "active" ? "active"
                       : sub.status === "trialing" ? "trialing"
                       : sub.status === "past_due" ? "past_due"
                       : sub.status === "canceled" ? "canceled" : "none";
          await db.updateSubscription(userId, {
            subscriptionStatus: status as any,
            subscriptionPlan: plan,
            stripeCustomerId: getCustomerId(sub) ?? undefined,
            stripeSubId: sub.id,
          });
        }
      } else if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        const userId = getMetaUserId(sub);
        if (userId) await db.updateSubscription(userId, { subscriptionStatus: "canceled" });
      } else if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | null;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const userId = getMetaUserId(sub);
          if (userId) await db.updateSubscription(userId, { subscriptionStatus: "past_due" });
        }
      }
    } catch (err) {
      console.error("[Stripe webhook] Handler error:", err);
    }

    res.sendStatus(200);
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, port);
  } else {
    serveStatic(app);
  }

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
