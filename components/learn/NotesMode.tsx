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

function Pill({ label, tone = "default" }: { label: string; tone?: "default" | "accent" }) {
  return (
    <span
      className="text-[11px] px-2.5 py-1 rounded-full border"
      style={{
        background: tone === "accent" ? "rgba(212,168,67,0.14)" : "rgba(255,255,255,0.03)",
        borderColor: tone === "accent" ? "rgba(212,168,67,0.45)" : "var(--border-default)",
        color: tone === "accent" ? "var(--accent-primary)" : "var(--text-secondary)",
      }}
    >
      {label}
    </span>
  );
}

export function NotesMode({ notes }: NotesModeProps) {
  return (
    <div className="space-y-8">
      <section
        className="rounded-2xl border p-6 md:p-7"
        style={{
          borderColor: "rgba(212,168,67,0.35)",
          background:
            "radial-gradient(circle at 15% 0%, rgba(212,168,67,0.18), transparent 48%), radial-gradient(circle at 85% 100%, rgba(74,222,128,0.12), transparent 40%), var(--bg-secondary)",
        }}
      >
        <p className="newspaper-label mb-2">STUDY PLAN</p>
        <h1
          className="text-3xl md:text-4xl font-black mb-3 tracking-tight"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {notes.label}
        </h1>
        {notes.definition && (
          <p className="text-sm md:text-base leading-relaxed max-w-3xl" style={{ color: "var(--text-secondary)" }}>
            {notes.definition}
          </p>
        )}

        {(notes.prerequisites.length > 0 || notes.unlocks.length > 0) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {notes.prerequisites.map((p) => (
              <Pill key={`pre-${p}`} label={`Builds on: ${p}`} />
            ))}
            {notes.unlocks.map((u) => (
              <Pill key={`unlock-${u}`} label={`Unlocks: ${u}`} tone="accent" />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4">
        {notes.sections.map((section, idx) => (
          <section
            key={section.title}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}
          >
            <div
              className="px-4 md:px-5 py-3 border-b"
              style={{
                borderColor: "var(--border-default)",
                background: "linear-gradient(90deg, rgba(212,168,67,0.11), rgba(212,168,67,0.02))",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full text-[11px] flex items-center justify-center"
                  style={{ background: "rgba(212,168,67,0.22)", color: "var(--accent-primary)" }}
                >
                  {idx + 1}
                </span>
                <h2
                  className="text-base md:text-lg font-semibold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {section.title}
                </h2>
              </div>
            </div>

            <div className="px-4 md:px-5 py-4">
              <div className="prose prose-sm max-w-none" style={{ color: "var(--text-secondary)" }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mt-4 mb-2" style={{ color: "var(--text-primary)" }}>
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 mb-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 mb-3">{children}</ol>,
                    blockquote: ({ children }) => (
                      <blockquote
                        className="pl-3 py-1 my-3"
                        style={{ borderLeft: "3px solid var(--accent-primary)", background: "rgba(212,168,67,0.06)" }}
                      >
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ background: "var(--bg-primary)", color: "var(--accent-primary)" }}
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
          </section>
        ))}
      </div>

      {notes.mermaid && (
        <section
          className="rounded-xl border p-4 md:p-5"
          style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}
        >
          <h2
            className="text-base font-semibold mb-3"
            style={{ color: "var(--accent-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Concept Flowchart
          </h2>
          <MermaidChart chart={notes.mermaid} />
        </section>
      )}
    </div>
  );
}
