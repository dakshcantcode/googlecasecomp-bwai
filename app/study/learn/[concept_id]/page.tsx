"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidChart from "@/components/ui/MermaidChart";
import { startSession } from "@/lib/api";

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

type Phase = "loading" | "ready" | "starting";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const conceptId = params.concept_id as string;
  const subjectId = searchParams.get("subject") ?? "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/concepts/${conceptId}/notes`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(true); return; }
        setNotes(data);
        setPhase("ready");
      })
      .catch(() => setError(true));
  }, [conceptId]);

  async function handleStartQuiz() {
    setPhase("starting");
    try {
      const data = await startSession([conceptId], 5);
      if (data.sessionId) {
        router.push(`/study/${data.sessionId}?concept=${conceptId}&subject=${subjectId}`);
      }
    } catch {
      setPhase("ready");
    }
  }

  const backHref = subjectId ? `/web/${subjectId}` : "/dashboard";

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--bg-primary)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>Could not load notes for this concept.</p>
        <Button variant="ghost" onClick={() => router.push(backHref)}>Go back</Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)", paddingTop: "60px" }}
    >
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
          <span
            className="newspaper-label"
            style={{ color: "var(--text-primary)" }}
          >
            {notes.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
        {phase === "loading" ? (
          /* Loading skeleton */
          <div className="space-y-6 animate-pulse">
            <div className="h-8 rounded w-2/3" style={{ background: "var(--border-default)" }} />
            <div className="space-y-3">
              {[100, 90, 80, 95, 70].map((w, i) => (
                <div key={i} className="h-3 rounded" style={{ background: "var(--border-default)", width: `${w}%` }} />
              ))}
            </div>
            <div className="h-48 rounded-lg" style={{ background: "var(--border-default)" }} />
            <div className="space-y-3">
              {[100, 85, 90].map((w, i) => (
                <div key={i} className="h-3 rounded" style={{ background: "var(--border-default)", width: `${w}%` }} />
              ))}
            </div>
          </div>
        ) : notes ? (
          <>
            {/* Concept header */}
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  color: "var(--text-primary)",
                }}
              >
                {notes.label}
              </h1>
              {notes.definition && (
                <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
                  {notes.definition}
                </p>
              )}
            </div>

            {/* Prerequisites & unlocks */}
            {(notes.prerequisites.length > 0 || notes.unlocks.length > 0) && (
              <div
                className="flex flex-wrap gap-4 text-xs px-4 py-3 rounded-lg border"
                style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}
              >
                {notes.prerequisites.length > 0 && (
                  <div>
                    <span style={{ color: "var(--text-tertiary)" }}>Builds on: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{notes.prerequisites.join(", ")}</span>
                  </div>
                )}
                {notes.unlocks.length > 0 && (
                  <div>
                    <span style={{ color: "var(--text-tertiary)" }}>Unlocks: </span>
                    <span style={{ color: "var(--accent-primary)" }}>{notes.unlocks.join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Note sections */}
            {notes.sections.map((section) => (
              <div key={section.title}>
                <h2
                  className="text-base font-semibold mb-2"
                  style={{
                    color: "var(--accent-primary)",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                >
                  {section.title}
                </h2>
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
                      strong: ({ children }) => <strong style={{ color: "var(--text-primary)" }}>{children}</strong>,
                      code: ({ children }) => (
                        <code
                          className="px-1 py-0.5 rounded text-xs"
                          style={{ background: "var(--bg-secondary)", color: "var(--accent-primary)" }}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {/* Mermaid diagram */}
            {notes.mermaid && (
              <div>
                <h2
                  className="text-base font-semibold mb-3"
                  style={{
                    color: "var(--accent-primary)",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                >
                  Concept Flowchart
                </h2>
                <MermaidChart chart={notes.mermaid} />
              </div>
            )}

            {/* CTA */}
            <div
              className="flex flex-col items-center gap-3 py-8 border-t"
              style={{ borderColor: "var(--border-default)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Ready to test your understanding?
              </p>
              <Button
                className="rounded-full gap-2 px-8"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                onClick={handleStartQuiz}
                disabled={phase === "starting"}
              >
                <BookOpen size={15} />
                {phase === "starting" ? "Creating session…" : "I've reviewed these — Start Quiz"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
