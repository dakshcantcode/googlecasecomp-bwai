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
  size?: "sm" | "lg";
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
  size = "sm",
}: PomodoroRingProps) {
  const radius = size === "lg" ? 60 : 36;
  const svgSize = size === "lg" ? 156 : 96;
  const center = svgSize / 2;
  const strokeWidth = size === "lg" ? 8 : 6;
  const timeFontSize = size === "lg" ? 24 : 14;
  const labelFontSize = size === "lg" ? 11 : 9;
  const circumference = 2 * Math.PI * radius;
  const progress = phase === "idle" ? 1 : timeLeft / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  const strokeColor =
    phase === "break" ? "#4ADE80" : phase === "idle" ? "var(--border-default)" : "var(--accent-primary)";

  const phaseLabel = phase === "idle" ? "READY" : phase === "work" ? "WORK" : "BREAK";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
        {/* Time */}
        <text
          x={center} y={center - (size === "lg" ? 8 : 4)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={timeFontSize}
          fontWeight="600"
          fill="var(--text-primary)"
          fontFamily="var(--font-mono), monospace"
        >
          {formatTime(timeLeft)}
        </text>
        {/* Phase label */}
        <text
          x={center} y={center + (size === "lg" ? 16 : 12)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={labelFontSize}
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
          className={`flex items-center justify-center rounded-full transition-opacity hover:opacity-70 ${size === "lg" ? "w-10 h-10" : "w-7 h-7"}`}
          style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
          aria-label={isPaused ? "Resume timer" : "Pause timer"}
        >
          {isPaused ? <Play size={size === "lg" ? 16 : 12} /> : <Pause size={size === "lg" ? 16 : 12} />}
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
