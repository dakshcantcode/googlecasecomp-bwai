import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

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
    .select("label, definition")
    .eq("id", id)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  const prompt = `You are an educational assistant helping a student understand a concept.

Concept: "${concept.label}"
Definition: "${concept.definition ?? "No definition available."}"

Write a concise 3-4 sentence explanation for a student. Include:
1. What it is in plain language
2. A concrete real-world example
3. Why it matters or how it connects to other ideas

Return ONLY the explanation text — no headers, no bullet points, no markdown.`;

  // Try Gemini first, fall back to Groq
  let summary = "";

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    summary = (response.text ?? "").trim();
  } catch {
    // Gemini failed (quota, network, etc.) — use Groq
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
      });
      summary = (completion.choices[0].message.content ?? "").trim();
    } catch {
      summary = concept.definition ?? "No summary available.";
    }
  }

  return Response.json({ summary, label: concept.label, definition: concept.definition });
}
