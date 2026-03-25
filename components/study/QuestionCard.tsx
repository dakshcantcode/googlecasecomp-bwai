"use client";

import { motion } from "framer-motion";
import KaTeXRenderer from "./KaTeXRenderer";
import AnswerInput from "./AnswerInput";
import type { Question } from "@/lib/api";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onSubmit: (value: string) => void;
  onSkip: () => void;
  disabled?: boolean;
  sessionId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  "free-text": "Written response",
  "multiple-choice": "Multiple choice",
  numeric: "Numeric",
  "multi-step": "Step-by-step",
  latex: "Symbolic",
  teachback: "Teachback",
};

export default function QuestionCard({ question, index, total, onSubmit, onSkip, disabled, sessionId }: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="max-w-2xl w-full mx-auto"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="newspaper-label">{question.conceptLabel}</span>
        <span
          className="text-sm tabular-nums"
          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains, monospace)" }}
        >
          {index + 1} / {total}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              background: i < index ? "var(--accent-primary)" : i === index ? "rgba(212,168,67,0.5)" : "var(--border-default)",
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="rounded-lg border p-6 space-y-6"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
            {TYPE_LABELS[question.type] ?? question.type}
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            <KaTeXRenderer text={question.prompt} />
          </p>
        </div>

        <AnswerInput question={question} onSubmit={onSubmit} disabled={disabled} sessionId={sessionId} />

        <div className="flex justify-end">
          <button
            className="text-xs underline"
            style={{ color: "var(--text-tertiary)" }}
            onClick={onSkip}
            disabled={disabled}
          >
            Skip this question
          </button>
        </div>
      </div>
    </motion.div>
  );
}
