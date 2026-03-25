"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/study/QuestionCard";
import FeedbackCard from "@/components/study/FeedbackCard";
import ZeigarnikBar from "@/components/study/ZeigarnikBar";
import { startSession, gradeAnswer } from "@/lib/api";
import type { Question, GradeResult } from "@/lib/api";

type Phase = "loading" | "question" | "feedback" | "done";

function DailyStudyInner() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadQuestion() {
    const data = await startSession([], 1);
    setSessionId(data.sessionId);
    setQuestion(data.questions[0]);
    setPhase("question");
  }

  // Load on first render
  if (phase === "loading" && !question) {
    loadQuestion();
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-2"
          style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  async function handleSubmit(value: string) {
    if (!sessionId || !question || submitting) return;
    setSubmitting(true);
    const res = await gradeAnswer(sessionId, question.id, value);
    setResult(res);
    setAnswered(true);
    setPhase("feedback");
    setSubmitting(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg-primary)", paddingTop: "80px", paddingBottom: "80px" }}
    >
      {/* Subtle header */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center gap-3">
          <span className="newspaper-label">DAILY QUESTION</span>
          <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "question" && question && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-2xl"
          >
            <QuestionCard
              question={question}
              index={0}
              total={1}
              onSubmit={handleSubmit}
              onSkip={() => setPhase("done")}
              disabled={submitting}
            />
          </motion.div>
        )}

        {phase === "feedback" && result && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl space-y-4"
          >
            <FeedbackCard
              result={result}
              onNext={() => setPhase("done")}
              onRetry={() => {
                setResult(null);
                setAnswered(false);
                setPhase("question");
              }}
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center space-y-5"
          >
            <div
              className="rounded-lg border p-8"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
            >
              <p className="text-4xl mb-4">{result?.correct ? "⚡" : "📖"}</p>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
              >
                {result?.correct ? "Nailed it." : "Keep going."}
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {result?.correct
                  ? "That retrieval just made it stick a little more."
                  : "Each attempt deepens the trace. Come back tomorrow."}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                className="flex-1 rounded-full"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                onClick={() => (window.location.href = "/study/mock-session")}
              >
                Full session →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zeigarnik bar — 1 dot, appears after answer */}
      <ZeigarnikBar total={1} completed={answered ? 1 : 0} visible={answered} />
    </div>
  );
}

export default function DailyStudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
      </div>
    }>
      <DailyStudyInner />
    </Suspense>
  );
}
