import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export interface ScholarVocabItem {
  term: string;
  technical_definition: string;
  simple_definition: string;
}

export interface ScholarSection {
  title: string;
  technical: string;
  simple: string;
}

export interface ScholarResponse {
  vocabulary: ScholarVocabItem[];
  sections: ScholarSection[];
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

  const prompt = `For the academic concept "${concept.label}" (definition: ${concept.definition ?? "not available"}), produce two parallel versions of the content — one for international students who need simplified vocabulary and one that is technically precise for exams.

Return a JSON object with:
- "vocabulary": array of 5-8 key terms, each with:
  - "term": the technical term
  - "technical_definition": exam-accurate one-sentence definition using proper academic vocabulary
  - "simple_definition": plain English explanation using everyday analogies, max grade-10 reading level
- "sections": array of 4-5 sections (Overview, Core Mechanism, Real-World Example, Key Rules, Common Pitfalls), each with:
  - "title": section name
  - "technical": 2-4 sentences in academic/technical language, exam-ready
  - "simple": 2-4 sentences in everyday language with analogies, no unexplained jargon

The simple versions must maintain factual accuracy while being accessible.`;

  let result: ScholarResponse = { vocabulary: [], sections: [] };

  try {
    const geminiResult = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    const raw = geminiResult.text ?? "";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.vocabulary)) result.vocabulary = parsed.vocabulary;
    if (Array.isArray(parsed.sections)) result.sections = parsed.sections;
  } catch {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0].message.content ?? "{}";
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.vocabulary)) result.vocabulary = parsed.vocabulary;
      if (Array.isArray(parsed.sections)) result.sections = parsed.sections;
    } catch { /* return empty */ }
  }

  if (result.sections.length === 0) {
    return Response.json({ error: "Could not generate scholar content" }, { status: 500 });
  }

  return Response.json(result);
}
