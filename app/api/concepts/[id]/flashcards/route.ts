import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardsResponse {
  cards: Flashcard[];
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
    .select("id, label, definition, subject_id")
    .eq("id", id)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  const { data: siblings } = await adminSupabase
    .from("concept_nodes")
    .select("label")
    .eq("subject_id", concept.subject_id)
    .neq("id", id)
    .limit(10);

  const siblingNames = (siblings ?? []).map((s) => s.label).join(", ");

  const prompt = `You are an expert flashcard author creating spaced-repetition cards for a student.

Concept: "${concept.label}"
Definition: "${concept.definition ?? "Not provided."}"
Subject context (related topics): ${siblingNames || "not specified"}

Generate exactly 10 flashcards. Each card must address ONE of these angles:
1. Core definition (what is it?)
2. Mechanism / how it works
3. A concrete worked example
4. A second worked example from a different domain
5. Edge case or boundary condition
6. Common misconception (front asks "What is wrong with this thinking: …?")
7. Formula or rule to memorise
8. Comparison to a related concept
9. Real-world application
10. Quick recall ("Without looking, state the key principle of…")

Return ONLY valid JSON (no markdown fences):
{
  "cards": [
    { "front": "...", "back": "..." }
  ]
}

Rules:
- front: a question or term, max 15 words
- back: answer plus one concrete example, max 60 words
- Do NOT number the cards inside the JSON strings`;

  let cards: Flashcard[] | null = null;

  // Try Gemini first
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const raw = (response.text ?? "").trim().replace(/^```json\s*|^```\s*|```$/gm, "");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.cards) && parsed.cards.length >= 3) {
      cards = parsed.cards;
    }
  } catch {
    // fall through to Groq
  }

  // Try Groq fallback
  if (!cards) {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
      if (Array.isArray(parsed.cards) && parsed.cards.length >= 3) {
        cards = parsed.cards;
      }
    } catch {
      // fall through to fallback
    }
  }

  // Minimal fallback
  if (!cards) {
    cards = [
      {
        front: `What is ${concept.label}?`,
        back: concept.definition ?? `${concept.label} is a key concept in this subject.`,
      },
      {
        front: `Why is ${concept.label} important?`,
        back: `Understanding ${concept.label} is foundational for mastering ${siblingNames.split(",")[0] || "related topics"}.`,
      },
    ];
  }

  return Response.json({ cards } as FlashcardsResponse);
}
