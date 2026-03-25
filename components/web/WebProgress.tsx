"use client";

import { Progress } from "@/components/ui/progress";
import type { ConceptNode } from "@/stores/webStore";

interface WebProgressProps {
  nodes: ConceptNode[];
}

export default function WebProgress({ nodes }: WebProgressProps) {
  const mastered = nodes.filter((n) => n.state === "mastered").length;
  const total = nodes.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
      <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>
        MASTERY
      </span>
      <div className="flex-1">
        <Progress value={pct} className="h-1.5" />
      </div>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: "var(--accent-primary)", fontFamily: "var(--font-jetbrains, monospace)" }}
      >
        {mastered}/{total}
      </span>
    </div>
  );
}
