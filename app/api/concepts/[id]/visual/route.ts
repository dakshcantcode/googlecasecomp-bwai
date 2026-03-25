import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export interface VisualResponse {
  bar: { title: string; labels: string[]; values: number[]; unit: string } | null;
  radar: { title: string; dimensions: string[]; values: number[] } | null;
  timeline: { title: string; steps: { label: string; desc: string }[] } | null;
  mermaid: string | null;
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

  const prompt = `You are a data visualisation designer creating educational charts.

Concept: "${concept.label}"
Definition: "${concept.definition ?? "Not provided."}"
Subject context: ${siblingNames || "not specified"}

Generate chart data for four visualisations. Return ONLY valid JSON (no markdown fences):
{
  "bar": {
    "title": "Key components of ${concept.label}",
    "labels": ["component1", "component2"],
    "values": [7, 4],
    "unit": "relative importance"
  },
  "radar": {
    "title": "Mastery dimensions for ${concept.label}",
    "dimensions": ["dim1", "dim2", "dim3", "dim4", "dim5"],
    "values": [80, 55, 70, 65, 90]
  },
  "timeline": {
    "title": "Steps in ${concept.label}",
    "steps": [
      { "label": "Step name", "desc": "One sentence description." }
    ]
  },
  "mermaid": "flowchart TD\\n  A[Start] --> B[Step]"
}

Constraints:
- bar: 4-7 labels, values are integers 1-10, NOT all the same, labels.length === values.length
- radar: exactly 5-6 dimensions, values are integers 0-100, varied, dimensions.length === values.length
- timeline: 4-7 steps in logical order
- mermaid: short node labels (max 4 words), flowchart showing the internal logic of the concept`;

  let result: VisualResponse | null = null;

  function validate(parsed: Record<string, unknown>): VisualResponse {
    const bar = parsed.bar as { title: string; labels: string[]; values: number[]; unit: string } | null;
    const radar = parsed.radar as { title: string; dimensions: string[]; values: number[] } | null;
    return {
      bar: bar && Array.isArray(bar.labels) && Array.isArray(bar.values) && bar.labels.length === bar.values.length
        ? bar : null,
      radar: radar && Array.isArray(radar.dimensions) && Array.isArray(radar.values) && radar.dimensions.length === radar.values.length
        ? radar : null,
      timeline: (parsed.timeline as { title: string; steps: { label: string; desc: string }[] } | null) ?? null,
      mermaid: typeof parsed.mermaid === "string" ? parsed.mermaid : null,
    };
  }

  // Try Gemini first
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const raw = (response.text ?? "").trim().replace(/^```json\s*|^```\s*|```$/gm, "");
    const parsed = JSON.parse(raw);
    result = validate(parsed);
  } catch {
    // fall through
  }

  // Try Groq fallback
  if (!result) {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
      result = validate(parsed);
    } catch {
      // fall through
    }
  }

  // Minimal fallback
  if (!result) {
    result = {
      bar: {
        title: `Key aspects of ${concept.label}`,
        labels: ["Definition", "Application", "Examples", "Connections"],
        values: [8, 6, 7, 5],
        unit: "relative importance",
      },
      radar: {
        title: `Mastery dimensions`,
        dimensions: ["Theory", "Practice", "Examples", "Connections", "Recall"],
        values: [70, 50, 60, 55, 65],
      },
      timeline: {
        title: `Understanding ${concept.label}`,
        steps: [
          { label: "Learn definition", desc: concept.definition ?? `What ${concept.label} means.` },
          { label: "See examples", desc: "Connect the concept to concrete cases." },
          { label: "Practice", desc: "Apply the concept to new problems." },
          { label: "Review", desc: "Reinforce with spaced repetition." },
        ],
      },
      mermaid: `flowchart TD\n  A["${concept.label}"] --> B["Understand"] --> C["Apply"] --> D["Master"]`,
    };
  }

  return Response.json(result);
}
