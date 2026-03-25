"use client";

import { useEffect, useRef, useState } from "react";
import { springTick, lerpVec2, dist2, type Vec2, type SpringState } from "@/lib/spiderPhysics";

interface NodePoint {
  x: number;
  y: number;
  id?: string;
}

interface UseSpiderCursorOptions {
  latchRadius?: number;
  unlatchRadius?: number;
}

export function useSpiderCursor(
  nodePoints: NodePoint[],
  { latchRadius = 60, unlatchRadius = 80 }: UseSpiderCursorOptions = {}
) {
  const [cursorPos, setCursorPos] = useState<Vec2>({ x: -200, y: -200 });
  const [latched, setLatched] = useState(false);
  const [latchedNodeId, setLatchedNodeId] = useState<string | undefined>();
  const [silkPath, setSilkPath] = useState<string>("");

  const mouseRef = useRef<Vec2>({ x: -200, y: -200 });
  const springRef = useRef<SpringState>({ pos: { x: -200, y: -200 }, vel: { x: 0, y: 0 } });
  const latchedPosRef = useRef<Vec2 | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("mousemove", onMouseMove);

    function tick() {
      const mouse = mouseRef.current;

      // Find nearest node
      let nearest: NodePoint | null = null;
      let nearestDist = Infinity;
      for (const n of nodePoints) {
        const d = dist2(mouse, n);
        if (d < nearestDist) { nearestDist = d; nearest = n; }
      }

      if (nearest && nearestDist < latchRadius && !latchedPosRef.current) {
        // Latch: lerp to node over ~150ms (approx 9 frames at 60fps)
        latchedPosRef.current = { x: nearest.x, y: nearest.y };
        setLatched(true);
        setLatchedNodeId(nearest.id);
      } else if (latchedPosRef.current && nearestDist > unlatchRadius) {
        // Unlatch: spring snap-back
        latchedPosRef.current = null;
        setLatched(false);
        setLatchedNodeId(undefined);
      }

      const target = latchedPosRef.current ?? mouse;

      if (latchedPosRef.current) {
        // Lerp to latch point
        springRef.current.pos = lerpVec2(springRef.current.pos, target, 0.18);
        springRef.current.vel = { x: 0, y: 0 };
      } else {
        // Spring snap-back toward mouse
        springRef.current = springTick(springRef.current, target, 300, 15);
      }

      const pos = springRef.current.pos;
      setCursorPos({ ...pos });

      // Silk thread from latched node to mouse
      if (latchedPosRef.current) {
        const lp = latchedPosRef.current;
        const cpx = (lp.x + mouse.x) / 2;
        const cpy = (lp.y + mouse.y) / 2 - 20;
        setSilkPath(`M ${lp.x} ${lp.y} Q ${cpx} ${cpy} ${mouse.x} ${mouse.y}`);
      } else {
        setSilkPath("");
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [nodePoints, latchRadius, unlatchRadius]);

  return { cursorPos, latched, latchedNodeId, silkPath };
}
