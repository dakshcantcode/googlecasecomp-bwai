"use client";

import { useState, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/study/QuestionCard";
import FeedbackCard from "@/components/study/FeedbackCard";
import FlashRound from "@/components/study/FlashRound";
import SessionSummary from "@/components/study/SessionSummary";
import FormatSwitcher from "@/components/study/FormatSwitcher";
import ZeigarnikBar from "@/components/study/ZeigarnikBar";
import WorkedExample from "@/components/study/WorkedExample";
import SimplifiedText from "@/components/study/SimplifiedText";
import DetailedText from "@/components/study/DetailedText";
import AudioWalkthrough from "@/components/study/AudioWalkthrough";
import Simulation from "@/components/study/Simulation";
import YouTubeClip from "@/components/study/YouTubeClip";
import { startSession, gradeAnswer, getSessionSummary } from "@/lib/api";
import { useFlashRound } from "@/hooks/useFlashRound";
import { useFormatCascade } from "@/hooks/useFormatCascade";
import { getConcept } from "@/lib/mockConcepts";
import type { Question, GradeResult, SessionSummaryData } from "@/lib/api";

type Phase = "entry" | "question" | "flash" | "flash-result" | "feedback" | "format" | "summary";

const COUNT_OPTIONS = [3, 5, 10, 15];

function shouldTriggerFlash(index: number) {
  return index > 0 && index % 3 === 2;
}

function StudySessionInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.session_id as string;
  const subjectId = searchParams.get("subject") ?? undefined;

  const [phase, setPhase] = useState<Phase>("entry");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastResult, setLastResult] = useState<GradeResult | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const showFormatRef = useRef(false);

  const flash = useFlashRound(30);
  const { mode: formatMode, recordFail, resetForConcept, setMode } = useFormatCascade();

  async function handleStart() {
    const data = await startSession([], questionCount);
    setActiveSessionId(data.sessionId);
    setQuestions(data.questions);
    setCurrentIndex(0);
    resetForConcept();
    if (shouldTriggerFlash(0)) {
      flash.start();
      setPhase("flash");
    } else {
      setPhase("question");
    }
  }

  async function handleSubmitAnswer(value: string) {
    if (!activeSessionId || submitting) return;
    setSubmitting(true);

    if (phase === "flash") {
      flash.finish(true);
      setPhase("flash-result");
      setSubmitting(false);
      return;
    }

    const result = await gradeAnswer(activeSessionId, questions[currentIndex].id, value);
    setLastResult(result);
    setAnsweredCount((c) => c + 1);

    if (!result.correct) {
      // recordFail returns nothing — check mode change by comparing before/after
      const prevMode = formatMode;
      recordFail();
      // If mode changes after this re-render, we'll check in handleNext
      // Use a ref to signal "show format after feedback"
      // We approximate: if failCount becomes >=2, mode will change from default
      // We'll check formatMode in handleNext after the state update settles
    }

    setPhase("feedback");
    setSubmitting(false);
  }

  async function handleFlashTimeout() {
    if (!activeSessionId) return;
    flash.finish(false);
    const result = await gradeAnswer(activeSessionId, questions[currentIndex].id, "");
    setLastResult(result);
    setAnsweredCount((c) => c + 1);
    setPhase("flash-result");
  }

  async function handleFlashResultNext() {
    flash.reset();
    setPhase("question");
  }

  function handleNext() {
    // If format cascade triggered (mode != default) and last answer was wrong, show format view
    if (formatMode !== "default" && lastResult && !lastResult.correct) {
      setPhase("format");
      return;
    }

    advanceToNext();
  }

  function advanceToNext() {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      loadSummary();
    } else {
      setCurrentIndex(next);
      setLastResult(null);
      resetForConcept();
      if (shouldTriggerFlash(next)) {
        flash.start();
        setPhase("flash");
      } else {
        setPhase("question");
      }
    }
  }

  function handleFormatDone() {
    // User finished the format view — retry same question
    resetForConcept();
    setLastResult(null);
    setPhase("question");
  }

  function handleSkip() {
    advanceToNext();
  }

  async function loadSummary() {
    const s = await getSessionSummary(activeSessionId ?? sessionId);
    setSummary(s);
    setPhase("summary");
  }

  const flashTimeLeft = flash.state.timeLeft;
  if (phase === "flash" && flashTimeLeft === 0 && !submitting) {
    handleFlashTimeout();
  }

  // Current concept for format views
  const currentConceptId = questions[currentIndex]?.conceptId ?? "chain-rule";
  const currentConcept = getConcept(currentConceptId);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--bg-primary)", paddingTop: "96px" }}
    >
      <AnimatePresence mode="wait">

        {/* ── Entry ── */}
        {phase === "entry" && (
          <motion.div
            key="entry"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-sm w-full space-y-6"
          >
            <div>
              <span className="newspaper-label">STUDY SESSION</span>
              <div className="newspaper-rule mt-1 mb-4" />
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
              >
                How many questions?
              </h1>
            </div>

            <RadioGroup value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <div className="grid grid-cols-2 gap-3">
                {COUNT_OPTIONS.map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 border cursor-pointer transition-colors"
                    style={{
                      background: questionCount === n ? "rgba(212,168,67,0.08)" : "var(--bg-secondary)",
                      borderColor: questionCount === n ? "var(--accent-primary)" : "var(--border-default)",
                    }}
                    onClick={() => setQuestionCount(n)}
                  >
                    <RadioGroupItem value={String(n)} id={`count-${n}`} />
                    <Label htmlFor={`count-${n}`} className="cursor-pointer text-base font-semibold">
                      {n}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ background: "rgba(212,168,67,0.06)", borderColor: "rgba(212,168,67,0.3)", color: "var(--text-secondary)" }}
            >
              ⚡ Every 3rd question is a <strong style={{ color: "var(--accent-primary)" }}>flash round</strong> — answer under a 30s timer with distractions active.
            </div>

            <Button
              size="lg"
              className="w-full rounded-full text-base font-semibold"
              style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
              onClick={handleStart}
            >
              Start session
            </Button>
          </motion.div>
        )}

        {/* ── Normal question ── */}
        {phase === "question" && questions[currentIndex] && (
          <motion.div key={`q-${currentIndex}`} className="w-full max-w-2xl mx-auto">
            <FormatSwitcher mode={formatMode}>
              <QuestionCard
                question={questions[currentIndex]}
                index={currentIndex}
                total={questions.length}
                onSubmit={handleSubmitAnswer}
                onSkip={handleSkip}
                disabled={submitting}
              />
            </FormatSwitcher>
          </motion.div>
        )}

        {/* ── Flash round ── */}
        {phase === "flash" && questions[currentIndex] && (
          <motion.div
            key={`flash-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl w-full mx-auto"
          >
            <FlashRound
              timeLeft={flash.state.timeLeft}
              distractor={flash.state.distractor}
              onCatch={() => flash.recordTap(true)}
              onSubmitAnswer={handleSubmitAnswer}
              questionPrompt={questions[currentIndex].prompt}
            />
          </motion.div>
        )}

        {/* ── Flash result ── */}
        {phase === "flash-result" && (
          <motion.div
            key="flash-result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full mx-auto space-y-5"
          >
            <div
              className="rounded-lg border p-6 text-center"
              style={{
                background: "var(--bg-secondary)",
                borderColor: flash.state.result === "pass" ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)",
              }}
            >
              <p className="text-4xl mb-3">{flash.state.result === "pass" ? "⚡" : "💥"}</p>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
              >
                {flash.state.result === "pass" ? "Flash round complete" : "Time's up"}
              </h2>
              {flash.state.distractorTaps.shown > 0 && (
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  Caught {flash.state.distractorTaps.caught} / {flash.state.distractorTaps.shown} distractors
                </p>
              )}
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {flash.state.result === "fail"
                  ? "The same question will now appear without time pressure."
                  : "Moving on to the next question."}
              </p>
            </div>

            {lastResult && (
              <FeedbackCard
                result={lastResult}
                onNext={flash.state.result === "pass" ? advanceToNext : handleFlashResultNext}
                onRetry={undefined}
              />
            )}

            {!lastResult && (
              <Button
                className="w-full rounded-full"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                onClick={flash.state.result === "pass" ? advanceToNext : handleFlashResultNext}
              >
                {flash.state.result === "pass" ? "Next question" : "Retry without timer"}
              </Button>
            )}
          </motion.div>
        )}

        {/* ── Feedback ── */}
        {phase === "feedback" && lastResult && (
          <motion.div key="feedback" className="max-w-2xl w-full mx-auto">
            <FeedbackCard
              result={lastResult}
              onNext={handleNext}
              onRetry={() => { setLastResult(null); setPhase("question"); }}
            />
          </motion.div>
        )}

        {/* ── Format view (cascade) ── */}
        {phase === "format" && currentConcept && (
          <motion.div
            key={`format-${currentIndex}-${formatMode}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Let's reinforce this concept before retrying:
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: "rgba(212,168,67,0.12)", color: "var(--accent-primary)", borderBottom: "2px solid var(--accent-primary)" }}
              >
                {formatMode === "worked-example" && "Worked Example"}
                {formatMode === "simplified" && "Plain Language"}
                {formatMode === "detailed" && "Detailed Derivation"}
                {formatMode === "audio" && "Audio Walkthrough"}
                {formatMode === "simulation" && "Simulation"}
                {formatMode === "youtube" && "Video Clip"}
              </span>
            </div>

            {formatMode === "worked-example" && (
              <WorkedExample concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
            {formatMode === "simplified" && (
              <SimplifiedText concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
            {formatMode === "detailed" && (
              <DetailedText concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
            {formatMode === "audio" && (
              <AudioWalkthrough concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
            {formatMode === "simulation" && (
              <Simulation concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
            {formatMode === "youtube" && currentConcept.youtube_clip && (
              <YouTubeClip concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
            {formatMode === "youtube" && !currentConcept.youtube_clip && (
              <SimplifiedText concept={currentConcept} onTryQuestion={handleFormatDone} />
            )}
          </motion.div>
        )}

        {/* ── Summary ── */}
        {phase === "summary" && summary && (
          <motion.div key="summary" className="w-full">
            <SessionSummary summary={summary} subjectId={subjectId} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Zeigarnik bar — appears after first answer */}
      {phase !== "entry" && phase !== "summary" && (
        <ZeigarnikBar
          total={questions.length || questionCount}
          completed={answeredCount}
          visible={answeredCount > 0}
        />
      )}
    </div>
  );
}

export default function StudySessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading session…</p>
      </div>
    }>
      <StudySessionInner />
    </Suspense>
  );
}
