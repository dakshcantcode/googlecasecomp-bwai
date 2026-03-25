"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LastSubjectTracker } from "@/components/web/LastSubjectTracker";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WebProgress from "@/components/web/WebProgress";
import ConceptDetailPanel from "@/components/web/ConceptDetailPanel";
import { MOCK_SUBJECTS } from "@/lib/mockSubjects";
import { startSession } from "@/lib/api";
import type { ConceptNode, ConceptStrand } from "@/stores/webStore";

const ConceptWeb = dynamic(() => import("@/components/web/ConceptWeb"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
      Building web…
    </div>
  ),
});

interface SubjectGraph {
  name?: string;
  nodes: ConceptNode[];
  strands: ConceptStrand[];
}

export default function WebPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subject_id as string;

  const [graph, setGraph] = useState<SubjectGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState("");
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  function fetchGraph() {
    return fetch(`/api/subjects/${subjectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error && Array.isArray(data.nodes)) {
          setGraph(data as SubjectGraph);
          if (data.name) setSubjectName(data.name);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    // Try mock data first (for legacy slug IDs like "calculus")
    const mock = MOCK_SUBJECTS[subjectId];
    if (mock) {
      setGraph(mock);
      setSubjectName(
        subjectId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      );
      setLoading(false);
      return;
    }
    fetchGraph();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  // Set fallback subject name
  useEffect(() => {
    if (!subjectName && graph) setSubjectName("Concept Web");
  }, [graph, subjectName]);

  // Auto-unlock if ALL nodes are locked (existing data from before the fix)
  useEffect(() => {
    if (
      graph &&
      graph.nodes.length > 0 &&
      graph.nodes.every((n) => n.state === "locked")
    ) {
      fetch(`/api/subjects/${subjectId}/unlock`, { method: "POST" })
        .then(() => fetchGraph())
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph?.nodes.length]);

  function handleNodeClick(node: ConceptNode) {
    setSelectedNode(node);
  }

  async function handleStudyAll() {
    const data = await startSession([], 10);
    if (data.sessionId) {
      router.push(`/study/${data.sessionId}?subject=${subjectId}`);
    }
  }

  if (!loading && !graph) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--bg-primary)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Subject not found or you don&apos;t have access.
        </p>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", background: "var(--bg-primary)", paddingTop: "60px" }}
    >
      <LastSubjectTracker subjectId={subjectId} />
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
        <Button
          size="sm"
          className="ml-auto rounded-full text-xs"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          onClick={handleStudyAll}
        >
          Start studying
        </Button>
      </div>

      {/* Progress bar */}
      {graph && <WebProgress nodes={graph.nodes} />}

      {/* Canvas + Detail panel */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
            Building web…
          </div>
        ) : graph ? (
          <>
            <ConceptWeb
              nodes={graph.nodes}
              strands={graph.strands}
              spiderNodeId={null}
              onNodeClick={handleNodeClick}
            />
            {selectedNode && (
              <ConceptDetailPanel
                node={selectedNode}
                subjectId={subjectId}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </>
        ) : null}
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
        <span className="ml-auto">Click any node to explore · Scroll to zoom</span>
      </div>
    </div>
  );
}
