# LycheeNote: Edit & Delete Features Implementation Plan

**Date Created:** February 15, 2026  
**Status:** In Progress  
**Backup Created:** `lychee-app-backup-20260215-060551.tar.gz`

---

## Overview

This document outlines the incremental implementation plan for adding **Edit** and **Delete** functionality to captured notes in the LycheeNote application. The implementation is divided into three manageable steps to optimize resource usage and ensure stability.

---

## Current State Analysis

### What Already Exists
- **Delete functionality** is already implemented on the Dashboard (`Dashboard.tsx`)
- **Delete backend mutation** exists in `routers.ts` and `db.ts`
- Database schema supports note updates via the `updatedAt` timestamp field

### What's Missing
- **Edit functionality** (backend and frontend) - completely missing
- **Delete functionality** on Category View pages - not yet implemented
- **Edit UI components** - need to be created

---

## Implementation Plan

### Step 1: Backend Preparation & Backup ✅ (TODAY)

**Objective:** Create a full backup and add backend support for editing note content.

**Tasks:**
1. ✅ Create a full compressed backup of the project
2. Create a new database function `updateNoteContent()` in `server/db.ts`
3. Add a new tRPC mutation `notes.updateContent` in `server/routers.ts`
4. Validate that the mutation only allows users to edit their own notes

**Files to Modify:**
- `server/db.ts` - Add `updateNoteContent` function
- `server/routers.ts` - Add `updateContent` mutation

**Backend Changes Summary:**
```typescript
// New function in db.ts
export async function updateNoteContent(noteId: number, userId: number, newContent: string) {
  // Verify ownership and update content
}

// New mutation in routers.ts
updateContent: protectedProcedure
  .input(z.object({ noteId: z.number(), newContent: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    // Call updateNoteContent with security checks
  })
```

---

### Step 2: Dashboard Edit UI (NEXT)

**Objective:** Add Edit button and modal dialog to the Dashboard for modifying notes.

**Tasks:**
1. Add an "Edit" button next to each note on the Dashboard
2. Create an edit modal/dialog component
3. Implement the edit mutation call
4. Add success/error toast notifications
5. Refresh the dashboard after successful edit

**Files to Modify:**
- `client/src/pages/Dashboard.tsx` - Add edit button and modal logic

**Frontend Changes Summary:**
- Add state for `editingNoteId` and `editContent`
- Add edit button with pencil icon next to delete button
- Create edit dialog with textarea for content modification
- Call `trpc.notes.updateContent` mutation on save

---

### Step 3: Category View Enhancement (FINAL)

**Objective:** Add both Edit and Delete functionality to the Category View pages.

**Tasks:**
1. Add Edit button and modal to Category View (similar to Dashboard)
2. Add Delete button and confirmation dialog to Category View
3. Implement both mutations
4. Ensure consistency with Dashboard UI/UX
5. Final testing and verification

**Files to Modify:**
- `client/src/pages/CategoryView.tsx` - Add edit and delete buttons with modals

**Frontend Changes Summary:**
- Replicate the edit and delete logic from Dashboard
- Add state management for editing and deleting
- Implement modal dialogs for both operations
- Ensure proper error handling and user feedback

---

## Technical Specifications

### Database Schema (No Changes Required)
The existing `notes` table already supports editing:
```sql
- content: text (editable)
- updatedAt: timestamp (auto-updated)
- userId: int (for ownership verification)
```

### Security Considerations
- ✅ All mutations must verify that the user owns the note before allowing edits
- ✅ Prevent unauthorized access via userId checks
- ✅ Validate input (non-empty content)

### UI/UX Consistency
- Use the same button styles and icons as existing features
- Edit icon: pencil/edit icon (lucide-react)
- Delete icon: trash icon (already in use)
- Confirmation dialogs for destructive actions
- Toast notifications for feedback

---

## Backup & Recovery

**Backup Location:** `/home/ubuntu/lychee-app-backup-20260215-060551.tar.gz`

**To Restore:**
```bash
cd /home/ubuntu
tar -xzf lychee-app-backup-20260215-060551.tar.gz
```

---

## Resource Allocation

| Step | Estimated Credits | Actual Credits | Status |
| :--- | :--- | :--- | :--- |
| Step 1: Backend Prep | ~50 | TBD | In Progress |
| Step 2: Dashboard UI | ~80 | TBD | Pending |
| Step 3: Category View | ~85 | TBD | Pending |
| **Total** | **~215** | TBD | Tracking |

---

## Next Steps

**To proceed with Step 2, use this prompt:**
> "Proceed with Step 2: Implement the Edit UI on the Dashboard page, including the edit button and the modification dialog."

---

## Notes

- Each step is independent and can be paused/resumed
- Changes are committed to a feature branch to maintain safety
- All modifications maintain backward compatibility
- Testing should be performed after each step

---

**Last Updated:** February 15, 2026, 06:05 UTC


## Progress Update - Step 2 Complete ✅

**Date:** February 15, 2026, 06:30 UTC  
**Status:** Step 2 successfully implemented

### Step 2 Completion Summary

**Dashboard Edit UI** has been successfully implemented with the following features:

- ✅ Edit button (pencil icon) added to each note card
- ✅ Edit dialog created with textarea for content modification
- ✅ `handleEditNote()` function to open the edit dialog
- ✅ `handleSaveEdit()` function to save changes via tRPC mutation
- ✅ Loading state with spinner during save
- ✅ Error handling with toast notifications
- ✅ Input validation (prevents empty notes)
- ✅ Dashboard refetch after successful edit
- ✅ UI consistent with existing design (blue edit button, red delete button)

**Files Modified:**
- `client/src/pages/Dashboard.tsx` - Added edit state, handlers, and dialog UI

**Git Commit:** `28ff778` - "Step 2: Add Edit UI to Dashboard page"

---

## Next Steps

**To proceed with Step 3 (Category View), use this prompt:**

> "Proceed with Step 3: Add the Edit and Delete functionality to the Category View pages and perform a final check."



## Progress Update - Step 3 Complete ✅

**Date:** February 15, 2026, 06:45 UTC  
**Status:** Step 3 successfully implemented - ALL STEPS COMPLETE

### Step 3 Completion Summary

**Category View Edit & Delete UI** has been successfully implemented with the following features:

- ✅ Edit button (pencil icon) added to each note card in all category views
- ✅ Delete button (trash icon) added to each note card in all category views
- ✅ Edit dialog created with textarea for content modification
- ✅ Delete confirmation dialog with loading state
- ✅ `handleEditNote()` function to open the edit dialog
- ✅ `handleSaveEdit()` function to save changes via tRPC mutation
- ✅ `handleDeleteNote()` function to delete notes with confirmation
- ✅ Loading states with spinner during save/delete
- ✅ Error handling with toast notifications
- ✅ Input validation (prevents empty notes)
- ✅ Category view refetch after successful edit/delete
- ✅ UI consistent with Dashboard implementation (blue edit, red delete)

**Files Modified:**
- `client/src/pages/CategoryView.tsx` - Added edit/delete state, handlers, and dialogs

**Git Commit:** `6becf68` - "Step 3: Add Edit and Delete UI to Category View pages"

---

## Final Verification

A comprehensive verification checklist has been created in `FINAL_VERIFICATION.md` documenting:

- ✅ Backend implementation status
- ✅ Frontend implementation status (Dashboard & Category View)
- ✅ Security features verification
- ✅ UI/UX consistency across all views
- ✅ Git commit history
- ✅ Testing recommendations
- ✅ Deployment notes
- ✅ Backup information

---

## Implementation Complete

**All three steps have been successfully completed:**

| Step | Status | Completion Date |
| :--- | :--- | :--- |
| Step 1: Backend Preparation | ✅ Complete | Feb 15, 06:05 UTC |
| Step 2: Dashboard Edit UI | ✅ Complete | Feb 15, 06:30 UTC |
| Step 3: Category View UI | ✅ Complete | Feb 15, 06:45 UTC |

---

## Resource Summary

| Phase | Credits Used | Status |
| :--- | :--- | :--- |
| Analysis & Design | 2,000 tokens | ✅ |
| Step 1: Backend | ~40 credits | ✅ |
| Step 2: Dashboard | ~30 credits | ✅ |
| Step 3: Category View | ~25 credits | ✅ |
| **Total** | **~95 credits** | ✅ |

**Remaining Credits for Today:** ~139 credits

---

## Next Steps

The implementation is now complete and ready for:

1. **Testing:** Manual testing in the staging environment
2. **Deployment:** Merge to main branch and deploy to production
3. **Optional Enhancements:** See FINAL_VERIFICATION.md for future improvement ideas

**Branch:** `feature/edit-delete-notes`  
**Backup:** `lychee-app-backup-20260215-060551.tar.gz`

---

**Last Updated:** February 15, 2026, 06:45 UTC
