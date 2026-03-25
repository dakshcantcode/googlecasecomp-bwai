/**
 * useWebZoom — Scroll-interceptor zoom controller for the spider web hero
 * Ported from NeuroSketch use-neuron-zoom.ts
 * Change: hasReachedNucleus → hasReachedCenter
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { clamp } from "@/lib/3d-utils";

interface UseWebZoomOptions {
  warpThreshold?: number;
}

interface UseWebZoomReturn {
  zoom: number;
  isWarping: boolean;
  hasReachedCenter: boolean;
  handleWheel: (e: WheelEvent) => void;
  resetWarp: () => void;
  activeNode: number | null;
  setActiveNode: (i: number | null) => void;
}

export function useWebZoom(opts: UseWebZoomOptions = {}): UseWebZoomReturn {
  const { warpThreshold = 0.85 } = opts;

  const [zoom, setZoom] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [hasReachedCenter, setHasReachedCenter] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const warpTriggered = useRef(false);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (isWarping) return;

      e.preventDefault();
      const delta = e.deltaY * -0.003;

      if (hasReachedCenter) {
        if (delta < 0) {
          setHasReachedCenter(false);
          warpTriggered.current = false;
          setZoom(0.7);
        }
        return;
      }

      setZoom((prev) => {
        const next = clamp(prev + delta, 0, 1);

        if (next >= warpThreshold && !warpTriggered.current) {
          warpTriggered.current = true;
          setIsWarping(true);
          setTimeout(() => {
            setIsWarping(false);
            setHasReachedCenter(true);
          }, 1800);
        }

        return next;
      });
    },
    [isWarping, hasReachedCenter, warpThreshold]
  );

  const resetWarp = useCallback(() => {
    setHasReachedCenter(false);
    setIsWarping(false);
    setActiveNode(null);
    warpTriggered.current = false;
    setZoom(0);
  }, []);

  return {
    zoom,
    isWarping,
    hasReachedCenter,
    handleWheel,
    resetWarp,
    activeNode,
    setActiveNode,
  };
}
