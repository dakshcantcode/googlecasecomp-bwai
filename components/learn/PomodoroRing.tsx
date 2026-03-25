"use client";

import { Pause, Play } from "lucide-react";
import type { PomodoroPhase } from "@/hooks/usePomodoroTimer";

interface PomodoroRingProps {
  phase: PomodoroPhase;
  timeLeft: number;
  totalSeconds: number;
  cyclesCompleted: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PomodoroRing({
  phase,
  timeLeft,
  totalSeconds,
  cyclesCompleted,
  isPaused,
  onPause,
  onResume,
}: PomodoroRingProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = phase === "idle" ? 1 : timeLeft / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  const strokeColor =
    phase === "break" ? "#4ADE80" : phase === "idle" ? "var(--border-default)" : "var(--accent-primary)";

  const phaseLabel = phase === "idle" ? "READY" : phase === "work" ? "WORK" : "BREAK";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="6"
        />
        {/* Progress */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
        {/* Time */}
        <text
          x="48" y="44"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="600"
          fill="var(--text-primary)"
          fontFamily="var(--font-mono), monospace"
        >
          {formatTime(timeLeft)}
        </text>
        {/* Phase label */}
        <text
          x="48" y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill={strokeColor}
          fontWeight="700"
          letterSpacing="1"
        >
          {phaseLabel}
        </text>
      </svg>

      {phase !== "idle" && (
        <button
          onClick={isPaused ? onResume : onPause}
          className="flex items-center justify-center w-7 h-7 rounded-full transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
          aria-label={isPaused ? "Resume timer" : "Pause timer"}
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
        </button>
      )}

      {cyclesCompleted > 0 && (
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {cyclesCompleted} cycle{cyclesCompleted > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
