import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dashboardQuery = trpc.notes.getDashboard.useQuery();
  const captureMutation = trpc.notes.capture.useMutation();

  const handleCapture = async () => {
    if (!noteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await captureMutation.mutateAsync({
        content: noteContent,
      });

      toast.success(
        result.shouldReview
          ? "Note captured! Please review the classification."
          : "Note captured and classified successfully."
      );

      setNoteContent("");
      dashboardQuery.refetch();
    } catch (error) {
      toast.error("Failed to capture note. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      People: "bg-blue-100 text-blue-800",
      Projects: "bg-purple-100 text-purple-800",
      Ideas: "bg-green-100 text-green-800",
      Admin: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Capture and organize your thoughts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capture a Note</CardTitle>
          <CardDescription>Enter your thought, task, or idea below</CardDescription>
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
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Capturing...
              </>
            ) : (
              "Capture Note"
            )}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Notes</h2>
        {dashboardQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : dashboardQuery.data && dashboardQuery.data.length > 0 ? (
          <div className="space-y-3">
            {dashboardQuery.data.map((note) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                      <p className="text-xs text-gray-500">{note.reasoning}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getCategoryColor(note.category)}>{note.category}</Badge>
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
              No notes yet. Start by capturing your first note above!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
