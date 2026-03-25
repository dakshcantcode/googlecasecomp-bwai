"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ConceptData } from "@/lib/mockConcepts";

interface Props {
  concept: ConceptData;
  onTryQuestion: () => void;
}

export default function YouTubeClip({ concept, onTryQuestion }: Props) {
  const clip = concept.youtube_clip;
  const [videoEnded, setVideoEnded] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);

  if (!clip) return null;

  const embedUrl =
    `https://www.youtube.com/embed/${clip.video_id}` +
    `?start=${clip.start_seconds}&end=${clip.end_seconds}` +
    `&rel=0&modestbranding=1&enablejsapi=1`;

  function handleSubmit() {
    const isCorrect = answer.trim().toLowerCase().includes(
      clip.comprehension_answer.split(" ").slice(0, 4).join(" ").toLowerCase()
    );
    setCorrect(isCorrect);
    setSubmitted(true);
  }

  return (
    <div className="rounded-lg border p-6 space-y-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      <div>
        <span className="newspaper-label">VIDEO EXPLANATION</span>
        <div className="newspaper-rule mt-1 mb-3" />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {concept.label}
        </h2>
      </div>

      {/* YouTube embed */}
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
        <iframe
          src={embedUrl}
          width="100%"
          style={{ aspectRatio: "16/9", display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${concept.label} video`}
        />
      </div>

      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        From: <span style={{ color: "var(--text-secondary)" }}>{clip.channel_name}</span>
        {" · "}Segment: {Math.floor(clip.start_seconds / 60)}:{String(clip.start_seconds % 60).padStart(2, "0")} – {Math.floor(clip.end_seconds / 60)}:{String(clip.end_seconds % 60).padStart(2, "0")}
      </p>

      {/* Show comprehension check after "video ends" — or after a reveal button */}
      {!videoEnded && (
        <button
          className="w-full text-sm py-2 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--bg-primary)" }}
          onClick={() => setVideoEnded(true)}
        >
          I've watched it — show comprehension check
        </button>
      )}

      {videoEnded && !submitted && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ background: "var(--bg-primary)", borderColor: "rgba(212,168,67,0.3)" }}
        >
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>
            Quick check
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {clip.comprehension_question}
          </p>
          <Textarea
            placeholder="Type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
          <Button
            size="sm"
            className="rounded-full"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            disabled={!answer.trim()}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      )}

      {submitted && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            background: correct ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${correct ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            color: "var(--text-secondary)",
          }}
        >
          <p className="font-semibold mb-1" style={{ color: correct ? "#4ADE80" : "#F87171" }}>
            {correct ? "Correct!" : "Not quite."}
          </p>
          {!correct && (
            <p>Key idea: <em>{clip.comprehension_answer}</em></p>
          )}
        </div>
      )}

      <Button
        size="sm"
        className="rounded-full w-full"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        onClick={onTryQuestion}
      >
        Back to questions →
      </Button>
    </div>
  );
}
