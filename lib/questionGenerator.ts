/**
 * Shared question generation logic used by both the generate endpoint
 * and the session start endpoint.
 */

import { groq, GROQ_MODEL } from "@/lib/groq";
import { adminSupabase } from "@/lib/supabase/admin";
import type { QuestionType } from "@/lib/api";

interface DBQuestion {
  id: string;
  concept_id: string;
  type: string;
  prompt: string;
  choices_json: unknown;
  answer: string | null;
}

export interface GeneratedQuestion {
  id: string;
  conceptId: string;
  conceptLabel: string;
  type: QuestionType;
  prompt: string;
  choices?: string[];
  unit?: string;
  steps?: string[];
  answer?: string;
}

/** Map a DB row to the Question shape the frontend expects */
export function dbRowToQuestion(row: DBQuestion, conceptLabel: string): GeneratedQuestion {
  const meta = (row.choices_json ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    conceptId: row.concept_id,
    conceptLabel,
    type: row.type as QuestionType,
    prompt: row.prompt,
    choices: Array.isArray(meta.choices) ? (meta.choices as string[]) : undefined,
    unit: typeof meta.unit === "string" ? meta.unit : undefined,
    steps: Array.isArray(meta.steps) ? (meta.steps as string[]) : undefined,
    answer: row.answer ?? undefined,
  };
}

/** Generate and persist questions for a concept, return them. */
export async function generateQuestionsForConcept(
  conceptId: string,
  label: string,
  definition: string
): Promise<GeneratedQuestion[]> {
  const prompt = `You are creating exam study questions for a student.

Concept: "${label}"
Definition: "${definition}"

Generate exactly 6 questions — one for each type listed below.
Return ONLY a JSON object (no markdown, no explanation) with this exact structure:

{
  "free-text": {
    "prompt": "An open-ended question requiring a written explanation"
  },
  "multiple-choice": {
    "prompt": "A question with 4 options",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "1"
  },
  "numeric": {
    "prompt": "A question requiring a single numeric answer",
    "answer": "42",
    "unit": "unit of measurement or 'dimensionless'"
  },
  "multi-step": {
    "prompt": "A multi-step problem",
    "steps": ["Step 1 hint", "Step 2 hint", "Step 3 hint"]
  },
  "latex": {
    "prompt": "A question whose answer is a mathematical expression",
    "answer": "LaTeX expression without dollar signs"
  },
  "teachback": {
    "prompt": "Explain ${label} to someone who has never heard of it. Include a concrete example."
  }
}

For multiple-choice, "answer" is the 0-based index of the correct option as a string.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  let parsed: Record<string, Record<string, unknown>> = {};
  try {
    parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    // If Groq returns garbage, fall back to a small mixed set (not all subjective)
    parsed = {
      "free-text": { prompt: `Explain the concept of "${label}" in your own words.` },
      "multiple-choice": {
        prompt: `Which option best describes ${label}?`,
        choices: [
          definition || `${label} is a core concept in this topic.`,
          `${label} is unrelated to this subject.`,
          `${label} is only a memorization trick.`,
          `${label} is a file type.`,
        ],
        answer: "0",
      },
      "numeric": {
        prompt: `Give a key numeric value associated with ${label} if applicable, otherwise enter 1.`,
        answer: "1",
        unit: "dimensionless",
      },
      "latex": {
        prompt: `Write a symbolic expression relevant to ${label}.`,
        answer: "x",
      },
    };
  }

  const TYPES: QuestionType[] = [
    "free-text", "multiple-choice", "numeric", "multi-step", "latex", "teachback",
  ];

  const rows = TYPES.filter((t) => parsed[t]?.prompt).map((t) => {
    const q = parsed[t] as Record<string, unknown>;
    let choicesJson: Record<string, unknown> | null = null;
    let answer: string | null = null;

    if (t === "multiple-choice") {
      choicesJson = { choices: q.choices ?? [] };
      answer = String(q.answer ?? "0");
    } else if (t === "numeric") {
      choicesJson = { unit: q.unit ?? "" };
      answer = String(q.answer ?? "");
    } else if (t === "multi-step") {
      choicesJson = { steps: q.steps ?? [] };
    } else if (t === "latex") {
      answer = String(q.answer ?? "");
    }

    return {
      concept_id: conceptId,
      type: t,
      prompt: String(q.prompt),
      choices_json: choicesJson,
      answer,
    };
  });

  if (rows.length === 0) return [];

  const { data: inserted, error } = await adminSupabase
    .from("questions")
    .insert(rows)
    .select("id, concept_id, type, prompt, choices_json, answer");

  if (error || !inserted) return [];

  return inserted.map((row: DBQuestion) => dbRowToQuestion(row, label));
}

/** Fetch existing questions for a concept, or generate if none exist. */
export async function getOrGenerateQuestions(
  conceptId: string,
  label: string,
  definition: string
): Promise<GeneratedQuestion[]> {
  const { data: existing } = await adminSupabase
    .from("questions")
    .select("id, concept_id, type, prompt, choices_json, answer")
    .eq("concept_id", conceptId);

  if (existing && existing.length > 0) {
    const mapped = (existing as DBQuestion[]).map((row) => dbRowToQuestion(row, label));
    const hasObjective = mapped.some((q) =>
      q.type === "multiple-choice" || q.type === "numeric" || q.type === "latex" || q.type === "multi-step"
    );

    if (hasObjective) return mapped;

    // Legacy concepts may have only subjective questions; regenerate a balanced set.
    return generateQuestionsForConcept(conceptId, label, definition);
  }

  return generateQuestionsForConcept(conceptId, label, definition);
}
