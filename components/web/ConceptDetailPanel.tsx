"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, BookOpen, Lock, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConceptNode } from "@/stores/webStore";

const STATE_CONFIG = {
  mastered: { label: "Mastered", color: "#4ADE80", Icon: CheckCircle },
  progress: { label: "In Progress", color: "#A78BFA", Icon: TrendingUp },
  decay: { label: "Decaying", color: "#FB923C", Icon: TrendingUp },
  locked: { label: "Locked", color: "rgba(180,180,180,0.6)", Icon: Lock },
};

interface ConceptDetailPanelProps {
  node: ConceptNode;
  subjectId: string;
  onClose: () => void;
}

export default function ConceptDetailPanel({ node, subjectId, onClose }: ConceptDetailPanelProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(true);

  const cfg = STATE_CONFIG[node.state] ?? STATE_CONFIG.locked;

  useEffect(() => {
    setSummary("");
    setLoadingSummary(true);
    fetch(`/api/concepts/${node.id}/summary`)
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary ?? "No summary available.");
      })
      .catch(() => setSummary("Could not load summary."))
      .finally(() => setLoadingSummary(false));
  }, [node.id]);

  function handleStudy() {
    router.push(`/study/learn/${node.id}?subject=${subjectId}`);
  }

  return (
    <div
      className="absolute top-0 right-0 h-full w-80 flex flex-col border-l z-30 overflow-y-auto"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <cfg.Icon size={14} style={{ color: cfg.color, flexShrink: 0 }} />
            <span className="text-xs font-medium" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              · {node.masteryPercent}%
            </span>
          </div>
          <h2
            className="text-lg font-bold leading-tight"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "var(--text-primary)",
            }}
          >
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:opacity-70 flex-shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {/* AI Summary */}
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Summary
          </p>
          {loadingSummary ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-3 rounded animate-pulse"
                  style={{
                    background: "var(--border-default)",
                    width: i === 3 ? "60%" : "100%",
                  }}
                />
              ))}
            </div>
          ) : (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {summary}
            </p>
          )}
        </div>

        {/* Mastery bar */}
        {node.masteryPercent > 0 && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Mastery
              </span>
              <span className="text-xs font-medium" style={{ color: cfg.color }}>
                {node.masteryPercent}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--border-default)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${node.masteryPercent}%`, background: cfg.color }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Button
          className="w-full rounded-full gap-2"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          onClick={handleStudy}
        >
          <BookOpen size={15} />
          Study this concept
        </Button>
        {node.state === "locked" && (
          <p
            className="text-xs text-center mt-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Studying will unlock this concept
          </p>
        )}
      </div>
    </div>
  );
}
