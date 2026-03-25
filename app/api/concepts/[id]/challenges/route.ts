import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export interface Challenge {
  id: string;
  title: string;
  timeMinutes: number;
  type: "recall" | "explain" | "apply";
  task: string;
  options: string[];
  correct_option_index: number;
  hint: string;
  xp: number;
  explanation: string;
}

export interface ChallengesResponse {
  challenges: Challenge[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: concept } = await adminSupabase
    .from("concept_nodes")
    .select("id, label, definition")
    .eq("id", id)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  const prompt = `Generate 6 fast-paced multiple choice challenges for the concept: "${concept.label}".
Definition: ${concept.definition ?? "N/A"}

Return a JSON object with a single key "challenges" containing an array. Each challenge must have:
- "id": unique string like "c1", "c2", etc.
- "title": short challenge title (3-6 words)
- "timeMinutes": always 5
- "type": one of "recall", "explain", or "apply"
- "task": one-sentence question for the student
- "options": array of exactly 4 answer options (short, distinct)
- "correct_option_index": integer 0-3
- "hint": one short hint to help if stuck
- "xp": integer between 20 and 80
- "explanation": 1-2 sentence explanation of why the correct option is right

Make challenges progressively harder: first 2 recall, next 2 explain, last 2 apply.
Do not include markdown. Return valid JSON only.`;

  let challenges: Challenge[] = [];

  try {
    const geminiResult = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    const raw = geminiResult.text ?? "";
    const parsed = JSON.parse(raw);
    challenges = Array.isArray(parsed.challenges) ? parsed.challenges : [];
  } catch {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0].message.content ?? "{}";
      const parsed = JSON.parse(raw);
      challenges = Array.isArray(parsed.challenges) ? parsed.challenges : [];
    } catch {
      challenges = [];
    }
  }

  // Normalize and validate model output.
  const normalized = challenges
    .map((c, index) => {
      const options = Array.isArray(c.options) ? c.options.filter(Boolean).slice(0, 4) : [];
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }
      const idxRaw = Number(c.correct_option_index);
      const correctIndex = Number.isFinite(idxRaw)
        ? Math.min(3, Math.max(0, Math.floor(idxRaw)))
        : 0;
      const xp = Number.isFinite(Number(c.xp))
        ? Math.min(120, Math.max(15, Math.floor(Number(c.xp))))
        : 30;

      return {
        id: c.id || `c${index + 1}`,
        title: c.title || `Challenge ${index + 1}`,
        timeMinutes: 5,
        type: (c.type === "recall" || c.type === "explain" || c.type === "apply") ? c.type : "recall",
        task: c.task || `What best describes ${concept.label}?`,
        options,
        correct_option_index: correctIndex,
        hint: c.hint || "Focus on the key definition first.",
        xp,
        explanation: c.explanation || concept.definition || "Review the concept notes and retry.",
      } as Challenge;
    })
    .slice(0, 8);

  if (normalized.length === 0) {
    challenges = [
      {
        id: "c1",
        title: `Define ${concept.label}`,
        timeMinutes: 5,
        type: "recall",
        task: `Which option best defines "${concept.label}"?`,
        options: [
          concept.definition ?? `A core idea within ${concept.label}`,
          "An unrelated memorization trick",
          "A social media study strategy",
          "A type of file format",
        ],
        correct_option_index: 0,
        hint: "Look for the option that describes what it is, not where it appears.",
        xp: 25,
        explanation: concept.definition ?? "Review your notes for the concept definition.",
      },
    ];
  } else {
    challenges = normalized;
  }

  return Response.json({ challenges });
}
