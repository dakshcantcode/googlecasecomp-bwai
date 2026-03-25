"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ErrorChip from "./ErrorChip";
import type { SessionSummaryData, ErrorType } from "@/lib/api";

interface MasteryBarProps {
  label: string;
  before: number;
  after: number;
}

function MasteryBar({ label, before, after }: MasteryBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const delta = after - before;

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = `${before}%`;
    const id = setTimeout(() => { el.style.width = `${after}%`; }, 200);
    return () => clearTimeout(id);
  }, [before, after]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "var(--text-primary)" }}>{label}</span>
        <span style={{ color: delta >= 0 ? "#4ADE80" : "#F87171" }}>
          {delta >= 0 ? "+" : ""}{delta}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ background: "var(--accent-primary)", width: `${before}%` }}
        />
      </div>
      <div className="text-right text-xs" style={{ color: "var(--text-tertiary)" }}>
        {after}% mastery
      </div>
    </div>
  );
}

interface SessionSummaryProps {
  summary: SessionSummaryData;
  subjectId?: string;
}

export default function SessionSummary({ summary, subjectId }: SessionSummaryProps) {
  const errorEntries = Object.entries(summary.errorBreakdown).filter(([, v]) => v > 0) as [ErrorType, number][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full mx-auto space-y-6"
    >
      {/* Masthead */}
      <div className="text-center border-b pb-4" style={{ borderColor: "var(--border-default)" }}>
        <p className="newspaper-label mb-1">THE DAILY SYNAPSE</p>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          Session Recap
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {summary.correctCount} / {summary.questionCount} correct ·{" "}
          <span style={{ color: "var(--accent-primary)" }}>
            {Math.round((summary.correctCount / summary.questionCount) * 100)}% accuracy
          </span>
        </p>
      </div>

      {/* Mastery bars */}
      <div
        className="rounded-lg border p-5 space-y-4"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
      >
        <p className="newspaper-label">MASTERY CHANGES</p>
        {Object.entries(summary.masteryBefore).map(([concept, before]) => (
          <MasteryBar
            key={concept}
            label={concept.replace(/-/g, " ")}
            before={before}
            after={summary.masteryAfter[concept] ?? before}
          />
        ))}
      </div>

      {/* Error breakdown */}
      {errorEntries.length > 0 && (
        <div
          className="rounded-lg border p-5"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
        >
          <p className="newspaper-label mb-3">ERROR BREAKDOWN</p>
          <div className="flex flex-wrap gap-2">
            {errorEntries.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <ErrorChip type={type} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next review */}
      <div
        className="rounded-lg border p-5 text-center"
        style={{ background: "rgba(212,168,67,0.06)", borderColor: "rgba(212,168,67,0.3)" }}
      >
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--accent-primary)" }}>
          NEXT REVIEW
        </p>
        <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}>
          {summary.nextReviewDate}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Retrieval timed for maximum consolidation
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 justify-center">
        <Link href={subjectId ? `/web/${subjectId}` : "/dashboard"}>
          <Button variant="outline" className="rounded-full">
            Back to web
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button
            className="rounded-full"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          >
            Dashboard
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
