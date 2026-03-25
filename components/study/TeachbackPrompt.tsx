"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TeachbackPromptProps {
  conceptLabel: string;
  onApproved: () => void;
}

export default function TeachbackPrompt({ conceptLabel, onApproved }: TeachbackPromptProps) {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [approved, setApproved] = useState(false);
  const feedbackRef = useRef("");

  async function handleSubmit() {
    if (text.length < 100 || streaming) return;
    setStreaming(true);
    setFeedback("");
    feedbackRef.current = "";

    // Mock streaming — real implementation would use ReadableStream from /api/session/:id/teachback
    const mockTokens = [
      "Good start. ",
      "You've captured the main idea ",
      "that the chain rule applies to composite functions. ",
      "Your example is helpful. ",
      "One nuance: remember that the outer function is evaluated at g(x), not x. ",
      "Overall — concept mastered.",
    ];

    for (const token of mockTokens) {
      await new Promise((r) => setTimeout(r, 180));
      feedbackRef.current += token;
      setFeedback(feedbackRef.current);
    }

    setStreaming(false);
    const wasApproved = feedbackRef.current.includes("mastered");
    setApproved(wasApproved);
    if (wasApproved) setTimeout(onApproved, 1200);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="newspaper-label mb-1">TEACHBACK</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Explain <strong>{conceptLabel}</strong> as if teaching it to someone new. Include an example.
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your explanation here (min 100 chars)…"
        rows={6}
        disabled={streaming}
        className="resize-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: text.length >= 100 ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
          {text.length} / 100 chars
        </span>
        <Button
          onClick={handleSubmit}
          disabled={text.length < 100 || streaming}
          className="rounded-full px-5"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        >
          {streaming ? "Evaluating…" : "Submit"}
        </Button>
      </div>

      {feedback && (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{
            background: approved ? "rgba(74,222,128,0.06)" : "var(--bg-secondary)",
            borderColor: approved ? "rgba(74,222,128,0.4)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          {approved && <p className="font-semibold mb-1" style={{ color: "#4ADE80" }}>Concept mastered ✓</p>}
          <p>{feedback}</p>
          {!streaming && !approved && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => { setFeedback(""); setApproved(false); }}
            >
              Revise explanation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
