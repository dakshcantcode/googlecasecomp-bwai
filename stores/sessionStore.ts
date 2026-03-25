"use client";

import { create } from "zustand";
import type { Question, GradeResult, ErrorType } from "@/lib/api";

interface Answer {
  questionId: string;
  value: string;
  result: GradeResult | null;
}

interface SessionStore {
  sessionId: string | null;
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  flashRoundActive: boolean;
  formatMode: "default" | "worked-example" | "simplified" | "detailed" | "audio" | "simulation" | "youtube";

  setSession: (sessionId: string, questions: Question[]) => void;
  recordAnswer: (questionId: string, value: string, result: GradeResult) => void;
  nextQuestion: () => void;
  setFlashRound: (active: boolean) => void;
  setFormatMode: (mode: SessionStore["formatMode"]) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  flashRoundActive: false,
  formatMode: "default",

  setSession: (sessionId, questions) => set({ sessionId, questions, currentIndex: 0, answers: [] }),
  recordAnswer: (questionId, value, result) =>
    set((s) => ({
      answers: [...s.answers, { questionId, value, result }],
    })),
  nextQuestion: () => set((s) => ({ currentIndex: Math.min(s.currentIndex + 1, s.questions.length) })),
  setFlashRound: (flashRoundActive) => set({ flashRoundActive }),
  setFormatMode: (formatMode) => set({ formatMode }),
  resetSession: () => set({ sessionId: null, questions: [], currentIndex: 0, answers: [], flashRoundActive: false, formatMode: "default" }),
}));

export type { ErrorType };
