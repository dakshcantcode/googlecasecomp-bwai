import { createClient } from "@/lib/supabase/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { text, fromLanguage, toLanguage } = await request.json();
  if (!text?.trim()) return Response.json({ error: "No text provided" }, { status: 400 });
  if (!toLanguage) return Response.json({ error: "No target language provided" }, { status: 400 });

  // If same language, return as-is
  if (fromLanguage === toLanguage) {
    return Response.json({ translated: text });
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "user",
        content: `Translate the following text from ${fromLanguage ?? "English"} to ${toLanguage}. Return ONLY the translated text with no explanation, no quotes, no preamble:\n\n${text}`,
      },
    ],
  });

  const translated = completion.choices[0].message.content ?? text;
  return Response.json({ translated });
}
