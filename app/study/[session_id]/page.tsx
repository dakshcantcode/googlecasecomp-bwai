"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/study/QuestionCard";
import FeedbackCard from "@/components/study/FeedbackCard";
import SessionSummary from "@/components/study/SessionSummary";
import { startSession, gradeAnswer, getSessionSummary } from "@/lib/api";
import type { Question, GradeResult, SessionSummaryData } from "@/lib/api";

type Phase = "entry" | "question" | "feedback" | "summary";

const COUNT_OPTIONS = [3, 5, 10, 15];

export default function StudySessionPage() {
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

  async function handleStart() {
    const data = await startSession([], questionCount);
    setActiveSessionId(data.sessionId);
    setQuestions(data.questions);
    setCurrentIndex(0);
    setPhase("question");
  }

  async function handleSubmitAnswer(value: string) {
    if (!activeSessionId || submitting) return;
    setSubmitting(true);
    const result = await gradeAnswer(activeSessionId, questions[currentIndex].id, value);
    setLastResult(result);
    setPhase("feedback");
    setSubmitting(false);
  }

  function handleNext() {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      loadSummary();
    } else {
      setCurrentIndex(next);
      setLastResult(null);
      setPhase("question");
    }
  }

  function handleSkip() {
    handleNext();
  }

  async function loadSummary() {
    const s = await getSessionSummary(activeSessionId ?? sessionId);
    setSummary(s);
    setPhase("summary");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--bg-primary)", paddingTop: "96px" }}
    >
      <AnimatePresence mode="wait">
        {/* ── Entry: question count picker ── */}
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

            <RadioGroup
              value={String(questionCount)}
              onValueChange={(v) => setQuestionCount(Number(v))}
            >
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

        {/* ── Question ── */}
        {phase === "question" && questions[currentIndex] && (
          <motion.div key={`q-${currentIndex}`} className="w-full">
            <QuestionCard
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
              onSubmit={handleSubmitAnswer}
              onSkip={handleSkip}
              disabled={submitting}
            />
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

        {/* ── Summary ── */}
        {phase === "summary" && summary && (
          <motion.div key="summary" className="w-full">
            <SessionSummary summary={summary} subjectId={subjectId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
