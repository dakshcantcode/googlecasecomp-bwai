"use client";

import dynamic from "next/dynamic";

const HeroWeb = dynamic(() => import("@/components/canvas/HeroWeb"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0" style={{ background: "var(--bg-primary)" }} />
  ),
});

/** Canvas-only wrapper — rendered inside a relative-positioned section in page.tsx */
export default function HeroSection() {
  return (
    <div className="absolute inset-0">
      <HeroWeb />
    </div>
  );
}
