"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import KaTeXRenderer from "./KaTeXRenderer";
import type { ConceptData } from "@/lib/mockConcepts";

interface Props {
  concept: ConceptData;
  onTryQuestion: () => void;
}

export default function DetailedText({ concept, onTryQuestion }: Props) {
  const [open, setOpen] = useState(false);

  // Split detailed_text into blocks separated by blank lines
  const blocks = concept.detailed_text.split("\n\n");

  return (
    <div className="rounded-lg border p-6 space-y-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      <div>
        <span className="newspaper-label">DETAILED DERIVATION</span>
        <div className="newspaper-rule mt-1 mb-3" />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {concept.label}
        </h2>
      </div>

      {/* First block always visible */}
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <KaTeXRenderer text={blocks[0]} />
      </div>

      {/* Remaining blocks collapsible */}
      {blocks.length > 1 && (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium"
            style={{ color: "var(--text-secondary)", background: "var(--bg-primary)" }}
            onClick={() => setOpen((o) => !o)}
          >
            <span>{open ? "Hide full derivation" : "Show full derivation"}</span>
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div
              className="px-4 pb-4 space-y-4 text-sm leading-relaxed overflow-y-auto"
              style={{ maxHeight: 340, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
            >
              {blocks.slice(1).map((block, i) => (
                <div key={i}>
                  <KaTeXRenderer text={block} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All formulas */}
      {concept.formulas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Formulas</p>
          {concept.formulas.map((f, i) => (
            <div key={i} className="rounded px-4 py-3 text-center" style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              <KaTeXRenderer text={`$$${f}$$`} />
            </div>
          ))}
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
