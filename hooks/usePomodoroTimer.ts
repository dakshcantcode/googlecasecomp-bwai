"use client";

import { useState, useRef, useCallback } from "react";

export type PomodoroPhase = "idle" | "work" | "break";

export interface PomodoroState {
  phase: PomodoroPhase;
  timeLeft: number;
  cyclesCompleted: number;
  isPaused: boolean;
}

export function usePomodoroTimer(workMinutes = 25, breakMinutes = 5) {
  const workSeconds = workMinutes * 60;
  const breakSeconds = breakMinutes * 60;

  const [state, setState] = useState<PomodoroState>({
    phase: "idle",
    timeLeft: workSeconds,
    cyclesCompleted: 0,
    isPaused: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startInterval = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current!);
          // Auto-transition
          if (prev.phase === "work") {
            // Switch to break
            setTimeout(() => startInterval(), 0);
            return { ...prev, phase: "break", timeLeft: breakSeconds, isPaused: false };
          } else {
            // Switch back to work
            setTimeout(() => startInterval(), 0);
            return {
              ...prev,
              phase: "work",
              timeLeft: workSeconds,
              cyclesCompleted: prev.cyclesCompleted + 1,
              isPaused: false,
            };
          }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  }, [workSeconds, breakSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    setState({ phase: "work", timeLeft: workSeconds, cyclesCompleted: 0, isPaused: false });
    startInterval();
  }, [workSeconds, startInterval]);

  const pause = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
    startInterval();
  }, [startInterval]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState({ phase: "idle", timeLeft: workSeconds, cyclesCompleted: 0, isPaused: false });
  }, [workSeconds]);

  return { state, start, pause, resume, reset };
}
