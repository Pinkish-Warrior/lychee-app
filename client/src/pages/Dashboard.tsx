import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2, Trash2, Edit2, Archive, Users, FolderKanban, Lightbulb, ClipboardList, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const CATEGORIES = ["People", "Projects", "Ideas", "Admin"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_CONFIG: Record<Category, { color: string; badge: string; icon: React.ElementType }> = {
  People:   { color: "bg-blue-50 border-blue-200",   badge: "bg-blue-100 text-blue-800",   icon: Users },
  Projects: { color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-800", icon: FolderKanban },
  Ideas:    { color: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-800",  icon: Lightbulb },
  Admin:    { color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-800", icon: ClipboardList },
};

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.85) return "text-green-600";
  if (confidence >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [archiveNoteId, setArchiveNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const statsQuery = trpc.notes.getCategoryStats.useQuery();
  const peopleQuery = trpc.notes.getByCategory.useQuery({ category: "People" });
  const projectsQuery = trpc.notes.getByCategory.useQuery({ category: "Projects" });
  const ideasQuery = trpc.notes.getByCategory.useQuery({ category: "Ideas" });
  const adminQuery = trpc.notes.getByCategory.useQuery({ category: "Admin" });

  const categoryQueries: Record<Category, typeof peopleQuery> = {
    People: peopleQuery,
    Projects: projectsQuery,
    Ideas: ideasQuery,
    Admin: adminQuery,
  };

  const captureMutation = trpc.notes.capture.useMutation();
  const deleteMutation = trpc.notes.delete.useMutation();
  const archiveMutation = trpc.notes.archive.useMutation();
  const updateMutation = trpc.notes.updateContent.useMutation();

  const refetchAll = () => {
    statsQuery.refetch();
    peopleQuery.refetch();
    projectsQuery.refetch();
    ideasQuery.refetch();
    adminQuery.refetch();
  };

  const handleCapture = async () => {
    if (!noteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await captureMutation.mutateAsync({ content: noteContent });
      toast.success(
        result.shouldReview
          ? "Note captured! Please review the classification."
          : "Note captured and classified successfully."
      );
      setNoteContent("");
      refetchAll();
    } catch {
      toast.error("Failed to capture note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await deleteMutation.mutateAsync({ noteId });
      toast.success("Note deleted.");
      refetchAll();
      setDeleteNoteId(null);
    } catch {
      toast.error("Failed to delete note.");
    }
  };

  const handleArchive = async (noteId: number) => {
    try {
      await archiveMutation.mutateAsync({ noteId });
      toast.success("Note archived.");
      refetchAll();
      setArchiveNoteId(null);
    } catch {
      toast.error("Failed to archive note.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editingNoteId === null) return;
    try {
      await updateMutation.mutateAsync({ noteId: editingNoteId, newContent: editContent });
      toast.success("Note updated.");
      refetchAll();
      setEditingNoteId(null);
      setEditContent("");
    } catch {
      toast.error("Failed to update note.");
    }
  };

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Capture and organise your thoughts</p>
      </div>

      {/* Capture form */}
      <Card>
        <CardHeader>
          <CardTitle>Capture a Note</CardTitle>
          <CardDescription>Enter your thought, task, or idea — AI will classify it instantly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Capture anything... a thought, a task, a meeting note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-24"
          />
          <Button onClick={handleCapture} disabled={isSubmitting || !noteContent.trim()} className="w-full">
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Capturing...</>
            ) : (
              "Capture Note"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const { icon: Icon, badge } = CATEGORY_CONFIG[cat];
          return (
            <Card
              key={cat}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLocation(`/category/${cat}`)}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${badge} bg-opacity-60`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{cat}</p>
                  <p className="text-2xl font-bold leading-none">
                    {statsQuery.isLoading ? "—" : (stats?.[cat] ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category sections — 2×2 grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const { color, badge, icon: Icon } = CATEGORY_CONFIG[cat];
          const query = categoryQueries[cat];
          const notes = (query.data ?? []).slice(0, 3);

          return (
            <div key={cat} className={`rounded-xl border p-4 space-y-3 ${color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">{cat}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1"
                  onClick={() => setLocation(`/category/${cat}`)}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>

              {query.isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">No notes yet</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => {
                    const confidence = parseFloat(note.confidence as unknown as string);
                    return (
                      <div key={note.id} className="bg-white/80 rounded-lg p-3 shadow-sm">
                        <p className="text-sm line-clamp-2 mb-2">{note.content}</p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${badge}`}>{note.category}</Badge>
                            <span className={`text-xs font-semibold ${getConfidenceColor(confidence)}`}>
                              {(confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                              onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50"
                              onClick={() => setArchiveNoteId(note.id)}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteNoteId(note.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteNoteId !== null} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteId && handleDelete(deleteNoteId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive dialog */}
      <AlertDialog open={archiveNoteId !== null} onOpenChange={(open) => !open && setArchiveNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Note</AlertDialogTitle>
            <AlertDialogDescription>The note will be hidden from the dashboard but can be restored from the Archive page.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveNoteId && handleArchive(archiveNoteId)}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Archiving...</> : "Archive"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <AlertDialog open={editingNoteId !== null} onOpenChange={(open) => !open && setEditingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Note</AlertDialogTitle>
            <AlertDialogDescription>Modify the content of your note below.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-24"
            placeholder="Edit your note..."
          />
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateMutation.isPending || !editContent.trim()}
            >
              {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
