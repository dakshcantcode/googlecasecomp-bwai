"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sendTelemetry } from "@/lib/api";

export type MentalState = "normal" | "confused" | "distracted" | "overwhelmed";

interface MentalStateMetrics {
  responseTimes: number[];
  recentAccuracy: boolean[];
  idleMs: number;
  skipCount: number;
  errorTypes: string[];
}

export function useMentalState(sessionId: string | null) {
  const [state, setState] = useState<MentalState>("normal");
  const metricsRef = useRef<MentalStateMetrics>({
    responseTimes: [],
    recentAccuracy: [],
    idleMs: 0,
    skipCount: 0,
    errorTypes: [],
  });
  const lastActivityRef = useRef(Date.now());

  const recordResponse = useCallback((timeMs: number, correct: boolean, errorType?: string) => {
    const m = metricsRef.current;
    m.responseTimes = [...m.responseTimes.slice(-9), timeMs];
    m.recentAccuracy = [...m.recentAccuracy.slice(-4), correct];
    if (errorType) m.errorTypes = [...m.errorTypes.slice(-9), errorType];
    lastActivityRef.current = Date.now();

    // Classify state
    const avgTime = m.responseTimes.reduce((a, b) => a + b, 0) / (m.responseTimes.length || 1);
    const recentAcc = m.recentAccuracy.filter(Boolean).length / (m.recentAccuracy.length || 1);

    if (avgTime > 60000) setState("overwhelmed");
    else if (recentAcc < 0.3) setState("confused");
    else if (m.idleMs > 30000) setState("distracted");
    else setState("normal");
  }, []);

  const recordSkip = useCallback(() => {
    metricsRef.current.skipCount += 1;
  }, []);

  // Track idle time + send telemetry every 10s
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      metricsRef.current.idleMs = now - lastActivityRef.current;
      if (sessionId) {
        sendTelemetry(sessionId, {
          state,
          metrics: { ...metricsRef.current },
          timestamp: now,
        });
      }
    }, 10000);
    return () => clearInterval(iv);
  }, [sessionId, state]);

  return { state, recordResponse, recordSkip };
}
