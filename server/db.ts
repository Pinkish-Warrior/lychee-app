import { eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, notes, feedbackLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createNote(userId: number, content: string, category: string, confidence: number, reasoning: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notes).values({
    userId,
    content,
    category: category as any,
    confidence: confidence.toString() as any,
    reasoning,
  });

  return result;
}

export async function getNotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy((t) => t.createdAt);
}

export async function getNotesByUserAndCategory(userId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId) && eq(notes.category, category as any))
    .orderBy((t) => t.createdAt);
}

export async function getReviewQueueNotes(userId: number, threshold: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId) && lt(notes.confidence, threshold as any))
    .orderBy((t) => t.createdAt);
}

export async function updateNoteCategory(noteId: number, category: string, isCorrected: boolean, originalCategory?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notes)
    .set({
      category: category as any,
      isCorrected: isCorrected ? 1 : 0,
      originalCategory: originalCategory as any,
    })
    .where(eq(notes.id, noteId));
}

export async function logFeedback(
  noteId: number,
  userId: number,
  originalConfidence: number,
  aiCategory: string,
  userCategory: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(feedbackLogs).values({
    noteId,
    userId,
    originalConfidence: originalConfidence.toString() as any,
    aiCategory: aiCategory as any,
    userCategory: userCategory as any,
  });
}

export async function deleteNote(noteId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the note belongs to the user before deleting
  const note = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!note || note.length === 0 || note[0].userId !== userId) {
    throw new Error("Note not found or unauthorized");
  }

  return await db.delete(notes).where(eq(notes.id, noteId));
}
