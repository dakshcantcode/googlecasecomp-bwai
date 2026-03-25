"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const HeroWeb = dynamic(() => import("@/components/canvas/HeroWeb"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0" style={{ background: "var(--bg-primary)" }} />
  ),
});

/**
 * Full-viewport hero: canvas + text overlay.
 * Text fades out as the user scrolls into the web, fades back when scrolling out.
 */
export default function HeroWithOverlay() {
  const [zoom, setZoom] = useState(0);

  // Text is fully visible at zoom=0, fully gone by zoom=0.45
  const textOpacity = Math.max(0, 1 - zoom / 0.42);
  // Slight upward drift as the text fades
  const textTranslateY = zoom * -48;

  return (
    <section className="relative" style={{ height: "100vh" }}>
      {/* 3D spider web canvas — fills entire section */}
      <div className="absolute inset-0">
        <HeroWeb
          onCinematicChange={({ zoom: z }) => setZoom(z)}
        />
      </div>

      {/* Text overlay — fades out as user zooms into the web */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none"
        style={{
          paddingTop: "80px",
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
          // Use will-change to hint the browser to keep this on its own layer
          willChange: "opacity, transform",
          // CSS transition is intentionally absent — we want instant response to scroll
        }}
      >
        <div className="px-6 max-w-3xl">
          <h1
            className="font-black leading-none tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(56px, 10vw, 96px)",
              color: "var(--text-primary)",
            }}
          >
            CO-SYNAPSE
          </h1>

          <p
            className="mb-10"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: 22,
              fontStyle: "",
              color: "var(--text-primary)",
            }}
          >
            &ldquo;Don&apos;t adapt to how you learn. Adapt to what you know.&rdquo;
          </p>

          {/* Button: restore pointer-events, also hide when deep in web */}
          <div
            className="pointer-events-auto"
            style={{ opacity: textOpacity > 0.1 ? 1 : 0, transition: "opacity 0.15s" }}
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="rounded-full px-8 text-base font-semibold"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
              >
                Sign up NOW!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
