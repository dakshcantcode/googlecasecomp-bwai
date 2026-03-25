"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidChart from "@/components/ui/MermaidChart";

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

interface NotesModeProps {
  notes: NotesData;
}

export function NotesMode({ notes }: NotesModeProps) {
  return (
    <div className="space-y-8">
      {/* Concept header */}
      <div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
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
            style={{ color: "var(--accent-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {section.title}
          </h2>
          <div className="prose prose-sm max-w-none" style={{ color: "var(--text-secondary)" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
                strong: ({ children }) => <strong style={{ color: "var(--text-primary)" }}>{children}</strong>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-secondary)", color: "var(--accent-primary)" }}>
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
            style={{ color: "var(--accent-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Concept Flowchart
          </h2>
          <MermaidChart chart={notes.mermaid} />
        </div>
      )}
    </div>
  );
}
