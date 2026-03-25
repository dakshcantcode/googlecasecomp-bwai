"use client";

import { Clock3 } from "lucide-react";
import { FlashcardDeck } from "./FlashcardDeck";
import type { Flashcard } from "@/app/api/concepts/[id]/flashcards/route";

interface FlashcardsModeProps {
  cards: Flashcard[];
}

export function FlashcardsMode({ cards }: FlashcardsModeProps) {
  return (
    <div className="relative py-4">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
            Flashcards
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {cards.length} cards · click to flip · Space bar
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
          style={{ background: "rgba(212,168,67,0.08)", color: "var(--accent-primary)" }}
        >
          <Clock3 size={12} />
          Global Pomodoro Active
        </div>
      </div>

      {/* Card deck */}
      <FlashcardDeck
        cards={cards}
        pomodoroPhase="idle"
        timeLeft={0}
      />
    </div>
  );
}
