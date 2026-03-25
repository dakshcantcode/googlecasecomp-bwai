"use client";

import { Button } from "@/components/ui/button";
import KaTeXRenderer from "./KaTeXRenderer";
import type { ConceptData } from "@/lib/mockConcepts";

interface Props {
  concept: ConceptData;
  onTryQuestion: () => void;
}

export default function SimplifiedText({ concept, onTryQuestion }: Props) {
  return (
    <div className="rounded-lg border p-6 space-y-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      <div>
        <span className="newspaper-label">EXPLAINER</span>
        <div className="newspaper-rule mt-1 mb-3" />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {concept.label}
        </h2>
      </div>

      {/* Main explanation */}
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--text-secondary)" }}>
        {concept.simplified_text.split("\n\n").map((para, i) => (
          <p key={i}><KaTeXRenderer text={para} /></p>
        ))}
      </div>

      {/* Key formula */}
      {concept.formulas[0] && (
        <div
          className="rounded px-4 py-3 text-center"
          style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)" }}
        >
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--accent-primary)" }}>Key formula</p>
          <KaTeXRenderer text={`$$${concept.formulas[0]}$$`} />
        </div>
      )}

      {/* Common mistake callout */}
      {concept.common_mistakes[0] && (
        <div
          className="rounded px-4 py-3 text-sm"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--text-secondary)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#F87171" }}>Common mistake</p>
          <KaTeXRenderer text={concept.common_mistakes[0]} />
        </div>
      )}

      <Button
        size="sm"
        className="rounded-full w-full"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        onClick={onTryQuestion}
      >
        Try a question on this →
      </Button>
    </div>
  );
}
