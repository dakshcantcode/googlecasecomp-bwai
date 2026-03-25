"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TeachbackPromptProps {
  conceptLabel: string;
  sessionId: string;
  conceptId: string;
  onSubmit: (text: string) => void;
}

const MIN_TEACHBACK_CHARS = 40;

export default function TeachbackPrompt({ conceptLabel, sessionId, conceptId, onSubmit }: TeachbackPromptProps) {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [approved, setApproved] = useState(false);
  const [done, setDone] = useState(false);
  const feedbackRef = useRef("");

  async function handleSubmit() {
    if (text.length < MIN_TEACHBACK_CHARS || streaming) return;
    setStreaming(true);
    setFeedback("");
    setDone(false);
    feedbackRef.current = "";

    try {
      const res = await fetch(`/api/session/${sessionId}/teachback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, conceptId }),
      });

      if (!res.ok || !res.body) {
        setStreaming(false);
        // Fall through to grade without streaming feedback
        onSubmit(text);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { token } = JSON.parse(payload);
            feedbackRef.current += token;
            setFeedback(feedbackRef.current);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      // Network error — grade without streaming feedback
      setStreaming(false);
      onSubmit(text);
      return;
    }

    setStreaming(false);
    setDone(true);
    const wasApproved = feedbackRef.current.toLowerCase().includes("mastered");
    setApproved(wasApproved);
    // Always submit for grading regardless of approval
    onSubmit(text);
    if (wasApproved) {
      // onSubmit will trigger navigation; no extra action needed
    }
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
        placeholder={`Type your explanation here (min ${MIN_TEACHBACK_CHARS} chars)…`}
        rows={6}
        disabled={streaming || done}
        className="resize-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: text.length >= MIN_TEACHBACK_CHARS ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
          {text.length} / {MIN_TEACHBACK_CHARS} chars
        </span>
        <Button
          onClick={handleSubmit}
          disabled={text.length < MIN_TEACHBACK_CHARS || streaming || done}
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
        </div>
      )}
    </div>
  );
}
