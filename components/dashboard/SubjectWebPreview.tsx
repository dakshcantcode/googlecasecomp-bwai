"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import type { Subject } from "@/stores/userStore";
import type { ConceptNode, ConceptStrand } from "@/stores/webStore";
import { MOCK_SUBJECTS } from "@/lib/mockSubjects";
import { initLayout, tickLayout } from "@/lib/webLayout";
import { Progress } from "@/components/ui/progress";

const STATE_COLORS: Record<ConceptNode["state"], string> = {
  mastered: "#4ADE80",
  progress: "#A78BFA",
  decay: "#FB923C",
  locked: "rgba(200,200,200,0.25)",
};

function MiniWebCanvas({ subjectId }: { subjectId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const graph = MOCK_SUBJECTS[subjectId];
    if (!graph) return;

    const inited = initLayout(graph.nodes.map((n) => n.id), graph.strands, cx, cy);
    let nodes: ConceptNode[] = graph.nodes.map((n) => {
      const pos = inited.find((p) => p.id === n.id)!;
      return { ...n, ...pos };
    });

    let frame = 0;
    let raf: number;

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Strands
      for (const s of graph.strands) {
        const a = nodes.find((n) => n.id === s.from);
        const b = nodes.find((n) => n.id === s.to);
        if (!a || !b) continue;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = "rgba(212,168,67,0.25)";
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      // Nodes
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
        ctx!.fillStyle = STATE_COLORS[n.state];
        ctx!.fill();
      }
    }

    function tick() {
      if (frame < 120) {
        nodes = tickLayout(nodes, graph.strands, cx, cy);
        frame++;
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [subjectId]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={100}
      className="w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
}

export default function SubjectWebPreview({ subject }: { subject: Subject }) {
  return (
    <Link href={`/web/${subject.id}`}>
      <div
        className="rounded-lg border overflow-hidden cursor-pointer transition-all hover:border-[var(--accent-primary)] hover:shadow-md"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Mini canvas */}
        <div className="h-[100px] relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
          <MiniWebCanvas subjectId={subject.id} />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3
              className="font-semibold text-sm"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
            >
              {subject.name}
            </h3>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {subject.nodeCount} nodes
            </span>
          </div>

          <Progress value={subject.masteryPercent} className="h-1 mb-2" />

          <div className="flex justify-between">
            <span className="text-xs" style={{ color: "var(--accent-primary)" }}>
              {subject.masteryPercent}% mastered
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {subject.lastStudied}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
