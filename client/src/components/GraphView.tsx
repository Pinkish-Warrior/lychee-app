import { useRef, useCallback } from "react";
import { ForceGraph2D } from "react-force-graph";
import { trpc } from "../lib/trpc";

const CATEGORY_COLOURS: Record<string, string> = {
  People:   "#f97316",
  Projects: "#3b82f6",
  Ideas:    "#a855f7",
  Admin:    "#22c55e",
};

export function GraphView() {
  const graphRef = useRef<any>(undefined);
  const { data, isLoading } = trpc.graph.getData.useQuery();

  const handleNodeClick = useCallback((node: any) => {
    graphRef.current?.centerAt(node.x, node.y, 500);
    graphRef.current?.zoom(4, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Loading graph…
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No notes yet — capture some ideas to see your graph.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-xl border bg-background overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel={(node: any) => `[${node.category}] ${node.label}`}
        nodeColor={(node: any) => CATEGORY_COLOURS[node.category] ?? "#6b7280"}
        nodeRelSize={6}
        linkWidth={(link: any) => parseFloat(link.strength) * 3}
        linkColor={() => "#e5e7eb"}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.004}
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (globalScale < 2) return;
          const label = node.label.slice(0, 30);
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = "#111827";
          ctx.textAlign = "center";
          ctx.fillText(label, node.x, node.y + 10);
        }}
      />

      <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-background/80 p-2 rounded-lg border text-xs">
        {Object.entries(CATEGORY_COLOURS).map(([cat, colour]) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: colour }} />
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}
