import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";
import type { ErrorType } from "@/lib/api";

// SM-2 spaced repetition algorithm
function sm2(ef: number, interval: number, reps: number, quality: number) {
  if (quality < 3) return { ef, interval: 1, reps: 0 };
  const newEf = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const newInterval =
    reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * ef);
  return { ef: newEf, interval: newInterval, reps: reps + 1 };
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function gradeWithGroq(
  prompt: string,
  correctAnswer: string | null,
  studentAnswer: string,
  type: string
): Promise<{ correct: boolean; score: number; error_type: ErrorType | null; explanation: string; hint: string }> {
  const answerLine = correctAnswer
    ? `Correct answer: ${correctAnswer}\n`
    : "";

  const geminiPrompt = `You are grading a student's exam answer.

Question type: ${type}
Question: ${prompt}
${answerLine}Student's answer: ${studentAnswer}

Return ONLY a JSON object with no markdown:
{
  "correct": true or false,
  "score": integer 0-100,
  "error_type": "careless" | "procedural" | "conceptual" | "fatigue" | null,
  "explanation": "one or two sentence explanation of the grade",
  "hint": "a brief hint to help the student improve (empty string if correct)"
}

Rules:
- correct = true if score >= 60
- error_type = null if correct
- For teachback/free-text: assess conceptual accuracy, not wording
- For multiple-choice/numeric: match the provided correct answer exactly`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: geminiPrompt }],
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    const correct = studentAnswer.trim().length > 0;
    return {
      correct,
      score: correct ? 70 : 0,
      error_type: correct ? null : "conceptual",
      explanation: correct ? "Answer accepted." : "Could not parse your answer.",
      hint: correct ? "" : "Try providing more detail.",
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId, answer }: { questionId: string; answer: string } = await request.json();

  // Fetch question + concept
  const { data: question } = await adminSupabase
    .from("questions")
    .select("id, concept_id, type, prompt, choices_json, answer")
    .eq("id", questionId)
    .single();

  if (!question) return Response.json({ error: "Question not found" }, { status: 404 });

  const { data: concept } = await adminSupabase
    .from("concept_nodes")
    .select("id, mastery_pct, ease_factor, interval_days, repetitions")
    .eq("id", question.concept_id)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  const startMs = Date.now();

  // Grade by type
  let correct: boolean;
  let errorType: ErrorType | null = null;
  let explanation: string;
  let hint = "";

  if (question.type === "multiple-choice") {
    correct = answer.trim() === String(question.answer ?? "").trim();
    explanation = correct
      ? "Correct! That's the right option."
      : `Incorrect. The correct answer is option ${Number(question.answer ?? 0) + 1}.`;
    errorType = correct ? null : "careless";
  } else if (question.type === "numeric") {
    const studentNum = parseFloat(answer.replace(/[^0-9.\-]/g, ""));
    const correctNum = parseFloat(String(question.answer ?? ""));
    correct = !isNaN(studentNum) && !isNaN(correctNum) && Math.abs(studentNum - correctNum) / (Math.abs(correctNum) || 1) < 0.05;
    explanation = correct ? "Correct numeric value!" : `The expected answer is ${question.answer}.`;
    errorType = correct ? null : "procedural";
    hint = correct ? "" : "Check your calculation and units.";
  } else {
    // free-text, teachback, latex, multi-step — semantic grading via Gemini
    const result = await gradeWithGroq(question.prompt, question.answer, answer, question.type);
    correct = result.correct;
    errorType = result.error_type;
    explanation = result.explanation;
    hint = result.hint;
  }

  // SM-2 update
  const quality = correct ? 5 : 0;
  const updated = sm2(
    concept.ease_factor ?? 2.5,
    concept.interval_days ?? 1,
    concept.repetitions ?? 0,
    quality
  );

  const newMastery = Math.min(100, Math.max(0, (concept.mastery_pct ?? 0) + (correct ? 4 : -2)));
  const newState = newMastery >= 85 ? "mastered" : newMastery >= 40 ? "progress" : "locked";

  await adminSupabase
    .from("concept_nodes")
    .update({
      mastery_pct: newMastery,
      state: newState,
      ease_factor: updated.ef,
      interval_days: updated.interval,
      repetitions: updated.reps,
      due_date: addDays(updated.interval),
    })
    .eq("id", concept.id);

  // Insert session answer
  await adminSupabase.from("session_answers").insert({
    session_id: sessionId,
    question_id: questionId,
    answer,
    correct,
    error_type: errorType,
    response_ms: Date.now() - startMs,
  });

  // Pattern alert: same error_type >= 3 times in last 10 answers for this concept
  let patternAlert = null;
  if (!correct && errorType) {
    const { data: recent } = await adminSupabase
      .from("session_answers")
      .select("error_type, sessions!inner(user_id)")
      .eq("question_id", questionId)
      .eq("error_type", errorType)
      .filter("sessions.user_id", "eq", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const count = (recent ?? []).length;
    if (count >= 3) patternAlert = { errorType, count };
  }

  return Response.json({
    correct,
    errorType,
    explanation,
    hint: hint || undefined,
    patternAlert,
    masteryDelta: correct ? 4 : -2,
  });
}
