import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import { useRoute } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 20, stiffness: 200 },
  },
};

function CardSkeletons() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/3 mt-2" />
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CategoryView() {
  const [, params] = useRoute("/category/:category");
  const category = params?.category as "People" | "Projects" | "Ideas" | "Admin" | undefined;
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const categoryQuery = trpc.notes.getByCategory.useQuery(
    { category: category || "People" },
    { enabled: !!category }
  );
  const deleteMutation = trpc.notes.delete.useMutation();
  const updateMutation = trpc.notes.updateContent.useMutation();

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      People: "bg-blue-100 text-blue-800",
      Projects: "bg-purple-100 text-purple-800",
      Ideas: "bg-green-100 text-green-800",
      Admin: "bg-orange-100 text-orange-800",
    };
    return colors[cat] || "bg-gray-100 text-gray-800";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const handleDeleteNote = async (noteId: number) => {
    setRemovedIds((prev) => new Set([...prev, noteId]));
    setDeleteNoteId(null);
    try {
      await deleteMutation.mutateAsync({ noteId });
      toast.success("Note deleted successfully.");
      categoryQuery.refetch();
    } catch (error) {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      toast.error("Failed to delete note. Please try again.");
      console.error(error);
    }
  };

  const handleEditNote = (noteId: number, currentContent: string) => {
    setEditingNoteId(noteId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }

    if (editingNoteId === null) return;

    try {
      await updateMutation.mutateAsync({
        noteId: editingNoteId,
        newContent: editContent,
      });
      toast.success("Note updated successfully.");
      categoryQuery.refetch();
      setEditingNoteId(null);
      setEditContent("");
    } catch (error) {
      toast.error("Failed to update note. Please try again.");
      console.error(error);
    }
  };

  if (!category) {
    return <div>Invalid category</div>;
  }

  const visibleNotes = (categoryQuery.data ?? []).filter((n) => !removedIds.has(n.id));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">{category}</h1>
        <p className="text-muted-foreground text-sm">All notes classified as {category}</p>
      </motion.div>

      {categoryQuery.isLoading ? (
        <CardSkeletons />
      ) : visibleNotes.length > 0 ? (
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence initial={false}>
            {visibleNotes.map((note) => (
              <motion.div
                key={note.id}
                variants={itemVariants}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug mb-2">{note.content}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{note.reasoning}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2 items-center">
                          <Badge className={getCategoryColor(note.category)}>{note.category}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note.id, note.content)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteNoteId(note.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className={`text-xs font-semibold ${getConfidenceColor(parseFloat(note.confidence as unknown as string))}`}>
                          {(parseFloat(note.confidence as unknown as string) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No notes in this category yet.
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteNoteId !== null} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={editingNoteId !== null} onOpenChange={(open) => !open && setEditingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Note</AlertDialogTitle>
            <AlertDialogDescription>
              Modify the content of your note below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-24"
              placeholder="Edit your note..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateMutation.isPending || !editContent.trim()}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
