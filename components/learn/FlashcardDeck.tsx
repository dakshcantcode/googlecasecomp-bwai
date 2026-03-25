"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, RotateCcw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";
import type { Flashcard } from "@/app/api/concepts/[id]/flashcards/route";
import type { PomodoroPhase } from "@/hooks/usePomodoroTimer";

interface FlashcardDeckProps {
  cards: Flashcard[];
  pomodoroPhase: PomodoroPhase;
  timeLeft: number;
}

export function FlashcardDeck({ cards, pomodoroPhase, timeLeft }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [stillLearning, setStillLearning] = useState<Set<number>>(new Set());

  const openWithContext = useChatStore((s) => s.openWithContext);
  const total = cards.length;
  const card = cards[currentIndex];

  function handleAskTutor() {
    openWithContext(`Explain this flashcard — Front: ${card.front}. Back: ${card.back}`);
  }

  function goTo(index: number) {
    setCurrentIndex(index);
    setIsFlipped(false);
  }

  function prev() { goTo((currentIndex - 1 + total) % total); }
  function next() { goTo((currentIndex + 1) % total); }

  function markKnown() {
    setKnown((s) => new Set(s).add(currentIndex));
    setStillLearning((s) => { const n = new Set(s); n.delete(currentIndex); return n; });
    next();
  }

  function markLearning() {
    setStillLearning((s) => new Set(s).add(currentIndex));
    setKnown((s) => { const n = new Set(s); n.delete(currentIndex); return n; });
    next();
  }

  function resetDeck() {
    setKnown(new Set());
    setStillLearning(new Set());
    goTo(0);
  }

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") { e.preventDefault(); setIsFlipped((f) => !f); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const statusColor = known.has(currentIndex)
    ? "#4ADE80"
    : stillLearning.has(currentIndex)
    ? "#FB923C"
    : "var(--text-tertiary)";

  return (
    <div className="relative">
      {/* Break overlay */}
      {pomodoroPhase === "break" && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
          style={{ background: "rgba(26,26,26,0.92)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-4xl mb-3">☕</p>
          <p className="text-lg font-semibold" style={{ color: "#4ADE80" }}>Break time!</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Rest for {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{
              background: i === currentIndex
                ? "var(--accent-primary)"
                : known.has(i)
                ? "#4ADE80"
                : stillLearning.has(i)
                ? "#FB923C"
                : "var(--border-default)",
              transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
            }}
            aria-label={`Card ${i + 1}`}
          />
        ))}
      </div>

      {/* Counter */}
      <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
        Card {currentIndex + 1} of {total} · {known.size} known · {stillLearning.size} reviewing
        <span className="ml-2" style={{ color: statusColor }}>
          {known.has(currentIndex) ? "✓ Known" : stillLearning.has(currentIndex) ? "↩ Still learning" : ""}
        </span>
      </p>

      {/* Card */}
      <div
        className="cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={() => setIsFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label="Click to flip card"
        onKeyDown={(e) => e.key === "Enter" && setIsFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d", position: "relative", height: "220px" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-8 py-6 border"
            style={{
              backfaceVisibility: "hidden",
              background: "var(--bg-secondary)",
              borderColor: "var(--border-default)",
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              Question
            </p>
            <p
              className="text-center text-lg font-semibold leading-snug"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {card.front}
            </p>
            <p className="text-xs mt-6" style={{ color: "var(--text-tertiary)" }}>
              Click or press Space to reveal
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-8 py-6 border"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "var(--bg-secondary)",
              borderColor: "var(--accent-primary)",
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--accent-primary)" }}>
              Answer
            </p>
            <p className="text-center text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {card.back}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Action buttons — visible when flipped */}
      <div className="mt-4 flex justify-center gap-3">
        {isFlipped ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full"
              style={{ borderColor: "#FB923C", color: "#FB923C" }}
              onClick={(e) => { e.stopPropagation(); markLearning(); }}
            >
              ↩ Still learning
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-full"
              style={{ background: "#4ADE80", color: "#1A1A1A" }}
              onClick={(e) => { e.stopPropagation(); markKnown(); }}
            >
              <Check size={13} /> Know it
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 rounded-full text-xs"
              style={{ color: "var(--text-secondary)" }}
              onClick={(e) => { e.stopPropagation(); handleAskTutor(); }}
            >
              <Bot size={13} /> Ask Tutor
            </Button>
          </>
        ) : (
          <div className="flex gap-3">
            <Button size="icon" variant="ghost" onClick={prev} style={{ color: "var(--text-secondary)" }}>
              <ChevronLeft size={18} />
            </Button>
            <Button size="icon" variant="ghost" onClick={next} style={{ color: "var(--text-secondary)" }}>
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </div>

      {/* Reset */}
      {(known.size + stillLearning.size) > 0 && (
        <div className="flex justify-center mt-3">
          <button
            onClick={resetDeck}
            className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-tertiary)" }}
          >
            <RotateCcw size={11} /> Reset progress
          </button>
        </div>
      )}

      <p className="text-xs text-center mt-3" style={{ color: "var(--text-tertiary)" }}>
        ← → navigate · Space flip
      </p>
    </div>
  );
}
