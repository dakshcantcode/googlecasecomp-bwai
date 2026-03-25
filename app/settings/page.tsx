"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function SettingsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );
  const [attentionTracking, setAttentionTracking] = useState(false);
  const [studyTime, setStudyTime] = useState("18:00");
  const [questionCount, setQuestionCount] = useState("5");
  const [name, setName] = useState("Yash");
  const [email, setEmail] = useState("yash@example.com");

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("co-synapse-theme", next ? "dark" : "light");
  }

  function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className="w-11 h-6 rounded-full transition-colors relative"
        style={{ background: on ? "var(--accent-primary)" : "var(--border-default)" }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: on ? "calc(100% - 20px)" : "4px" }}
        />
      </button>
    );
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <ScrollReveal>
        <div
          className="rounded-lg border p-6 space-y-4"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
        >
          <p className="newspaper-label">{title}</p>
          {children}
        </div>
      </ScrollReveal>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} style={{ color: "var(--text-secondary)" }}>
              <ArrowLeft size={14} className="mr-1" /> Dashboard
            </Button>
          </div>
          <div>
            <span className="newspaper-label">SETTINGS</span>
            <div className="newspaper-rule mt-1" />
          </div>
        </ScrollReveal>

        {/* Profile */}
        <Section title="PROFILE">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: "var(--text-tertiary)" }}>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: "var(--text-tertiary)" }}>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </div>
        </Section>

        {/* Study anchor */}
        <Section title="STUDY ANCHOR">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Your daily study time. Reviews and reminders are scheduled around this.
          </p>
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: "var(--text-tertiary)" }}>Time</Label>
            <Input
              type="time"
              value={studyTime}
              onChange={(e) => setStudyTime(e.target.value)}
              className="max-w-[160px]"
            />
          </div>
        </Section>

        {/* Session defaults */}
        <Section title="SESSION DEFAULTS">
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: "var(--text-tertiary)" }}>Default question count</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="max-w-[100px]"
            />
          </div>
        </Section>

        {/* Appearance */}
        <Section title="APPEARANCE">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon size={16} style={{ color: "var(--accent-primary)" }} /> : <Sun size={16} style={{ color: "var(--accent-primary)" }} />}
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>Dark mode</span>
            </div>
            <ToggleSwitch on={darkMode} onToggle={toggleDark} />
          </div>
        </Section>

        {/* Attention tracking */}
        <Section title="ATTENTION TRACKING">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Webcam attention detection</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Uses your camera locally — nothing is sent or stored. Detects distraction and fatigue.
              </p>
            </div>
            <ToggleSwitch on={attentionTracking} onToggle={() => setAttentionTracking((p) => !p)} />
          </div>
        </Section>

        {/* Data & Privacy */}
        <Section title="DATA & PRIVACY">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            All processing is local. No training data is extracted from your study material.
          </p>
          <Separator style={{ borderColor: "var(--border-default)" }} />
          <Button variant="outline" size="sm" className="rounded-full text-xs" style={{ color: "var(--text-tertiary)" }}>
            Delete all data
          </Button>
        </Section>

        <div className="flex justify-end">
          <Button
            className="rounded-full px-6"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            onClick={() => router.push("/dashboard")}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
