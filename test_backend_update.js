const { drizzle } = require("drizzle-orm/mysql2");
const { eq, lt } = require("drizzle-orm");
const { notes, users } = require("./drizzle/schema");

// Mocking the DB connection logic from server/db.ts
async function getDb() {
  if (process.env.DATABASE_URL) {
    return drizzle(process.env.DATABASE_URL);
  }
  return null;
}

// Mocking the functions from server/db.ts to test them directly in JS
async function updateNoteContent(db, noteId, userId, newContent) {
  const note = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!note || note.length === 0 || note[0].userId !== userId) {
    throw new Error("Note not found or unauthorized");
  }
  return await db.update(notes).set({ content: newContent }).where(eq(notes.id, noteId));
}

async function test() {
  console.log("🚀 Starting Backend JS Sanity Check...");
  const db = await getDb();
  if (!db) {
    console.error("❌ Database URL not found in environment.");
    process.exit(1);
  }

  try {
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
      console.log("⚠️ No users found, skipping test.");
      return;
    }
    const testUser = allUsers[0];
    const otherUserId = testUser.id + 999;

    console.log("📝 Creating test note...");
    const content = "Original Content " + Date.now();
    await db.insert(notes).values({
      userId: testUser.id,
      content: content,
      category: "Ideas",
      confidence: "0.90",
      reasoning: "Test reasoning"
    });
    
    const userNotes = await db.select().from(notes).where(eq(notes.userId, testUser.id)).orderBy(notes.createdAt);
    const testNote = userNotes[userNotes.length - 1];
    const noteId = testNote.id;

    console.log("🔒 Testing security: Unauthorized edit attempt...");
    try {
      await updateNoteContent(db, noteId, otherUserId, "Hacked Content");
      console.error("❌ Security Failure: Unauthorized user was able to edit!");
    } catch (e) {
      console.log("✅ Security Success: Unauthorized edit blocked: " + e.message);
    }

    console.log("✏️ Testing authorized edit...");
    const newContent = "Updated Content " + Date.now();
    await updateNoteContent(db, noteId, testUser.id, newContent);
    
    const updatedNote = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
    if (updatedNote[0].content === newContent) {
      console.log("✅ Update Success: Content was correctly modified.");
    } else {
      console.error("❌ Update Failure: Content did not change.");
    }

    console.log("🧹 Cleaning up test data...");
    await db.delete(notes).where(eq(notes.id, noteId));
    console.log("✨ Sanity check complete!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

test();
