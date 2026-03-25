"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown } from "lucide-react";
import type { ScholarResponse } from "@/app/api/concepts/[id]/scholar/route";

interface ScholarModeProps {
  data: ScholarResponse;
}

export function ScholarMode({ data }: ScholarModeProps) {
  const [mode, setMode] = useState<"simple" | "technical">("simple");
  const [vocabOpen, setVocabOpen] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState<Set<number>>(new Set());

  function toggleTerm(i: number) {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div
        className="flex rounded-full p-0.5 w-fit"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
      >
        {(["simple", "technical"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="relative px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: mode === m ? "var(--accent-primary)" : "transparent",
              color: mode === m ? "#1A1A1A" : "var(--text-tertiary)",
            }}
          >
            {m === "simple" ? "Simplified" : "Technical"}
          </button>
        ))}
      </div>

      {mode === "simple" && (
        <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
          Simplified language · everyday analogies · grade-10 reading level
        </p>
      )}
      {mode === "technical" && (
        <p className="text-xs italic" style={{ color: "var(--accent-primary)" }}>
          Exam-accurate language · precise definitions · academic vocabulary
        </p>
      )}

      {/* Sections */}
      {data.sections.map((section) => (
        <div key={section.title}>
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: "var(--accent-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {section.title}
          </h2>
          <div className="prose prose-sm max-w-none" style={{ color: "var(--text-secondary)" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong style={{ color: "var(--text-primary)" }}>{children}</strong>,
              }}
            >
              {mode === "simple" ? section.simple : section.technical}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {/* Vocabulary Decoder */}
      {data.vocabulary.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-default)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            onClick={() => setVocabOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <span style={{ color: "var(--accent-primary)" }}>📖</span>
              Vocabulary Decoder
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,168,67,0.1)", color: "var(--accent-primary)" }}>
                {data.vocabulary.length} terms
              </span>
            </span>
            <ChevronDown
              size={14}
              style={{
                color: "var(--text-tertiary)",
                transform: vocabOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {vocabOpen && (
            <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
              {data.vocabulary.map((item, i) => (
                <div key={item.term} className="px-4 py-3">
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => toggleTerm(i)}
                  >
                    <span
                      className="font-semibold text-sm"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
                    >
                      {item.term}
                    </span>
                    <ChevronDown
                      size={12}
                      style={{
                        color: "var(--text-tertiary)",
                        transform: expandedTerms.has(i) ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {item.simple_definition}
                  </p>
                  {expandedTerms.has(i) && (
                    <p className="text-xs mt-2 italic" style={{ color: "var(--text-tertiary)" }}>
                      Technical: {item.technical_definition}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
