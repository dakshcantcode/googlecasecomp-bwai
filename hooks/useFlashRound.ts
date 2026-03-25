"use client";

import { useState, useRef, useCallback } from "react";

export type DistractorType = "noise-numbers" | "color-tap" | "countdown" | "stroop";

export interface FlashRoundState {
  active: boolean;
  timeLeft: number;
  distractor: DistractorType;
  distractorTaps: { shown: number; caught: number };
  result: "idle" | "pass" | "fail";
}

const DISTRACTORS: DistractorType[] = ["noise-numbers", "color-tap", "countdown", "stroop"];

export function useFlashRound(durationSeconds = 30) {
  const [state, setState] = useState<FlashRoundState>({
    active: false,
    timeLeft: durationSeconds,
    distractor: "countdown",
    distractorTaps: { shown: 0, caught: 0 },
    result: "idle",
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    const distractor = DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)];
    setState({ active: true, timeLeft: durationSeconds, distractor, distractorTaps: { shown: 0, caught: 0 }, result: "idle" });

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current!);
          return { ...prev, active: true, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  }, [durationSeconds]);

  const recordTap = useCallback((caught: boolean) => {
    setState((prev) => ({
      ...prev,
      distractorTaps: {
        shown: prev.distractorTaps.shown + (caught ? 0 : 1),
        caught: prev.distractorTaps.caught + (caught ? 1 : 0),
      },
    }));
  }, []);

  const finish = useCallback((passed: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState((prev) => ({ ...prev, active: false, result: passed ? "pass" : "fail" }));
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState({ active: false, timeLeft: durationSeconds, distractor: "countdown", distractorTaps: { shown: 0, caught: 0 }, result: "idle" });
  }, [durationSeconds]);

  return { state, start, recordTap, finish, reset };
}
