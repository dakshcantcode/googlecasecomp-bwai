"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorChip from "./ErrorChip";
import KaTeXRenderer from "./KaTeXRenderer";
import type { GradeResult } from "@/lib/api";

const METACOGNITIVE_MSGS = [
  "Notice how that felt — that confidence is the signal.",
  "Your retrieval was effortful. That's exactly when encoding deepens.",
  "Correct. The struggle you felt was your brain building new pathways.",
  "Right answer, right process. Don't let it become automatic too quickly.",
];

interface FeedbackCardProps {
  result: GradeResult;
  onNext: () => void;
  onRetry?: () => void;
  onAskTutor?: () => void;
}

export default function FeedbackCard({ result, onNext, onRetry, onAskTutor }: FeedbackCardProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const meta = METACOGNITIVE_MSGS[Math.floor(Math.random() * METACOGNITIVE_MSGS.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-6 space-y-4"
      style={{
        background: "var(--bg-secondary)",
        borderColor: result.correct ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)",
        borderLeftWidth: 4,
        borderLeftColor: result.correct ? "#4ADE80" : "#F87171",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            background: result.correct ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)",
            color: result.correct ? "#4ADE80" : "#F87171",
          }}
        >
          {result.correct ? "✓" : "✗"}
        </div>
        <div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            {result.correct ? "Correct" : "Not quite"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {result.explanation}
          </p>
          {result.correct && (
            <p className="text-xs italic mt-2" style={{ color: "var(--text-tertiary)" }}>
              {meta}
            </p>
          )}
        </div>
      </div>

      {/* Error chip */}
      {!result.correct && result.errorType && (
        <ErrorChip type={result.errorType} />
      )}

      {/* Hint collapsible */}
      {!result.correct && result.hint && (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
          <button
            className="w-full flex items-center justify-between px-4 py-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setHintOpen((o) => !o)}
          >
            <span>Show hint</span>
            <ChevronDown size={14} className={`transition-transform ${hintOpen ? "rotate-180" : ""}`} />
          </button>
          {hintOpen && (
            <div className="px-4 pb-3 text-sm" style={{ color: "var(--text-primary)", background: "var(--bg-primary)" }}>
              <KaTeXRenderer text={result.hint} />
            </div>
          )}
        </div>
      )}

      {/* Pattern alert */}
      {result.patternAlert && (
        <div
          className="rounded-lg px-4 py-3 border text-sm"
          style={{
            background: "rgba(212,168,67,0.06)",
            borderColor: "rgba(212,168,67,0.4)",
            color: "var(--text-primary)",
          }}
        >
          <p className="font-semibold text-xs uppercase tracking-wider mb-1" style={{ color: "var(--accent-primary)" }}>
            Pattern detected
          </p>
          <p>
            You've made {result.patternAlert.count} {result.patternAlert.errorType} errors. A targeted drill has been queued.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1 flex-wrap">
        {!result.correct && onRetry && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Button
          size="sm"
          className="rounded-full"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          onClick={onNext}
        >
          Next question
        </Button>
        {onAskTutor && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5 ml-auto text-xs"
            style={{ color: "var(--text-secondary)" }}
            onClick={onAskTutor}
          >
            <Bot size={13} /> Ask Tutor
          </Button>
        )}
      </div>
    </motion.div>
  );
}
