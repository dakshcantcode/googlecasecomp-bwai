import { createClient } from "@/lib/supabase/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a Socratic tutor evaluating a student's teachback explanation.

Your job:
1. Assess whether the student has correctly understood the concept
2. Point out any inaccuracies or gaps clearly but kindly
3. Highlight what they got right
4. Keep your response concise (3–5 sentences)

If the explanation is accurate and complete, end your response with: "You have mastered this concept."`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { text, conceptId } = await request.json();
  if (!text || typeof text !== "string") {
    return Response.json({ error: "text required" }, { status: 400 });
  }

  // Fetch concept label for context
  let conceptLabel = "this concept";
  if (conceptId) {
    const { adminSupabase } = await import("@/lib/supabase/admin");
    const { data: concept } = await adminSupabase
      .from("concept_nodes")
      .select("label, definition")
      .eq("id", conceptId)
      .single();
    if (concept) {
      conceptLabel = concept.label;
    }
  }

  const userMessage = `Concept being explained: "${conceptLabel}"

Student's explanation:
${text}`;

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (token) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
