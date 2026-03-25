"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import KaTeXRenderer from "./KaTeXRenderer";

interface Level {
  id: string;
  label: string;
  question: string;
  answer: string;
}

const MOCK_LEVELS: Level[] = [
  { id: "l1", label: "Recognition", question: "Which rule applies to $f(g(x))$?", answer: "chain rule" },
  { id: "l2", label: "Application", question: "Differentiate $\\sin(x^2)$.", answer: "2x cos" },
  { id: "l3", label: "Extension", question: "Differentiate $\\sin(\\cos(x^2))$ — three nested functions.", answer: "chain rule twice" },
  { id: "l4", label: "Novel context", question: "A chain rule applied to a physics velocity function: $v(t) = f(g(t))$. Express $dv/dt$.", answer: "f prime g t times g prime t" },
];

type LevelState = "idle" | "active" | "pass" | "fail";

export default function ReverseCaseTest({ onComplete }: { onComplete?: () => void }) {
  const [states, setStates] = useState<LevelState[]>(MOCK_LEVELS.map(() => "idle"));
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(MOCK_LEVELS.map(() => ""));
  const [started, setStarted] = useState(false);
  const [breakFound, setBreakFound] = useState<number | null>(null);

  function start() {
    setStarted(true);
    setStates(MOCK_LEVELS.map((_, i) => (i === 0 ? "active" : "idle")));
  }

  function submit(idx: number) {
    const level = MOCK_LEVELS[idx];
    const correct = answers[idx].toLowerCase().includes(level.answer.toLowerCase().split(" ")[0]);

    const next = [...states];
    next[idx] = correct ? "pass" : "fail";

    if (!correct) {
      // Mark remaining as idle — break point found
      setBreakFound(idx);
      setStates(next);
      return;
    }

    if (idx + 1 < MOCK_LEVELS.length) {
      next[idx + 1] = "active";
      setActiveIdx(idx + 1);
    } else {
      onComplete?.();
    }
    setStates(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="newspaper-label mb-1">REVERSE CASE TEST</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Progress through complexity levels. We find exactly where your understanding breaks.
        </p>
      </div>

      {!started ? (
        <Button
          onClick={start}
          className="rounded-full"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        >
          Begin test
        </Button>
      ) : (
        <div className="space-y-3">
          {MOCK_LEVELS.map((level, i) => {
            const s = states[i];
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border p-4"
                style={{
                  borderColor:
                    s === "pass" ? "rgba(74,222,128,0.4)" :
                    s === "fail" ? "rgba(248,113,113,0.4)" :
                    s === "active" ? "rgba(212,168,67,0.4)" :
                    "var(--border-default)",
                  background: "var(--bg-secondary)",
                  opacity: s === "idle" ? 0.4 : 1,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        s === "pass" ? "rgba(74,222,128,0.2)" :
                        s === "fail" ? "rgba(248,113,113,0.2)" :
                        s === "active" ? "rgba(212,168,67,0.2)" :
                        "var(--bg-primary)",
                      color:
                        s === "pass" ? "#4ADE80" :
                        s === "fail" ? "#F87171" :
                        s === "active" ? "var(--accent-primary)" :
                        "var(--text-tertiary)",
                    }}
                  >
                    {s === "pass" ? "✓" : s === "fail" ? "✗" : i + 1}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {level.label}
                  </span>
                </div>

                {s === "active" && (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      <KaTeXRenderer text={level.question} />
                    </p>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded border px-3 py-1.5 text-sm outline-none"
                        style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                        placeholder="Answer…"
                        value={answers[i]}
                        onChange={(e) => {
                          const next = [...answers];
                          next[i] = e.target.value;
                          setAnswers(next);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") submit(i); }}
                      />
                      <Button
                        size="sm"
                        disabled={!answers[i]}
                        onClick={() => submit(i)}
                        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                        className="rounded px-3"
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {breakFound !== null && (
            <div
              className="rounded-lg px-4 py-3 text-sm border"
              style={{
                background: "rgba(248,113,113,0.06)",
                borderColor: "rgba(248,113,113,0.3)",
                color: "var(--text-primary)",
              }}
            >
              Understanding breaks at <strong>{MOCK_LEVELS[breakFound].label}</strong>. A targeted drill has been queued.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
