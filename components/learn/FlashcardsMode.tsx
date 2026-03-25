"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardDeck } from "./FlashcardDeck";
import { PomodoroRing } from "./PomodoroRing";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import type { Flashcard } from "@/app/api/concepts/[id]/flashcards/route";

interface FlashcardsModeProps {
  cards: Flashcard[];
}

export function FlashcardsMode({ cards }: FlashcardsModeProps) {
  const { state, start, pause, resume } = usePomodoroTimer(25, 5);
  const { phase, timeLeft, cyclesCompleted, isPaused } = state;

  const totalSeconds = phase === "break" ? 5 * 60 : 25 * 60;

  return (
    <div className="relative py-4">
      {/* Top bar: progress + ring */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
            Flashcards
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {cards.length} cards · click to flip · Space bar
          </p>
        </div>
        <PomodoroRing
          phase={phase}
          timeLeft={timeLeft}
          totalSeconds={totalSeconds}
          cyclesCompleted={cyclesCompleted}
          isPaused={isPaused}
          onPause={pause}
          onResume={resume}
        />
      </div>

      {/* Card deck */}
      <FlashcardDeck
        cards={cards}
        pomodoroPhase={phase}
        timeLeft={timeLeft}
      />

      {/* Start Pomodoro CTA — only when idle */}
      {phase === "idle" && (
        <div
          className="mt-6 flex flex-col items-center gap-2 py-4 rounded-xl border"
          style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Start a focused 25-min session with 5-min breaks
          </p>
          <Button
            size="sm"
            className="rounded-full gap-2"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            onClick={start}
          >
            <Play size={13} />
            Begin Pomodoro Session
          </Button>
        </div>
      )}
    </div>
  );
}
