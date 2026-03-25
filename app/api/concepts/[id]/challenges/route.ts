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
  hint: string;
  xp: number;
  answer_guide: string;
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

  const prompt = `Generate 4-5 short interactive learning challenges for the concept: "${concept.label}".
Definition: ${concept.definition ?? "N/A"}

Return a JSON object with a single key "challenges" containing an array. Each challenge must have:
- "id": unique string like "c1", "c2", etc.
- "title": short challenge title (4-6 words)
- "timeMinutes": always 5
- "type": one of "recall", "explain", or "apply"
- "task": one-sentence question or prompt for the student
- "hint": one short hint to help if stuck
- "xp": integer between 10 and 30
- "answer_guide": 2-3 sentence model answer the student can compare against

Make challenges progressively harder: start with recall, then explain, then apply.`;

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

  if (challenges.length === 0) {
    challenges = [
      {
        id: "c1",
        title: `Define ${concept.label}`,
        timeMinutes: 5,
        type: "recall",
        task: `In your own words, define "${concept.label}" without looking at your notes.`,
        hint: "Think about the core purpose or function.",
        xp: 10,
        answer_guide: concept.definition ?? "Review your notes for the definition.",
      },
    ];
  }

  return Response.json({ challenges });
}
