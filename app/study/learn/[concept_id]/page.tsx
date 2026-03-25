"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { startSession } from "@/lib/api";
import { ModeSelector, type LearnMode } from "@/components/learn/ModeSelector";
import { NotesMode } from "@/components/learn/NotesMode";
import { FlashcardsMode } from "@/components/learn/FlashcardsMode";
import { VisualMode } from "@/components/learn/VisualMode";
import { AudioMode } from "@/components/learn/AudioMode";
import { FocusMode } from "@/components/learn/FocusMode";
import { ScholarMode } from "@/components/learn/ScholarMode";
import { ModeSkeleton } from "@/components/learn/ModeSkeleton";
import { ModeError } from "@/components/learn/ModeError";
import type { FlashcardsResponse } from "@/app/api/concepts/[id]/flashcards/route";
import type { VisualResponse } from "@/app/api/concepts/[id]/visual/route";
import type { ChallengesResponse } from "@/app/api/concepts/[id]/challenges/route";
import type { ScholarResponse } from "@/app/api/concepts/[id]/scholar/route";

interface NoteSection {
  title: string;
  content: string;
}

interface NotesData {
  label: string;
  definition: string;
  sections: NoteSection[];
  mermaid: string;
  prerequisites: string[];
  unlocks: string[];
}

type PagePhase = "loading" | "ready" | "starting";
type FetchStatus = "idle" | "loading" | "ready" | "error";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const conceptId = params.concept_id as string;
  const subjectId = searchParams.get("subject") ?? "";

  // Core notes state
  const [pagePhase, setPagePhase] = useState<PagePhase>("loading");
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [error, setError] = useState(false);

  // Mode state
  const [activeMode, setActiveMode] = useState<LearnMode>("notes");
  const [flashcardsData, setFlashcardsData] = useState<FlashcardsResponse | null>(null);
  const [flashcardsStatus, setFlashcardsStatus] = useState<FetchStatus>("idle");
  const [visualData, setVisualData] = useState<VisualResponse | null>(null);
  const [visualStatus, setVisualStatus] = useState<FetchStatus>("idle");
  const [audioStatus, setAudioStatus] = useState<FetchStatus>("idle");
  const [focusData, setFocusData] = useState<ChallengesResponse | null>(null);
  const [focusStatus, setFocusStatus] = useState<FetchStatus>("idle");
  const [scholarData, setScholarData] = useState<ScholarResponse | null>(null);
  const [scholarStatus, setScholarStatus] = useState<FetchStatus>("idle");

  // Load notes on mount
  useEffect(() => {
    fetch(`/api/concepts/${conceptId}/notes`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(true); return; }
        setNotes(data);
        setPagePhase("ready");
      })
      .catch(() => setError(true));
  }, [conceptId]);

  // Lazy-fetch on tab change
  const handleModeChange = useCallback(async (mode: LearnMode) => {
    setActiveMode(mode);

    if (mode === "flashcards" && flashcardsStatus === "idle") {
      setFlashcardsStatus("loading");
      try {
        const data = await fetch(`/api/concepts/${conceptId}/flashcards`).then((r) => r.json());
        if (data.error) { setFlashcardsStatus("error"); return; }
        setFlashcardsData(data);
        setFlashcardsStatus("ready");
      } catch {
        setFlashcardsStatus("error");
      }
    }

    if (mode === "visual" && visualStatus === "idle") {
      setVisualStatus("loading");
      try {
        const data = await fetch(`/api/concepts/${conceptId}/visual`).then((r) => r.json());
        if (data.error) { setVisualStatus("error"); return; }
        setVisualData(data);
        setVisualStatus("ready");
      } catch {
        setVisualStatus("error");
      }
    }

    if (mode === "audio" && audioStatus === "idle") {
      setAudioStatus("ready"); // AudioMode self-fetches internally
    }

    if (mode === "focus" && focusStatus === "idle") {
      setFocusStatus("loading");
      try {
        const data = await fetch(`/api/concepts/${conceptId}/challenges`).then((r) => r.json());
        if (data.error) { setFocusStatus("error"); return; }
        setFocusData(data);
        setFocusStatus("ready");
      } catch {
        setFocusStatus("error");
      }
    }

    if (mode === "scholar" && scholarStatus === "idle") {
      setScholarStatus("loading");
      try {
        const data = await fetch(`/api/concepts/${conceptId}/scholar`).then((r) => r.json());
        if (data.error) { setScholarStatus("error"); return; }
        setScholarData(data);
        setScholarStatus("ready");
      } catch {
        setScholarStatus("error");
      }
    }
  }, [conceptId, flashcardsStatus, visualStatus, audioStatus, focusStatus, scholarStatus]);

  async function handleStartQuiz() {
    setPagePhase("starting");
    try {
      const data = await startSession([conceptId], 5);
      if (data.sessionId) {
        router.push(`/study/${data.sessionId}?concept=${conceptId}&subject=${subjectId}`);
      }
    } catch {
      setPagePhase("ready");
    }
  }

  const backHref = subjectId ? `/web/${subjectId}` : "/dashboard";

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Could not load notes for this concept.</p>
        <Button variant="ghost" onClick={() => router.push(backHref)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)", paddingTop: "60px" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => router.push(backHref)}
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={14} />
          Back
        </Button>
        {notes && (
          <span className="newspaper-label" style={{ color: "var(--text-primary)" }}>
            {notes.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6">
        {pagePhase === "loading" ? (
          <div className="space-y-6 animate-pulse mt-4">
            <div className="h-8 rounded w-2/3" style={{ background: "var(--border-default)" }} />
            <div className="space-y-3">
              {[100, 90, 80, 95, 70].map((w, i) => (
                <div key={i} className="h-3 rounded" style={{ background: "var(--border-default)", width: `${w}%` }} />
              ))}
            </div>
            <div className="h-48 rounded-lg" style={{ background: "var(--border-default)" }} />
          </div>
        ) : notes ? (
          <>
            <ModeSelector activeMode={activeMode} onChange={handleModeChange} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeMode === "notes" && <NotesMode notes={notes} />}

                {activeMode === "audio" && (
                  <AudioMode conceptId={conceptId} />
                )}

                {activeMode === "flashcards" && (
                  flashcardsStatus === "loading" ? (
                    <ModeSkeleton variant="flashcard" />
                  ) : flashcardsStatus === "error" ? (
                    <ModeError
                      mode="flashcards"
                      onRetry={() => { setFlashcardsStatus("idle"); handleModeChange("flashcards"); }}
                    />
                  ) : flashcardsData ? (
                    <FlashcardsMode cards={flashcardsData.cards} />
                  ) : null
                )}

                {activeMode === "focus" && (
                  focusStatus === "loading" ? (
                    <ModeSkeleton variant="focus" />
                  ) : focusStatus === "error" ? (
                    <ModeError
                      mode="focus"
                      onRetry={() => { setFocusStatus("idle"); handleModeChange("focus"); }}
                    />
                  ) : focusData ? (
                    <FocusMode data={focusData} />
                  ) : null
                )}

                {activeMode === "visual" && (
                  visualStatus === "loading" ? (
                    <ModeSkeleton variant="visual" />
                  ) : visualStatus === "error" ? (
                    <ModeError
                      mode="visual"
                      onRetry={() => { setVisualStatus("idle"); handleModeChange("visual"); }}
                    />
                  ) : visualData ? (
                    <VisualMode data={visualData} conceptLabel={notes.label} />
                  ) : null
                )}

                {activeMode === "scholar" && (
                  scholarStatus === "loading" ? (
                    <ModeSkeleton variant="scholar" />
                  ) : scholarStatus === "error" ? (
                    <ModeError
                      mode="scholar"
                      onRetry={() => { setScholarStatus("idle"); handleModeChange("scholar"); }}
                    />
                  ) : scholarData ? (
                    <ScholarMode data={scholarData} />
                  ) : null
                )}
              </motion.div>
            </AnimatePresence>

            {/* CTA — always visible */}
            <div
              className="flex flex-col items-center gap-3 py-8 mt-6 border-t"
              style={{ borderColor: "var(--border-default)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Ready to test your understanding?
              </p>
              <Button
                className="rounded-full gap-2 px-8"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                onClick={handleStartQuiz}
                disabled={pagePhase === "starting"}
              >
                <BookOpen size={15} />
                {pagePhase === "starting" ? "Creating session…" : "I've reviewed these — Start Quiz"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
