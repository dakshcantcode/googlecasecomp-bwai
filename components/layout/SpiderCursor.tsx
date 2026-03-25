"use client";

import { useEffect, useRef, useState } from "react";

export function SpiderCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const prevPosRef = useRef({ x: -100, y: -100 });
  const angleRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);

  // Track dark mode — MutationObserver on <html> classlist, no polling
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Set initial value
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

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
        if (el) el.style.animationName = "none";
      }

      posRef.current = { x: e.clientX, y: e.clientY };

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
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

  // In light mode: dark spider on light bg. In dark mode: light spider on dark bg.
  const bodyColor = isDark ? "#F0EAD6" : "#1A1A1A";
  const legColor  = isDark ? "#D4C5A0" : "#1A1A1A";
  const eyeColor  = "#D4A843"; // gold eyes always

  return (
    <>
      <style>{`
        @keyframes spider-idle {
          0%, 100% { transform: translate(calc(${0}px - 50%), calc(${0}px - 50%)) rotate(var(--spider-angle, 0deg)) scaleX(1); }
          25%       { transform: translate(calc(${0}px - 50%), calc(${0}px - 50%)) rotate(var(--spider-angle, 0deg)) scaleX(0.95); }
          75%       { transform: translate(calc(${0}px - 50%), calc(${0}px - 50%)) rotate(var(--spider-angle, 0deg)) scaleX(1.05); }
        }
      `}</style>

      <div
        id="spider-cursor"
        ref={cursorRef}
        style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999, willChange: "transform" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" width={28} height={28}>
          {/* Body */}
          <ellipse cx="14" cy="15" rx="4" ry="5" fill={bodyColor} />
          <ellipse cx="14" cy="11" rx="3" ry="3" fill={bodyColor} />
          {/* Eyes */}
          <circle cx="12.8" cy="10.5" r="0.8" fill={eyeColor} />
          <circle cx="15.2" cy="10.5" r="0.8" fill={eyeColor} />
          {/* Legs left */}
          <line x1="10" y1="13" x2="4"  y2="10" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="15" x2="3"  y2="15" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="17" x2="4"  y2="20" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="19" x2="5"  y2="23" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          {/* Legs right */}
          <line x1="18" y1="13" x2="24" y2="10" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="15" x2="25" y2="15" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="17" x2="24" y2="20" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="19" x2="23" y2="23" stroke={legColor} strokeWidth="1.2" strokeLinecap="round" />
          {/* Silk thread anchor */}
          <line x1="14" y1="20" x2="14" y2="26" stroke="#D4A843" strokeWidth="0.5" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}
