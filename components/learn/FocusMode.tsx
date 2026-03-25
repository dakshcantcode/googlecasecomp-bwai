"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Challenge, ChallengesResponse } from "@/app/api/concepts/[id]/challenges/route";

interface FocusModeProps {
  data: ChallengesResponse;
}

const TYPE_COLORS: Record<Challenge["type"], string> = {
  recall: "#A78BFA",
  explain: "var(--accent-primary)",
  apply: "#4ADE80",
};

const TYPE_LABELS: Record<Challenge["type"], string> = {
  recall: "Recall",
  explain: "Explain",
  apply: "Apply",
};

function ChallengeCard({ challenge, onComplete }: { challenge: Challenge; onComplete: (xp: number) => void }) {
  const [phase, setPhase] = useState<"idle" | "active" | "done">("idle");
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [justEarned, setJustEarned] = useState(false);

  function handleSubmit() {
    setPhase("done");
    setJustEarned(true);
    onComplete(challenge.xp);
    setTimeout(() => setJustEarned(false), 2000);
  }

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        background: "var(--bg-secondary)",
        borderColor: phase === "done" ? "#4ADE80" : "var(--border-default)",
        borderLeftWidth: 3,
        borderLeftColor: phase === "done" ? "#4ADE80" : TYPE_COLORS[challenge.type],
      }}
    >
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {phase === "done" ? (
            <Check size={14} style={{ color: "#4ADE80", flexShrink: 0 }} />
          ) : (
            <Zap size={14} style={{ color: TYPE_COLORS[challenge.type], flexShrink: 0 }} />
          )}
          <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {challenge.title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ background: `${TYPE_COLORS[challenge.type]}20`, color: TYPE_COLORS[challenge.type] }}
          >
            {TYPE_LABELS[challenge.type]}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(212,168,67,0.1)", color: "var(--accent-primary)" }}>
            {challenge.xp} XP
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>5 min</span>
        </div>
      </div>

      {/* Expandable body */}
      {phase === "idle" && (
        <div className="px-4 pb-3">
          <Button
            size="sm"
            className="rounded-full text-xs gap-1"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            onClick={() => setPhase("active")}
          >
            Start Challenge
          </Button>
        </div>
      )}

      {phase === "active" && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{challenge.task}</p>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here…"
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none border outline-none"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="rounded-full text-xs"
              style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
              disabled={!answer.trim()}
              onClick={handleSubmit}
            >
              Submit
            </Button>
            <button
              className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--text-tertiary)" }}
              onClick={() => setShowHint((v) => !v)}
            >
              <Lightbulb size={11} />
              {showHint ? "Hide hint" : "Hint"}
              <ChevronDown size={10} className={showHint ? "rotate-180" : ""} />
            </button>
          </div>

          {showHint && (
            <p className="text-xs italic px-3 py-2 rounded" style={{ background: "rgba(212,168,67,0.06)", color: "var(--text-secondary)" }}>
              💡 {challenge.hint}
            </p>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="px-4 pb-4 space-y-2">
          <div
            className="rounded-lg px-3 py-2 text-xs border"
            style={{ background: "rgba(212,168,67,0.06)", borderColor: "rgba(212,168,67,0.2)", color: "var(--text-secondary)" }}
          >
            <p className="font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>Model answer</p>
            {challenge.answer_guide}
          </div>
          <AnimatePresence>
            {justEarned && (
              <motion.p
                key="xp"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold text-center"
                style={{ color: "#4ADE80" }}
              >
                +{challenge.xp} XP
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function FocusMode({ data }: FocusModeProps) {
  const [totalXp, setTotalXp] = useState(0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: "var(--accent-primary)" }} />
          <span className="newspaper-label text-[11px]">FOCUS MODE</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(212,168,67,0.12)", color: "var(--accent-primary)" }}
        >
          ⚡ {totalXp} XP
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {data.challenges.length} challenges · 5 min each · Complete at your own pace
      </p>

      <div className="space-y-3">
        {data.challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onComplete={(xp) => setTotalXp((prev) => prev + xp)}
          />
        ))}
      </div>
    </div>
  );
}
