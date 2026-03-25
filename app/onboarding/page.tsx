"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_TITLES = [
  "Welcome to Co-Synapse",
  "Set your study anchor",
  "Upload your first subject",
  "Your web is forming",
  "One quick question",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const QUICK_PICKS = [
  { label: "☕ Morning coffee", time: "07:30", description: "If it's morning and I'm having coffee, I'll review one concept." },
  { label: "📚 After last class", time: "16:00", description: "If I've just finished my last lecture, I'll do a 10-minute session." },
  { label: "🌙 Before sleep", time: "22:00", description: "If I'm about to sleep, I'll do a quick retrieval round first." },
  { label: "🏋️ After workout", time: "09:00", description: "If I finish my workout, I'll study for 20 minutes while the mind is clear." },
  { label: "🚌 Commute time", time: "08:15", description: "If I'm on transit, I'll answer one daily question." },
  { label: "🍽️ After lunch", time: "13:00", description: "If it's after lunch, I'll spend 15 minutes on review." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [studyTime, setStudyTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [selectedQuickPick, setSelectedQuickPick] = useState<number | null>(null);
  const [topic, setTopic] = useState("");

  function next() {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else router.push("/dashboard");
  }

  function toggleDay(d: string) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function selectQuickPick(i: number) {
    setSelectedQuickPick(i);
    setStudyTime(QUICK_PICKS[i].time);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Step dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors"
            style={{ background: i <= step ? "var(--accent-primary)" : "var(--border-default)" }}
          />
        ))}
      </div>

      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            className="space-y-6"
          >
            <div>
              <span className="newspaper-label">STEP {step + 1} OF 5</span>
              <div className="newspaper-rule mt-1 mb-3" />
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
              >
                {STEP_TITLES[step]}
              </h1>
            </div>

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <div className="space-y-4">
                <p style={{ color: "var(--text-secondary)" }}>
                  Co-Synapse turns your study material into an interactive knowledge web and trains retrieval — not recognition.
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  In the next few minutes you'll upload a subject, build your first web, and answer your first question.
                </p>
                <Button
                  className="w-full rounded-full"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                  onClick={next}
                >
                  Get started
                </Button>
              </div>
            )}

            {/* ── Step 1: Study anchor ── */}
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Pick a moment that already exists in your routine. We'll build your review schedule around it.
                </p>

                {/* Quick picks */}
                <div>
                  <Label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-tertiary)" }}>
                    Quick picks (if–then anchors)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PICKS.map((pick, i) => (
                      <button
                        key={i}
                        className="rounded-lg px-3 py-2.5 text-left border transition-colors text-xs"
                        style={{
                          background: selectedQuickPick === i ? "rgba(212,168,67,0.1)" : "var(--bg-secondary)",
                          borderColor: selectedQuickPick === i ? "var(--accent-primary)" : "var(--border-default)",
                          color: selectedQuickPick === i ? "var(--text-primary)" : "var(--text-secondary)",
                        }}
                        onClick={() => selectQuickPick(i)}
                      >
                        <span className="font-medium">{pick.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedQuickPick !== null && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs mt-2 italic px-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      "{QUICK_PICKS[selectedQuickPick].description}"
                    </motion.p>
                  )}
                </div>

                {/* Manual time */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
                      Custom time
                    </Label>
                    <Input
                      type="time"
                      value={studyTime}
                      onChange={(e) => { setStudyTime(e.target.value); setSelectedQuickPick(null); }}
                      className="max-w-[160px]"
                    />
                  </div>
                </div>

                {/* Days */}
                <div>
                  <Label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-tertiary)" }}>
                    Days
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                        style={{
                          background: selectedDays.includes(d) ? "var(--accent-primary)" : "transparent",
                          borderColor: selectedDays.includes(d) ? "var(--accent-primary)" : "var(--border-default)",
                          color: selectedDays.includes(d) ? "#1A1A1A" : "var(--text-secondary)",
                        }}
                        onClick={() => toggleDay(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full rounded-full"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                  onClick={next}
                >
                  Save anchor
                </Button>
              </div>
            )}

            {/* ── Step 2: Upload ── */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  What are you studying? Enter a topic or drop a PDF.
                </p>
                <Input
                  placeholder="e.g. Calculus, Organic Chemistry, EU Law…"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <Button
                  className="w-full rounded-full"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                  disabled={!topic.trim()}
                  onClick={next}
                >
                  Build my web
                </Button>
              </div>
            )}

            {/* ── Step 3: Mini web animation ── */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Here's how your concept web works. Click a node to study it. Hover to see mastery. Scroll to see the whole web.
                </p>

                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)", height: 160 }}
                >
                  <svg width="100%" height="160" viewBox="0 0 300 160">
                    <line x1="150" y1="80" x2="80" y2="40" stroke="rgba(212,168,67,0.4)" strokeWidth="1" />
                    <line x1="150" y1="80" x2="220" y2="40" stroke="rgba(212,168,67,0.4)" strokeWidth="1" />
                    <line x1="150" y1="80" x2="80" y2="120" stroke="rgba(212,168,67,0.4)" strokeWidth="1" />
                    <line x1="150" y1="80" x2="220" y2="120" stroke="rgba(212,168,67,0.4)" strokeWidth="1" />
                    <line x1="150" y1="80" x2="150" y2="20" stroke="rgba(212,168,67,0.4)" strokeWidth="1" />
                    <circle cx="150" cy="80" r="8" fill="#D4A843" />
                    <circle cx="80" cy="40" r="6" fill="#4ADE80" />
                    <circle cx="220" cy="40" r="6" fill="#4ADE80" />
                    <circle cx="80" cy="120" r="6" fill="#A78BFA" />
                    <circle cx="220" cy="120" r="6" fill="rgba(180,180,180,0.35)" />
                    <circle cx="150" cy="20" r="5" fill="#FB923C" />
                    <text x="150" y="100" textAnchor="middle" fill="#D4A843" fontSize="9">Core concept</text>
                  </svg>
                </div>

                <Button
                  className="w-full rounded-full"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                  onClick={next}
                >
                  Got it
                </Button>
              </div>
            )}

            {/* ── Step 4: First question ── */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Let's start right now. Your first study session is ready.
                </p>
                <div
                  className="rounded-lg border p-4 text-center"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
                >
                  <p className="text-4xl mb-2">🕸</p>
                  <p className="font-semibold" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}>
                    Your web is ready.
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Answer 3 questions to calibrate your starting mastery.
                  </p>
                </div>
                <Button
                  className="w-full rounded-full"
                  style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                  onClick={() => router.push("/study/onboarding-session")}
                >
                  Begin calibration
                </Button>
                <button
                  className="w-full text-xs text-center underline"
                  style={{ color: "var(--text-tertiary)" }}
                  onClick={() => router.push("/dashboard")}
                >
                  Skip for now
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
