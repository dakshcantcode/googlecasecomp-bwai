/**
 * Co-Synapse API client
 * All endpoints return typed responses.
 * MOCK_MODE=true returns hardcoded fixtures; flip to false to hit real backend.
 */

const MOCK_MODE = false;

export type QuestionType = "free-text" | "multiple-choice" | "numeric" | "multi-step" | "latex" | "teachback";
export type ErrorType = "careless" | "procedural" | "conceptual" | "fatigue";

export interface Question {
  id: string;
  conceptId: string;
  conceptLabel: string;
  type: QuestionType;
  prompt: string;
  choices?: string[];       // multiple-choice
  unit?: string;            // numeric
  steps?: string[];         // multi-step
  answer?: string;          // for mock grading
}

export interface GradeResult {
  correct: boolean;
  errorType?: ErrorType;
  explanation: string;
  hint?: string;
  patternAlert?: { errorType: ErrorType; count: number } | null;
  masteryDelta: number;
}

export interface SessionSummaryData {
  questionCount: number;
  correctCount: number;
  masteryBefore: Record<string, number>;
  masteryAfter: Record<string, number>;
  errorBreakdown: Record<ErrorType, number>;
  nextReviewDate: string;
}

/* ─── Mock fixtures ─────────────────────────────────────────── */

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1", conceptId: "chain-rule", conceptLabel: "Chain Rule",
    type: "multiple-choice",
    prompt: "What is the derivative of $f(g(x))$?",
    choices: ["$f'(g(x))$", "$f'(g(x)) \\cdot g'(x)$", "$f'(x) \\cdot g'(x)$", "$f(g'(x))$"],
    answer: "1",
  },
  {
    id: "q2", conceptId: "integration", conceptLabel: "Integration",
    type: "free-text",
    prompt: "Explain in your own words why $\\int_a^b f'(x)\\,dx = f(b) - f(a)$.",
    answer: "fundamental theorem",
  },
  {
    id: "q3", conceptId: "limits", conceptLabel: "Limits",
    type: "numeric",
    prompt: "Evaluate $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.",
    unit: "(exact value)",
    answer: "1",
  },
  {
    id: "q4", conceptId: "derivatives", conceptLabel: "Derivatives",
    type: "multi-step",
    prompt: "Differentiate $y = (3x^2 + 1)^4$ using the chain rule.",
    steps: ["Identify inner function $u$", "Find $du/dx$", "Apply chain rule: $dy/dx = 4u^3 \\cdot du/dx$", "Substitute back"],
    answer: "24x(3x^2+1)^3",
  },
  {
    id: "q5", conceptId: "product-rule", conceptLabel: "Product Rule",
    type: "latex",
    prompt: "Write the product rule formula for $\\frac{d}{dx}[u(x)v(x)]$.",
    answer: "u'v + uv'",
  },
  {
    id: "q6", conceptId: "chain-rule", conceptLabel: "Chain Rule",
    type: "teachback",
    prompt: "Teach the chain rule as if explaining it to a student who has never seen it. Include an example.",
    answer: "chain rule f prime g x times g prime x",
  },
];

/* ─── API functions ─────────────────────────────────────────── */

export async function startSession(conceptIds: string[], questionCount: number): Promise<{ sessionId: string; questions: Question[] }> {
  if (MOCK_MODE) {
    const questions = MOCK_QUESTIONS.slice(0, questionCount);
    return { sessionId: "mock-session", questions };
  }
  const res = await fetch("/api/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conceptIds, questionCount }),
  });
  return res.json();
}

export async function gradeAnswer(sessionId: string, questionId: string, answer: string): Promise<GradeResult> {
  if (MOCK_MODE) {
    const q = MOCK_QUESTIONS.find((q) => q.id === questionId);
    const correct = q?.answer ? answer.toLowerCase().includes(q.answer.toLowerCase()) : Math.random() > 0.4;
    return {
      correct,
      errorType: correct ? undefined : (["careless", "procedural", "conceptual"] as ErrorType[])[Math.floor(Math.random() * 3)],
      explanation: correct
        ? "Excellent — that's precisely right. You've demonstrated solid understanding."
        : "Not quite. Review the core definition and try applying it step-by-step.",
      hint: correct ? undefined : "Consider what happens when you apply the rule to the outermost function first.",
      patternAlert: !correct && Math.random() > 0.6 ? { errorType: "procedural", count: 3 } : null,
      masteryDelta: correct ? 4 : -2,
    };
  }
  const res = await fetch(`/api/session/${sessionId}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, answer }),
  });
  return res.json();
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummaryData> {
  if (MOCK_MODE) {
    return {
      questionCount: 5,
      correctCount: 3,
      masteryBefore: { "chain-rule": 60, integration: 48, limits: 85 },
      masteryAfter: { "chain-rule": 68, integration: 46, limits: 89 },
      errorBreakdown: { careless: 1, procedural: 1, conceptual: 0, fatigue: 0 },
      nextReviewDate: "Tomorrow",
    };
  }
  const res = await fetch(`/api/session/${sessionId}/summary`);
  return res.json();
}

export async function sendTelemetry(
  sessionId: string,
  payload: object
): Promise<{ interventionType?: string } | void> {
  if (MOCK_MODE) return;
  const res = await fetch(`/api/session/${sessionId}/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
