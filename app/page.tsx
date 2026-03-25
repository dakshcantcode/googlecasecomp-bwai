import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import HeroWithOverlay from "@/components/canvas/HeroWithOverlay";

const FEATURES = [
  {
    label: "ARCHITECTURE",
    title: "The knowledge web",
    body: "Your content becomes an interactive web of concepts. Navigate it like a spider.",
    icon: "🕸",
  },
  {
    label: "FORMATS",
    title: "Six formats per concept",
    body: "Text, examples, quizzes, audio, simulations, and video. Exams ask from every angle.",
    icon: "📚",
  },
  {
    label: "DIAGNOSTICS",
    title: "The silly mistake trainer",
    body: "Flash rounds add timers and distractions. Catch errors before the exam does.",
    icon: "⚡",
  },
  {
    label: "TAXONOMY",
    title: "The error taxonomy",
    body: "Every mistake classified. Patterns surface. Targeted drills fix them.",
    icon: "🔍",
  },
  {
    label: "REVISION",
    title: "The forget engine",
    body: "Revision timed for maximum struggle. That's when memory strengthens most.",
    icon: "🧠",
  },
  {
    label: "INTELLIGENCE",
    title: "Mental-state detection",
    body: "Confused? Distracted? The system adapts to how you feel, not just what you know.",
    icon: "👁",
  },
];


export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ── Hero — canvas + fading overlay combined ── */}
      <HeroWithOverlay />

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <ScrollReveal>
          <div className="mb-12">
            <span className="newspaper-label">HOW IT WORKS</span>
            <div className="newspaper-rule mt-2" />
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <div
                className="rounded-lg p-6 border transition-colors hover:border-[var(--accent-primary)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <span className="newspaper-label">{f.label}</span>
                <div className="text-3xl my-3">{f.icon}</div>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {f.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {f.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 text-center" style={{ borderColor: "var(--border-default)" }}>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          © 2026 Co-Synapse ·{" "}
          <Link href="/about" className="hover:underline">About</Link> ·{" "}
          <a href="https://github.com" className="hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a> ·{" "}
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <br />
          <span className="italic text-xs">Printed on recycled electrons.</span>
        </p>
      </footer>
    </div>
  );
}
