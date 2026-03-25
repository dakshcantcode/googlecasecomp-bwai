"use client";

import { Play, RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { PomodoroRing } from "@/components/learn/PomodoroRing";
import { Button } from "@/components/ui/button";

export function GlobalPomodoroDock() {
  const pathname = usePathname();
  const { state, start, pause, resume, reset } = usePomodoroTimer(25, 5);
  const { phase, timeLeft, cyclesCompleted, isPaused } = state;

  if (pathname?.startsWith("/auth")) return null;

  // Timer card should appear only while actively running.
  if (phase === "idle" || isPaused) {
    return (
      <button
        onClick={start}
        className="fixed bottom-5 right-5 z-[55] w-12 h-12 rounded-full border flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{
          background: "var(--accent-primary)",
          color: "#1A1A1A",
          borderColor: "rgba(212,168,67,0.45)",
        }}
        aria-label="Start global pomodoro"
        title="Start global pomodoro"
      >
        <Play size={16} />
      </button>
    );
  }

  const totalSeconds = phase === "break" ? 5 * 60 : 25 * 60;

  return (
    <aside
      className="fixed bottom-5 right-5 z-[55] rounded-2xl border p-4 w-[230px] shadow-xl"
      style={{
        background: "color-mix(in srgb, var(--bg-secondary) 94%, transparent)",
        borderColor: "var(--border-default)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="newspaper-label text-[10px]">GLOBAL FOCUS TIMER</span>
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          25/5
        </span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <PomodoroRing
          size="lg"
          phase={phase}
          timeLeft={timeLeft}
          totalSeconds={totalSeconds}
          cyclesCompleted={cyclesCompleted}
          isPaused={isPaused}
          onPause={pause}
          onResume={resume}
        />

        <div className="flex items-center gap-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            onClick={reset}
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
          >
            <RotateCcw size={13} /> Reset
          </Button>
        </div>
      </div>
    </aside>
  );
}
