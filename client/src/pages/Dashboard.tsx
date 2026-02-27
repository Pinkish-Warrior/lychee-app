import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { Loader2, Trash2, Edit2, Archive, Users, FolderKanban, Lightbulb, ClipboardList, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";

const CATEGORIES = ["People", "Projects", "Ideas", "Admin"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_CONFIG: Record<Category, { color: string; badge: string; icon: React.ElementType }> = {
  People:   { color: "bg-blue-50 border-blue-200",   badge: "bg-blue-100 text-blue-800",   icon: Users },
  Projects: { color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-800", icon: FolderKanban },
  Ideas:    { color: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-800",  icon: Lightbulb },
  Admin:    { color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-800", icon: ClipboardList },
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

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const controls = animate(prevRef.current, value, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prevRef.current = value;
    return () => controls.stop();
  }, [value]);

  return <span>{display}</span>;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = (confidence * 100).toFixed(0);
  const label =
    confidence >= 0.85
      ? "High confidence"
      : confidence >= 0.6
      ? "Medium — may need review"
      : "Low — needs review";
  const icon = confidence >= 0.85 ? "🟢" : confidence >= 0.6 ? "🟡" : "🔴";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`flex items-center gap-0.5 text-xs font-semibold ${getConfidenceColor(confidence)} cursor-default`}
        >
          {pct}%
          <Info className="h-3 w-3 opacity-50" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {icon} {pct}% — {label}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

type NoteShape = {
  id: number;
  content: string;
  category: string;
  confidence: unknown;
};

type NoteCardProps = {
  note: NoteShape;
  badge: string;
  onEdit: (id: number, content: string) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
};

function NoteCard({ note, badge, onEdit, onArchive, onDelete }: NoteCardProps) {
  const confidence = parseFloat(note.confidence as unknown as string);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      className="bg-white/80 dark:bg-white/5 rounded-lg p-3 shadow-sm mb-2 last:mb-0"
    >
      <p className="text-sm font-medium line-clamp-2 mb-2 leading-snug text-gray-900">{note.content}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${badge}`}>{note.category}</Badge>
          <ConfidenceBadge confidence={confidence} />
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
            onClick={() => onEdit(note.id, note.content)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50"
            onClick={() => onArchive(note.id)}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
            onClick={() => onDelete(note.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function NoteSkeletons() {
  return (
    <div className="space-y-2">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white/80 dark:bg-white/5 rounded-lg p-3 shadow-sm">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type QueryType = {
  isLoading: boolean;
  data?: NoteShape[];
};

type CategorySectionProps = {
  cat: Category;
  color: string;
  badge: string;
  icon: React.ElementType;
  query: QueryType;
  removedIds: Set<number>;
  onViewAll: () => void;
  onEdit: (id: number, content: string) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
};

function CategorySection({
  cat,
  color,
  badge,
  icon: Icon,
  query,
  removedIds,
  onViewAll,
  onEdit,
  onArchive,
  onDelete,
}: CategorySectionProps) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 8);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 8);
  };

  const notes = (query.data ?? []).filter((n) => !removedIds.has(n.id)).slice(0, 3);

  return (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-xl border p-4 space-y-3 ${color}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {/* Parallax shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: mx, y: my }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent rounded-xl" />
      </motion.div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <h2 className="font-bold text-gray-900">{cat}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700 gap-1"
          onClick={onViewAll}
        >
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {query.isLoading ? (
        <NoteSkeletons />
      ) : notes.length === 0 ? (
        <p className="text-xs text-gray-400 py-3 text-center">No notes yet</p>
      ) : (
        <AnimatePresence initial={false}>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              badge={badge}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [archiveNoteId, setArchiveNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const statsQuery = trpc.notes.getCategoryStats.useQuery();
  const peopleQuery = trpc.notes.getByCategory.useQuery({ category: "People" });
  const projectsQuery = trpc.notes.getByCategory.useQuery({ category: "Projects" });
  const ideasQuery = trpc.notes.getByCategory.useQuery({ category: "Ideas" });
  const adminQuery = trpc.notes.getByCategory.useQuery({ category: "Admin" });

  const categoryQueries: Record<Category, QueryType> = {
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
      const cat = result.classification.category;
      toast.success(
        result.shouldReview
          ? `Saved to ${cat} — please review the classification`
          : `Saved to ${cat}`
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
    setRemovedIds((prev) => new Set([...prev, noteId]));
    setDeleteNoteId(null);
    try {
      await deleteMutation.mutateAsync({ noteId });
      toast.success("Note deleted.");
      refetchAll();
    } catch {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      toast.error("Failed to delete note.");
    }
  };

  const handleArchive = async (noteId: number) => {
    setRemovedIds((prev) => new Set([...prev, noteId]));
    setArchiveNoteId(null);
    try {
      await archiveMutation.mutateAsync({ noteId });
      toast.success("Note archived.");
      refetchAll();
    } catch {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Capture and organise your thoughts</p>
      </motion.div>

      {/* Capture form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.05 }}
      >
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
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {CATEGORIES.map((cat) => {
          const { icon: Icon, badge } = CATEGORY_CONFIG[cat];
          return (
            <motion.div key={cat} variants={itemVariants}>
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/category/${cat}`)}
              >
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${badge} bg-opacity-60`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</p>
                    <p className="text-2xl font-bold leading-none">
                      {statsQuery.isLoading ? (
                        <Skeleton className="h-7 w-8 inline-block" />
                      ) : (
                        <AnimatedCount value={stats?.[cat] ?? 0} />
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Category sections — 2×2 grid */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {CATEGORIES.map((cat) => {
          const { color, badge, icon } = CATEGORY_CONFIG[cat];
          return (
            <CategorySection
              key={cat}
              cat={cat}
              color={color}
              badge={badge}
              icon={icon}
              query={categoryQueries[cat]}
              removedIds={removedIds}
              onViewAll={() => setLocation(`/category/${cat}`)}
              onEdit={(id, content) => {
                setEditingNoteId(id);
                setEditContent(content);
              }}
              onArchive={(id) => setArchiveNoteId(id)}
              onDelete={(id) => setDeleteNoteId(id)}
            />
          );
        })}
      </motion.div>

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
