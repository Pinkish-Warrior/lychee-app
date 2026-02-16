import { getDb, updateNoteContent, createNote, deleteNote } from "./server/db.js";
import { notes, users } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function test() {
  console.log("🚀 Starting Backend Sanity Check...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  try {
    // 1. Get a test user
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
      console.log("⚠️ No users found, skipping test.");
      return;
    }
    const testUser = allUsers[0];
    const otherUserId = testUser.id + 999;

    // 2. Create a temporary note
    console.log("📝 Creating test note...");
    const content = "Original Content " + Date.now();
    await createNote(testUser.id, content, "Ideas", 0.9, "Test reasoning");
    
    // Fetch the note to get its ID
    const userNotes = await db.select().from(notes).where(eq(notes.userId, testUser.id)).orderBy(notes.createdAt);
    const testNote = userNotes[userNotes.length - 1];
    const noteId = testNote.id;

    // 3. Test Unauthorized Edit
    console.log("🔒 Testing security: Unauthorized edit attempt...");
    try {
      await updateNoteContent(noteId, otherUserId, "Hacked Content");
      console.error("❌ Security Failure: Unauthorized user was able to edit!");
    } catch (e: any) {
      console.log("✅ Security Success: Unauthorized edit blocked: " + e.message);
    }

    // 4. Test Authorized Edit
    console.log("✏️ Testing authorized edit...");
    const newContent = "Updated Content " + Date.now();
    await updateNoteContent(noteId, testUser.id, newContent);
    
    // Verify update
    const updatedNote = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
    if (updatedNote[0].content === newContent) {
      console.log("✅ Update Success: Content was correctly modified.");
    } else {
      console.error("❌ Update Failure: Content did not change.");
    }

    // 5. Cleanup
    console.log("🧹 Cleaning up test data...");
    await deleteNote(noteId, testUser.id);
    console.log("✨ Sanity check complete!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

test();
