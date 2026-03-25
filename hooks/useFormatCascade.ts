"use client";

import { useState, useCallback } from "react";

export type FormatMode =
  | "default"
  | "worked-example"
  | "simplified"
  | "detailed"
  | "audio"
  | "simulation"
  | "youtube";

const CASCADE: FormatMode[] = [
  "default",
  "worked-example",
  "simplified",
  "detailed",
  "audio",
  "simulation",
  "youtube",
];

export function useFormatCascade() {
  const [failCount, setFailCount] = useState(0);
  const [mode, setMode] = useState<FormatMode>("default");

  const recordFail = useCallback(() => {
    setFailCount((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        const nextIdx = Math.min(CASCADE.indexOf(mode) + 1, CASCADE.length - 1);
        setMode(CASCADE[nextIdx]);
      }
      return next;
    });
  }, [mode]);

  const resetForConcept = useCallback(() => {
    setFailCount(0);
    setMode("default");
  }, []);

  return { mode, failCount, recordFail, resetForConcept, setMode };
}
