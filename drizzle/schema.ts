import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["People", "Projects", "Ideas", "Admin"]).notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull(),
  isCorrected: int("isCorrected").default(0).notNull(),
  originalCategory: mysqlEnum("originalCategory", ["People", "Projects", "Ideas", "Admin"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

export const feedbackLogs = mysqlTable("feedbackLogs", {
  id: int("id").autoincrement().primaryKey(),
  noteId: int("noteId").notNull(),
  userId: int("userId").notNull(),
  originalConfidence: decimal("originalConfidence", { precision: 3, scale: 2 }).notNull(),
  aiCategory: mysqlEnum("aiCategory", ["People", "Projects", "Ideas", "Admin"]).notNull(),
  userCategory: mysqlEnum("userCategory", ["People", "Projects", "Ideas", "Admin"]).notNull(),
  correctionTimestamp: timestamp("correctionTimestamp").defaultNow().notNull(),
});

export type FeedbackLog = typeof feedbackLogs.$inferSelect;
export type InsertFeedbackLog = typeof feedbackLogs.$inferInsert;