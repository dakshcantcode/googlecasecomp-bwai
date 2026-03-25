"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearnMode } from "./ModeSelector";

interface ModeErrorProps {
  mode: Exclude<LearnMode, "notes">;
  onRetry: () => void;
}

const LABELS: Record<Exclude<LearnMode, "notes">, string> = {
  flashcards: "flashcard",
  visual: "visual",
  audio: "audio",
  focus: "focus challenges",
  scholar: "scholar",
};

export function ModeError({ mode, onRetry }: ModeErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <AlertTriangle size={28} style={{ color: "var(--text-tertiary)" }} />
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Couldn&apos;t generate {LABELS[mode]} content
      </p>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-full"
        onClick={onRetry}
      >
        <RefreshCw size={13} /> Try again
      </Button>
    </div>
  );
}
