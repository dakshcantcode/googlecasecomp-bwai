"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import KaTeXRenderer from "./KaTeXRenderer";
import type { ConceptData } from "@/lib/mockConcepts";

interface Props {
  concept: ConceptData;
  onTryQuestion: () => void;
}

// Key points derived from the simplified text paragraphs
function extractKeyPoints(text: string): string[] {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default function AudioWalkthrough({ concept, onTryQuestion }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activePoint, setActivePoint] = useState(0);

  const keyPoints = extractKeyPoints(concept.simplified_text);
  // Mock timestamps: evenly divide a 3-minute walkthrough
  const mockDuration = 180;
  const pointInterval = mockDuration / keyPoints.length;

  function togglePlay() {
    // No real audio in mock — simulate progress
    if (playing) {
      setPlaying(false);
    } else {
      setPlaying(true);
      // Simulate audio advancing
      let elapsed = progress * mockDuration;
      const iv = setInterval(() => {
        elapsed += 0.5;
        const newProgress = Math.min(elapsed / mockDuration, 1);
        setProgress(newProgress);
        setActivePoint(Math.min(Math.floor(elapsed / pointInterval), keyPoints.length - 1));
        if (newProgress >= 1) {
          clearInterval(iv);
          setPlaying(false);
        }
      }, 500);
    }
  }

  const elapsed = Math.floor(progress * mockDuration);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const totalMin = Math.floor(mockDuration / 60);
  const totalSec = mockDuration % 60;

  return (
    <div className="rounded-lg border p-6 space-y-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      <div>
        <span className="newspaper-label">AUDIO WALKTHROUGH</span>
        <div className="newspaper-rule mt-1 mb-3" />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {concept.label}
        </h2>
      </div>

      {/* Player */}
      <div
        className="rounded-lg px-4 py-3 flex items-center gap-3"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)" }}
      >
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div className="flex-1 space-y-1">
          {/* Seek bar */}
          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: "var(--accent-primary)" }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
            <span>{minutes}:{String(seconds).padStart(2, "0")}</span>
            <span>{totalMin}:{String(totalSec).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* Key points with active highlight */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Key points</p>
        {keyPoints.map((point, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 text-sm px-3 py-2 rounded transition-colors"
            style={{
              background: i === activePoint && playing ? "rgba(212,168,67,0.1)" : "transparent",
              borderLeft: `3px solid ${i === activePoint && playing ? "var(--accent-primary)" : "transparent"}`,
              color: i === activePoint && playing ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            <span className="mt-0.5 flex-shrink-0" style={{ color: i === activePoint && playing ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
              {i === activePoint && playing ? "▶" : "•"}
            </span>
            <KaTeXRenderer text={point} />
          </div>
        ))}
      </div>

      <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
        Demo: simulated audio. Real version uses TTS generated from concept content.
      </p>

      <Button
        size="sm"
        className="rounded-full w-full"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        onClick={onTryQuestion}
      >
        Try a question on this →
      </Button>
    </div>
  );
}
