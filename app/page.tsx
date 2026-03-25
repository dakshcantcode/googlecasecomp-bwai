import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import HeroSection from "@/components/canvas/HeroSection";

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

const TESTIMONIALS = [
  {
    letter: "A",
    name: "Ananya R., Engineering student",
    text: "Co-Synapse figured out exactly where my understanding of integration broke down. I'd been cramming the formula for weeks without realising I hadn't understood the geometry.",
  },
  {
    letter: "M",
    name: "Marcus T., MCAT prep",
    text: "The flash rounds are brutal in the best way. Three times I got the correct answer in practice and the wrong one under time pressure. Fixed that before the real exam.",
  },
  {
    letter: "P",
    name: "Priya S., Law student",
    text: "Watching my knowledge web fill in over the semester is genuinely motivating. It's the only study tool that's ever made me feel like I'm making visible progress.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ── Hero ── */}
      <section className="relative" style={{ height: "100vh" }}>
        {/* 3D spider web canvas */}
        <HeroSection />

        {/* Text overlay — pointer-events-none so canvas receives mouse/scroll */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none"
          style={{ paddingTop: "80px" }}
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
              className="italic mb-4"
              style={{ fontSize: 20, color: "var(--text-secondary)" }}
            >
              The Cognitive Co-Regulator for Exam Mastery
            </p>

            <p
              className="mb-10"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: 22,
                fontStyle: "italic",
                color: "var(--text-primary)",
              }}
            >
              &ldquo;Don&apos;t adapt to how you learn. Adapt to what you know.&rdquo;
            </p>

            {/* Button needs pointer-events re-enabled */}
            <div className="pointer-events-auto">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="rounded-full px-8 text-base font-semibold"
                  style={{
                    background: "var(--accent-primary)",
                    color: "#1A1A1A",
                  }}
                >
                  Get Started — it&apos;s free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <ScrollReveal>
          <div className="mb-12">
            <span className="newspaper-label">HOW IT WORKS</span>
            <div className="newspaper-rule mt-2" />
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-0 divide-x divide-[var(--border-default)]">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <article className="px-8 py-6 first:pl-0 last:pr-0">
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
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <ScrollReveal>
          <div className="mb-12">
            <span className="newspaper-label">LETTERS TO THE EDITOR</span>
            <div className="newspaper-rule mt-2" />
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.1}>
              <div
                className="rounded-lg p-6 border transition-colors hover:border-[var(--accent-primary)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                >
                  {t.letter}
                </div>
                <p
                  className="text-sm italic leading-relaxed mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="newspaper-label">{t.name}</p>
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
