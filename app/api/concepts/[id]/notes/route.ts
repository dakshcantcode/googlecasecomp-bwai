import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 60;

interface NoteSection {
  title: string;
  content: string;
}

interface NotesResponse {
  label: string;
  definition: string;
  sections: NoteSection[];
  mermaid: string;
  prerequisites: string[];
  unlocks: string[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch concept + subject info
  const { data: concept } = await adminSupabase
    .from("concept_nodes")
    .select("id, label, definition, subject_id")
    .eq("id", id)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  // Fetch sibling concepts for context
  const { data: siblings } = await adminSupabase
    .from("concept_nodes")
    .select("id, label")
    .eq("subject_id", concept.subject_id)
    .neq("id", id)
    .limit(20);

  // Fetch prerequisite strands
  const { data: strands } = await adminSupabase
    .from("concept_strands")
    .select("from_id, to_id")
    .eq("subject_id", concept.subject_id);

  const siblingMap = new Map((siblings ?? []).map((s) => [s.id, s.label]));

  const prerequisites = (strands ?? [])
    .filter((s) => s.to_id === id)
    .map((s) => siblingMap.get(s.from_id) ?? "")
    .filter(Boolean);

  const unlocks = (strands ?? [])
    .filter((s) => s.from_id === id)
    .map((s) => siblingMap.get(s.to_id) ?? "")
    .filter(Boolean);

  const siblingNames = (siblings ?? []).map((s) => s.label).slice(0, 10).join(", ");

  const prompt = `You are an expert educational content creator making detailed study notes for a student.

Concept: "${concept.label}"
Definition: "${concept.definition ?? "No definition provided."}"
Part of a subject that also covers: ${siblingNames || "related topics"}
${prerequisites.length > 0 ? `Prerequisites (already studied): ${prerequisites.join(", ")}` : ""}
${unlocks.length > 0 ? `This concept unlocks: ${unlocks.join(", ")}` : ""}

Generate comprehensive study notes AND a Mermaid flowchart diagram.

Return ONLY a valid JSON object with this exact structure (no markdown fences):
{
  "sections": [
    {
      "title": "Overview",
      "content": "3-4 sentences explaining what this concept is in plain language, why it matters, and where it fits in the bigger picture."
    },
    {
      "title": "Core Mechanism",
      "content": "Step-by-step explanation of HOW this concept works. Use numbered steps if applicable."
    },
    {
      "title": "Real-World Example",
      "content": "A concrete, relatable example that shows this concept in action. Walk through it completely."
    },
    {
      "title": "Key Rules & Formulas",
      "content": "Any equations, rules, patterns, or mnemonics to remember. If none apply, explain the key principle to memorize."
    },
    {
      "title": "Common Pitfalls",
      "content": "2-3 mistakes students commonly make with this concept and how to avoid them."
    }
  ],
  "mermaid": "flowchart TD\\n  A[...] --> B[...]\\n  ..."
}

For the Mermaid diagram: create a flowchart showing the INTERNAL LOGIC or PROCESS of the concept — how the idea flows or works step by step. Do NOT show the prerequisite graph. Use short node labels (3-5 words max per node).`;

  let result: { sections: NoteSection[]; mermaid: string } | null = null;

  // Try Gemini first
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const raw = (response.text ?? "").trim().replace(/^```json\s*|^```\s*|```$/gm, "");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.sections)) result = parsed;
  } catch {
    // Gemini failed — try Groq
  }

  if (!result) {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
      if (Array.isArray(parsed.sections)) result = parsed;
    } catch {
      // Both failed — use fallback
    }
  }

  // Fallback if both AI calls failed
  if (!result) {
    result = {
      sections: [
        {
          title: "Overview",
          content: concept.definition ?? `${concept.label} is a key concept in this subject.`,
        },
      ],
      mermaid: `flowchart TD\n  A["${concept.label}"]`,
    };
  }

  const response: NotesResponse = {
    label: concept.label,
    definition: concept.definition ?? "",
    sections: result.sections,
    mermaid: result.mermaid ?? `flowchart TD\n  A["${concept.label}"]`,
    prerequisites,
    unlocks,
  };

  return Response.json(response);
}
