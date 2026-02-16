import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import { useRoute } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function CategoryView() {
  const [, params] = useRoute("/category/:category");
  const category = params?.category as "People" | "Projects" | "Ideas" | "Admin" | undefined;
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

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
    try {
      await deleteMutation.mutateAsync({ noteId });
      toast.success("Note deleted successfully.");
      categoryQuery.refetch();
      setDeleteNoteId(null);
    } catch (error) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{category}</h1>
        <p className="text-gray-600">All notes classified as {category}</p>
      </div>

      {categoryQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : categoryQuery.data && categoryQuery.data.length > 0 ? (
        <div className="space-y-3">
          {categoryQuery.data.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                    <p className="text-xs text-gray-500">{note.reasoning}</p>
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
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
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
