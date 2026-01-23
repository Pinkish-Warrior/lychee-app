import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useRoute } from "wouter";

export default function CategoryView() {
  const [, params] = useRoute("/category/:category");
  const category = params?.category as "People" | "Projects" | "Ideas" | "Admin" | undefined;

  const categoryQuery = trpc.notes.getByCategory.useQuery(
    { category: category || "People" },
    { enabled: !!category }
  );

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
            No notes in this category yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
