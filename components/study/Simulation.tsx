"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import KaTeXRenderer from "./KaTeXRenderer";
import type { ConceptData } from "@/lib/mockConcepts";

interface Props {
  concept: ConceptData;
  onTryQuestion: () => void;
}

// Safely evaluate a simple numeric expression (no LaTeX — the formula in simulation_config
// is a JS-evaluable expression, not LaTeX)
function evalFormula(formula: string, vars: Record<string, number>): number {
  try {
    // Replace variable names with their values
    let expr = formula;
    for (const [k, v] of Object.entries(vars)) {
      expr = expr.replace(new RegExp(`\\b${k}\\b`, "g"), String(v));
    }
    // Only allow safe arithmetic characters
    if (/[^0-9+\-*/().^ e]/.test(expr)) return 0;
    // eslint-disable-next-line no-new-func
    return Number(new Function(`return ${expr.replace(/\^/g, "**")}`)());
  } catch {
    return 0;
  }
}

export default function Simulation({ concept, onTryQuestion }: Props) {
  const cfg = concept.simulation_config;

  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(cfg.variables.map((v) => [v.name, v.default]))
  );

  const output = evalFormula(cfg.output_formula, values);
  const maxOutput = evalFormula(
    cfg.output_formula,
    Object.fromEntries(cfg.variables.map((v) => [v.name, v.max]))
  );
  const barWidth = Math.min(100, Math.max(4, (Math.abs(output) / (Math.abs(maxOutput) || 1)) * 100));

  return (
    <div className="rounded-lg border p-6 space-y-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      <div>
        <span className="newspaper-label">INTERACTIVE</span>
        <div className="newspaper-rule mt-1 mb-3" />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
        >
          {concept.label}
        </h2>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        {cfg.variables.map((v) => (
          <div key={v.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {v.label}
              </label>
              <span
                className="text-sm font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(212,168,67,0.12)", color: "var(--accent-primary)" }}
              >
                {values[v.name].toFixed(1)}
              </span>
            </div>
            <Slider
              min={v.min}
              max={v.max}
              step={v.step}
              value={[values[v.name]]}
              onValueChange={(nextValue) => {
                const val = Array.isArray(nextValue) ? nextValue[0] : nextValue;
                setValues((prev) => ({ ...prev, [v.name]: val }));
              }}
            />
            <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
              <span>{v.min}</span>
              <span>{v.max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual output — bar */}
      <div
        className="rounded-lg px-4 py-4 space-y-3"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)" }}
      >
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {cfg.output_label}
        </p>
        <div className="relative h-6 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
            style={{ width: `${barWidth}%`, background: "var(--accent-primary)" }}
          />
        </div>
        <div className="text-center">
          <span
            className="text-2xl font-bold font-mono"
            style={{ color: "var(--accent-primary)" }}
          >
            {isNaN(output) ? "—" : output.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Formula display */}
      <div className="text-center">
        <KaTeXRenderer text={`$$${cfg.output_formula}$$`} />
      </div>

      {/* Prompt */}
      <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
        Drag the sliders. Watch how {cfg.output_label.toLowerCase()} changes.
      </p>

      <Button
        size="sm"
        className="rounded-full w-full"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        onClick={onTryQuestion}
      >
        Now answer this →
      </Button>
    </div>
  );
}
