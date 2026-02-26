import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2, RotateCcw, Trash2, ArchiveX } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_BADGE: Record<string, string> = {
  People:   "bg-blue-100 text-blue-800",
  Projects: "bg-purple-100 text-purple-800",
  Ideas:    "bg-green-100 text-green-800",
  Admin:    "bg-orange-100 text-orange-800",
};

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.85) return "text-green-600";
  if (confidence >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

export default function Archive() {
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

  const archivedQuery = trpc.notes.getArchived.useQuery();
  const restoreMutation = trpc.notes.restore.useMutation();
  const deleteMutation = trpc.notes.delete.useMutation();

  const handleRestore = async (noteId: number) => {
    try {
      await restoreMutation.mutateAsync({ noteId });
      toast.success("Note restored to dashboard.");
      archivedQuery.refetch();
    } catch {
      toast.error("Failed to restore note.");
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await deleteMutation.mutateAsync({ noteId });
      toast.success("Note permanently deleted.");
      archivedQuery.refetch();
      setDeleteNoteId(null);
    } catch {
      toast.error("Failed to delete note.");
    }
  };

  const notes = archivedQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Archive</h1>
        <p className="text-muted-foreground">Archived notes — restore or permanently delete</p>
      </div>

      {archivedQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ArchiveX className="h-10 w-10 opacity-40" />
            <p className="text-sm">No archived notes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const confidence = parseFloat(note.confidence as unknown as string);
            return (
              <Card key={note.id} className="opacity-80 hover:opacity-100 transition-opacity">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm mb-1">{note.content}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{note.reasoning}</p>
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
            );
          })}
        </div>
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
