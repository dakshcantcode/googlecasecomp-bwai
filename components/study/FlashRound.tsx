"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { DistractorType } from "@/hooks/useFlashRound";

/* ─── Distractor sub-components ─────────────────────────── */

function NoiseNumbers({ onCatch }: { onCatch: () => void }) {
  const [nums] = useState(() => Array.from({ length: 12 }, () => Math.floor(Math.random() * 900 + 100)));
  return (
    <div className="grid grid-cols-4 gap-2 p-3">
      {nums.map((n, i) => (
        <button
          key={i}
          className="text-xs px-2 py-1 rounded border opacity-60 hover:opacity-100"
          style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
          onClick={onCatch}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ColorTap({ onCatch }: { onCatch: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const delay = Math.random() * 4000 + 2000;
    const t = setTimeout(() => { setShow(true); }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex items-center justify-center h-16">
      {show ? (
        <button
          className="w-6 h-6 rounded-full animate-pulse"
          style={{ background: "#F87171" }}
          onClick={() => { setShow(false); onCatch(); }}
        />
      ) : (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Watch for the red dot…</p>
      )}
    </div>
  );
}

function StroopWords({ onCatch }: { onCatch: () => void }) {
  const pairs = [
    { word: "RED", color: "#4ADE80" },
    { word: "BLUE", color: "#FB923C" },
    { word: "GREEN", color: "#A78BFA" },
  ];
  const [pair] = useState(() => pairs[Math.floor(Math.random() * pairs.length)]);
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p style={{ color: pair.color, fontWeight: 700, fontSize: 24 }}>{pair.word}</p>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Tap if ink color matches the word</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCatch}>Match</Button>
        <Button size="sm" variant="outline">No match</Button>
      </div>
    </div>
  );
}

/* ─── Main FlashRound component ─────────────────────────── */

interface FlashRoundProps {
  timeLeft: number;
  distractor: DistractorType;
  onCatch: () => void;
  onSubmitAnswer: (value: string) => void;
  questionPrompt: string;
}

export default function FlashRound({ timeLeft, distractor, onCatch, onSubmitAnswer, questionPrompt }: FlashRoundProps) {
  const [answer, setAnswer] = useState("");
  const urgent = timeLeft <= 10;

  return (
    <div
      className="rounded-lg border p-5 space-y-4"
      style={{
        background: urgent ? "rgba(251,146,60,0.06)" : "var(--bg-secondary)",
        borderColor: urgent ? "rgba(251,146,60,0.5)" : "var(--border-default)",
        transition: "all 0.5s ease",
      }}
    >
      {/* Timer */}
      <div className="flex items-center justify-between">
        <span className="newspaper-label">FLASH ROUND</span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            color: urgent ? "#FB923C" : "var(--text-primary)",
          }}
        >
          {String(timeLeft).padStart(2, "0")}s
        </span>
      </div>

      {/* Question */}
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{questionPrompt}</p>

      {/* Distractor */}
      <div
        className="rounded border"
        style={{ borderColor: "var(--border-default)", background: "var(--bg-primary)" }}
      >
        {distractor === "noise-numbers" && <NoiseNumbers onCatch={onCatch} />}
        {distractor === "color-tap" && <ColorTap onCatch={onCatch} />}
        {distractor === "stroop" && <StroopWords onCatch={onCatch} />}
        {distractor === "countdown" && (
          <div className="flex items-center justify-center h-12">
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Stay focused — answer below</p>
          </div>
        )}
      </div>

      {/* Answer input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder="Your answer…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && answer) onSubmitAnswer(answer); }}
        />
        <Button
          size="sm"
          disabled={!answer}
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          className="rounded-lg"
          onClick={() => onSubmitAnswer(answer)}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
