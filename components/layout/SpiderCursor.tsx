"use client";

import { useEffect, useRef } from "react";

export function SpiderCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const prevPosRef = useRef({ x: -100, y: -100 });
  const angleRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const isIdleRef = useRef(false);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    function onMouseMove(e: MouseEvent) {
      const dx = e.clientX - prevPosRef.current.x;
      const dy = e.clientY - prevPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        angleRef.current = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        prevPosRef.current = { x: e.clientX, y: e.clientY };
        isIdleRef.current = false;
        if (el) el.style.animationName = "none";
      }

      posRef.current = { x: e.clientX, y: e.clientY };

      // Reset idle timer
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        if (el) el.style.animationName = "spider-idle";
      }, 2000);
    }

    function tick() {
      if (el) {
        el.style.transform = `translate(calc(${posRef.current.x}px - 50%), calc(${posRef.current.y}px - 50%)) rotate(${angleRef.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    document.addEventListener("mousemove", onMouseMove);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes spider-idle {
          0%, 100% { transform: translate(calc(${0}px - 50%), calc(${0}px - 50%)) rotate(var(--spider-angle, 0deg)) scaleX(1); }
          25% { transform: translate(calc(${0}px - 50%), calc(${0}px - 50%)) rotate(var(--spider-angle, 0deg)) scaleX(0.95); }
          75% { transform: translate(calc(${0}px - 50%), calc(${0}px - 50%)) rotate(var(--spider-angle, 0deg)) scaleX(1.05); }
        }
      `}</style>
      <div
        id="spider-cursor"
        ref={cursorRef}
        style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999, willChange: "transform" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/spider-cursor.svg" width={28} height={28} alt="" />
      </div>
    </>
  );
}
