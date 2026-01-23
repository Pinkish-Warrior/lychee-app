import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ReviewQueue() {
  const reviewQuery = trpc.notes.getReviewQueue.useQuery();
  const correctMutation = trpc.notes.correctClassification.useMutation();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleCorrect = async (noteId: number, category: string) => {
    setProcessingId(noteId);
    try {
      await correctMutation.mutateAsync({
        noteId,
        correctedCategory: category as "People" | "Projects" | "Ideas" | "Admin",
      });

      toast.success("Classification updated");
      reviewQuery.refetch();
    } catch (error) {
      toast.error("Failed to update classification");
      console.error(error);
    } finally {
      setProcessingId(null);
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

  const categories = ["People", "Projects", "Ideas", "Admin"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Review Queue</h1>
        <p className="text-gray-600">Items the AI was not highly confident about</p>
      </div>

      {reviewQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : reviewQuery.data && reviewQuery.data.length > 0 ? (
        <div className="space-y-4">
          {reviewQuery.data.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{note.content}</CardTitle>
                    <CardDescription className="mt-2">{note.reasoning}</CardDescription>
                  </div>
                  <Badge className={getCategoryColor(note.category)}>
                    {note.category} ({(parseFloat(note.confidence as unknown as string) * 100).toFixed(0)}%)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Confirm or change classification:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={note.category === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCorrect(note.id, category)}
                        disabled={processingId === note.id}
                        className="w-full"
                      >
                        {processingId === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          category
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No items in review queue. All your notes have been classified with high confidence!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
