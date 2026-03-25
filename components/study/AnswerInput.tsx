"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import KaTeXRenderer from "./KaTeXRenderer";
import type { Question } from "@/lib/api";

interface AnswerInputProps {
  question: Question;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export default function AnswerInput({ question, onSubmit, disabled }: AnswerInputProps) {
  const [value, setValue] = useState("");
  const [selectedChoice, setSelectedChoice] = useState("");
  const [stepValues, setStepValues] = useState<string[]>(() => (question.steps ?? []).map(() => ""));
  const [activeStep, setActiveStep] = useState(0);

  function handleSubmit() {
    let answer = "";
    if (question.type === "multiple-choice") answer = selectedChoice;
    else if (question.type === "multi-step") answer = stepValues.join(" | ");
    else answer = value;
    if (answer.trim()) onSubmit(answer.trim());
  }

  if (question.type === "multiple-choice") {
    return (
      <div className="space-y-3">
        <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice} disabled={disabled}>
          {question.choices?.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-4 py-3 border cursor-pointer transition-colors"
              style={{
                background: selectedChoice === String(i) ? "rgba(212,168,67,0.08)" : "var(--bg-secondary)",
                borderColor: selectedChoice === String(i) ? "var(--accent-primary)" : "var(--border-default)",
              }}
              onClick={() => !disabled && setSelectedChoice(String(i))}
            >
              <RadioGroupItem value={String(i)} id={`choice-${i}`} />
              <Label htmlFor={`choice-${i}`} className="cursor-pointer flex-1">
                <KaTeXRenderer text={c} />
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Button
          onClick={handleSubmit}
          disabled={disabled || !selectedChoice}
          className="w-full rounded-full"
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        >
          Submit answer
        </Button>
      </div>
    );
  }

  if (question.type === "numeric") {
    return (
      <div className="flex gap-2">
        <Input
          type="number"
          step="any"
          placeholder="Enter value…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        {question.unit && (
          <div
            className="flex items-center px-3 rounded-lg text-sm border"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
          >
            {question.unit}
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={disabled || !value}
          style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          className="rounded-full px-5"
        >
          Submit
        </Button>
      </div>
    );
  }

  if (question.type === "multi-step") {
    const steps = question.steps ?? [];
    return (
      <div className="space-y-3">
        {steps.slice(0, activeStep + 1).map((step, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}>
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              Step {i + 1}: <KaTeXRenderer text={step} />
            </p>
            {i < activeStep ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{stepValues[i]}</p>
            ) : (
              <Input
                placeholder="Your answer for this step…"
                value={stepValues[i]}
                onChange={(e) => {
                  const next = [...stepValues];
                  next[i] = e.target.value;
                  setStepValues(next);
                }}
                disabled={disabled}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={() => setActiveStep((s) => s + 1)}
              disabled={disabled || !stepValues[activeStep]}
              variant="outline"
              className="rounded-full"
            >
              Next step
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={disabled || !stepValues[activeStep]}
              className="rounded-full"
              style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            >
              Submit all steps
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (question.type === "teachback") {
    const minChars = 100;
    const ready = value.length >= minChars;
    return (
      <div className="space-y-2">
        <Textarea
          placeholder="Explain the concept in your own words (min 100 characters)…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          rows={6}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: ready ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
            {value.length} / {minChars} chars
          </span>
          <Button
            onClick={handleSubmit}
            disabled={disabled || !ready}
            className="rounded-full px-5"
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
          >
            Submit explanation
          </Button>
        </div>
      </div>
    );
  }

  // free-text and latex
  return (
    <div className="space-y-2">
      {question.type === "latex" ? (
        <Textarea
          placeholder="Type LaTeX here (e.g. f'(x) = …)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          rows={3}
          className="font-mono resize-none"
          style={{ fontFamily: "var(--font-jetbrains, monospace)" }}
        />
      ) : (
        <Textarea
          placeholder="Write your answer here…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          rows={4}
          className="resize-none"
        />
      )}
      {question.type === "latex" && value && (
        <div
          className="rounded px-3 py-2 text-sm border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
        >
          <KaTeXRenderer text={`$${value}$`} />
        </div>
      )}
      <Button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-full rounded-full"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
      >
        Submit answer
      </Button>
    </div>
  );
}
