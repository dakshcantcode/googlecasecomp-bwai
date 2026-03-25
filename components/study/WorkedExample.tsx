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

export default function WorkedExample({ concept, onTryQuestion }: Props) {
  const example = concept.worked_examples[0];
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (!example) return null;

  function toggle(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="rounded-lg border p-6 space-y-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      <div>
        <span className="newspaper-label">WORKED EXAMPLE</span>
        <div className="newspaper-rule mt-1 mb-3" />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {concept.label}
        </h2>
      </div>

      {/* Problem statement */}
      <div
        className="rounded px-4 py-3 text-sm"
        style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)", color: "var(--text-primary)" }}
      >
        <KaTeXRenderer text={example.problem} />
      </div>

      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Try to predict each step before revealing it.
      </p>

      {/* Collapsible steps */}
      <div className="space-y-2">
        {example.steps.map((step, i) => {
          const isOpen = revealed.has(i);
          return (
            <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left"
                style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}
                onClick={() => toggle(i)}
              >
                <span>
                  <span className="font-semibold mr-2" style={{ color: "var(--accent-primary)" }}>Step {i + 1}:</span>
                  {step.description}
                </span>
                <ChevronDown size={14} className={`flex-shrink-0 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 space-y-2" style={{ background: "var(--bg-secondary)" }}>
                  <div className="rounded px-3 py-2 text-center" style={{ background: "rgba(212,168,67,0.08)" }}>
                    <KaTeXRenderer text={`$$${step.math}$$`} />
                  </div>
                  <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
                    {step.annotation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Final answer — only after all steps revealed */}
      {revealed.size === example.steps.length && (
        <div
          className="rounded px-4 py-3 text-center"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}
        >
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#4ADE80" }}>Final answer</p>
          <KaTeXRenderer text={`$$${example.final_answer}$$`} />
        </div>
      )}

      <Button
        size="sm"
        className="rounded-full w-full"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        onClick={onTryQuestion}
      >
        Now try a similar one →
      </Button>
    </div>
  );
}
