"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WebProgress from "@/components/web/WebProgress";
import { MOCK_SUBJECTS } from "@/lib/mockSubjects";
import type { ConceptNode } from "@/stores/webStore";

const ConceptWeb = dynamic(() => import("@/components/web/ConceptWeb"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
      Building web…
    </div>
  ),
});

export default function WebPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subject_id as string;

  const graph = useMemo(() => MOCK_SUBJECTS[subjectId] ?? null, [subjectId]);

  function handleNodeClick(node: ConceptNode) {
    if (node.state !== "locked") {
      router.push(`/study/mock-session?concept=${node.id}&subject=${subjectId}`);
    }
  }

  if (!graph) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Subject not found.</p>
      </div>
    );
  }

  const subjectName = subjectId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", background: "var(--bg-primary)", paddingTop: "60px" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => router.push("/dashboard")}
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={14} />
          Dashboard
        </Button>
        <span className="newspaper-label">{subjectName}</span>
      </div>

      {/* Progress bar */}
      <WebProgress nodes={graph.nodes} />

      {/* Canvas — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <ConceptWeb
          nodes={graph.nodes}
          strands={graph.strands}
          spiderNodeId={null}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-6 px-4 py-2 border-t text-xs flex-shrink-0"
        style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
      >
        {[
          { color: "#4ADE80", label: "Mastered" },
          { color: "#A78BFA", label: "In progress" },
          { color: "#FB923C", label: "Decaying" },
          { color: "rgba(180,180,180,0.4)", label: "Locked" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
        <span className="ml-auto">Scroll to zoom · Drag to pan · Click to study</span>
      </div>
    </div>
  );
}
