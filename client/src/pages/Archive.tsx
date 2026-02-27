import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2, RotateCcw, Trash2, ArchiveX } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_BADGE: Record<string, string> = {
  People:   "bg-blue-100 text-blue-800",
  Projects: "bg-purple-100 text-purple-800",
  Ideas:    "bg-green-100 text-green-800",
  Admin:    "bg-orange-100 text-orange-800",
};

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

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.85) return "text-green-600";
  if (confidence >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

function CardSkeletons() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Archive() {
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const archivedQuery = trpc.notes.getArchived.useQuery();
  const restoreMutation = trpc.notes.restore.useMutation();
  const deleteMutation = trpc.notes.delete.useMutation();

  const handleRestore = async (noteId: number) => {
    setRemovedIds((prev) => new Set([...prev, noteId]));
    try {
      await restoreMutation.mutateAsync({ noteId });
      toast.success("Note restored to dashboard.");
      archivedQuery.refetch();
    } catch {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      toast.error("Failed to restore note.");
    }
  };

  const handleDelete = async (noteId: number) => {
    setRemovedIds((prev) => new Set([...prev, noteId]));
    setDeleteNoteId(null);
    try {
      await deleteMutation.mutateAsync({ noteId });
      toast.success("Note permanently deleted.");
      archivedQuery.refetch();
    } catch {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      toast.error("Failed to delete note.");
    }
  };

  const notes = (archivedQuery.data ?? []).filter((n) => !removedIds.has(n.id));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-1">Archive</h1>
        <p className="text-muted-foreground text-sm">Archived notes — restore or permanently delete</p>
      </motion.div>

      {archivedQuery.isLoading ? (
        <CardSkeletons />
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ArchiveX className="h-10 w-10 opacity-40" />
            <p className="text-sm">No archived notes</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence initial={false}>
            {notes.map((note) => {
              const confidence = parseFloat(note.confidence as unknown as string);
              return (
                <motion.div
                  key={note.id}
                  variants={itemVariants}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
                >
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug mb-1">{note.content}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{note.reasoning}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${CATEGORY_BADGE[note.category] ?? "bg-gray-100 text-gray-800"}`}>
                              {note.category}
                            </Badge>
                            <span className={`text-xs font-semibold ${getConfidenceColor(confidence)}`}>
                              {(confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-green-700 hover:bg-green-50"
                              onClick={() => handleRestore(note.id)}
                              disabled={restoreMutation.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Restore
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteNoteId(note.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AlertDialog open={deleteNoteId !== null} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteId && handleDelete(deleteNoteId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
              ) : (
                "Delete permanently"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
