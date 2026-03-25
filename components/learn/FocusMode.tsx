"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Flame, Sparkles, ShieldCheck, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Challenge, ChallengesResponse } from "@/app/api/concepts/[id]/challenges/route";

interface FocusModeProps {
  data: ChallengesResponse;
}

type QuestionState = "idle" | "answered";

function typeLabel(type: Challenge["type"]) {
  if (type === "recall") return "Warmup";
  if (type === "explain") return "Reasoning";
  return "Application";
}

function typeColor(type: Challenge["type"]) {
  if (type === "recall") return "#60A5FA";
  if (type === "explain") return "var(--accent-primary)";
  return "#4ADE80";
}

function computeBonus(streak: number) {
  if (streak >= 8) return 1.5;
  if (streak >= 5) return 1.3;
  if (streak >= 3) return 1.15;
  return 1;
}

export function FocusMode({ data }: FocusModeProps) {
  const challenges = data.challenges;

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [state, setState] = useState<QuestionState>("idle");
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [pulse, setPulse] = useState(false);

  const totalXp = useMemo(
    () => challenges.reduce((sum, c) => sum + c.xp, 0),
    [challenges]
  );

  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border p-6" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
        <p style={{ color: "var(--text-secondary)" }}>No focus challenges available yet.</p>
      </div>
    );
  }

  const challenge = challenges[Math.min(index, challenges.length - 1)];
  const done = index >= challenges.length;
  const progress = Math.round((Math.min(index, challenges.length) / challenges.length) * 100);

  function handleSelect(optionIndex: number) {
    if (state === "answered") return;
    setSelected(optionIndex);
  }

  function handleSubmit() {
    if (selected == null || state === "answered") return;

    const isCorrect = selected === challenge.correct_option_index;
    setState("answered");

    if (isCorrect) {
      const nextStreak = streak + 1;
      const multiplier = computeBonus(nextStreak);
      const gained = Math.round(challenge.xp * multiplier);
      setScore((s) => s + gained);
      setCorrect((c) => c + 1);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    } else {
      setStreak(0);
    }
  }

  function nextQuestion() {
    setIndex((i) => i + 1);
    setSelected(null);
    setState("idle");
  }

  function restart() {
    setStarted(true);
    setIndex(0);
    setSelected(null);
    setState("idle");
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border p-4 md:p-5"
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(212,168,67,0.20), transparent 45%), radial-gradient(circle at 85% 100%, rgba(74,222,128,0.16), transparent 40%), var(--bg-secondary)",
          borderColor: "rgba(212,168,67,0.35)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: "var(--accent-primary)" }} />
            <span className="newspaper-label text-[11px]">FOCUS ARENA</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <Flame size={12} style={{ color: "#FB923C" }} /> Streak {streak}
            </span>
            <span className="flex items-center gap-1" style={{ color: "var(--accent-primary)" }}>
              <Trophy size={12} /> {score} pts
            </span>
          </div>
        </div>

        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, #4ADE80 0%, var(--accent-primary) 100%)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          <span>{Math.min(index, challenges.length)} / {challenges.length} cleared</span>
          <span>Max {totalXp} base XP</span>
        </div>
      </div>

      {!started && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-6 space-y-4"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Enter Focus Arena
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Battle through timed-feel multiple choice rounds. Build streaks, rack up points, and lock in concepts.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg p-2" style={{ background: "rgba(212,168,67,0.08)", color: "var(--text-secondary)" }}>6 rounds</div>
            <div className="rounded-lg p-2" style={{ background: "rgba(74,222,128,0.10)", color: "var(--text-secondary)" }}>Streak multipliers</div>
            <div className="rounded-lg p-2" style={{ background: "rgba(96,165,250,0.10)", color: "var(--text-secondary)" }}>Instant feedback</div>
            <div className="rounded-lg p-2" style={{ background: "rgba(251,146,60,0.10)", color: "var(--text-secondary)" }}>Boss summary</div>
          </div>
          <Button
            className="rounded-full"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            onClick={() => setStarted(true)}
          >
            Start Arena
          </Button>
        </motion.div>
      )}

      {started && !done && (
        <AnimatePresence mode="wait">
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border p-5 md:p-6"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <span
                className="text-[10px] px-2 py-1 rounded-full"
                style={{ background: `${typeColor(challenge.type)}20`, color: typeColor(challenge.type) }}
              >
                {typeLabel(challenge.type)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {challenge.xp} base XP
              </span>
            </div>

            <h3 className="text-lg font-semibold leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
              {challenge.task}
            </h3>

            <div className="space-y-2.5">
              {challenge.options.map((option, i) => {
                const isSelected = selected === i;
                const isCorrect = i === challenge.correct_option_index;
                const showReveal = state === "answered";

                const borderColor = showReveal
                  ? isCorrect
                    ? "#4ADE80"
                    : isSelected
                    ? "#F87171"
                    : "var(--border-default)"
                  : isSelected
                  ? "var(--accent-primary)"
                  : "var(--border-default)";

                const background = showReveal
                  ? isCorrect
                    ? "rgba(74,222,128,0.12)"
                    : isSelected
                    ? "rgba(248,113,113,0.10)"
                    : "var(--bg-primary)"
                  : isSelected
                  ? "rgba(212,168,67,0.10)"
                  : "var(--bg-primary)";

                return (
                  <button
                    key={i}
                    className="w-full text-left rounded-lg px-3 py-3 border transition-all"
                    style={{ borderColor, background, color: "var(--text-primary)" }}
                    onClick={() => handleSelect(i)}
                    disabled={state === "answered"}
                  >
                    <span className="text-xs mr-2" style={{ color: "var(--text-tertiary)" }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-sm">{option}</span>
                  </button>
                );
              })}
            </div>

            {state === "idle" && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Hint: {challenge.hint}
                </p>
                <Button
                  size="sm"
                  className="rounded-full"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                  disabled={selected == null}
                  onClick={handleSubmit}
                >
                  Lock Answer
                </Button>
              </div>
            )}

            {state === "answered" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg border p-3"
                style={{
                  borderColor:
                    selected === challenge.correct_option_index ? "rgba(74,222,128,0.45)" : "rgba(248,113,113,0.45)",
                  background:
                    selected === challenge.correct_option_index ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.06)",
                }}
              >
                <div className="flex items-start gap-2">
                  {selected === challenge.correct_option_index ? (
                    <ShieldCheck size={16} style={{ color: "#4ADE80", marginTop: 1 }} />
                  ) : (
                    <XCircle size={16} style={{ color: "#F87171", marginTop: 1 }} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      {selected === challenge.correct_option_index ? "Correct" : "Not quite"}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {challenge.explanation}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <AnimatePresence>
                    {selected === challenge.correct_option_index && pulse && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: "#4ADE80" }}
                      >
                        <Sparkles size={12} />
                        +{Math.round(challenge.xp * computeBonus(streak))} pts
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    size="sm"
                    className="rounded-full"
                    style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                    onClick={nextQuestion}
                  >
                    Next Round
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {started && done && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-6 text-center"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
        >
          <p className="text-4xl mb-3">🏆</p>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Arena Complete
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            You got {correct}/{challenges.length} correct with a best streak of {bestStreak}.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-5 text-xs">
            <div className="rounded-lg py-2" style={{ background: "rgba(212,168,67,0.10)", color: "var(--accent-primary)" }}>
              <p className="font-semibold">{score}</p>
              <p>Points</p>
            </div>
            <div className="rounded-lg py-2" style={{ background: "rgba(74,222,128,0.10)", color: "#4ADE80" }}>
              <p className="font-semibold">{Math.round((correct / challenges.length) * 100)}%</p>
              <p>Accuracy</p>
            </div>
            <div className="rounded-lg py-2" style={{ background: "rgba(251,146,60,0.10)", color: "#FB923C" }}>
              <p className="font-semibold">{bestStreak}</p>
              <p>Best Streak</p>
            </div>
          </div>

          <Button
            className="rounded-full"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            onClick={restart}
          >
            Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
