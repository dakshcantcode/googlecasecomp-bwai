import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ELEVENLABS_API_KEY) {
    return Response.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  // Fetch concept
  const { data: concept } = await adminSupabase
    .from("concept_nodes")
    .select("id, label, definition, subject_id")
    .eq("id", id)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  // Fetch notes from API (internal call to notes generation)
  const notesRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/concepts/${id}/notes`,
    { headers: { Cookie: _req.headers.get("cookie") ?? "" } }
  );

  let spokenText = `Today we are learning about ${concept.label}. `;
  if (concept.definition) spokenText += `${concept.definition}. `;

  if (notesRes.ok) {
    const notes = await notesRes.json();
    if (Array.isArray(notes.sections)) {
      for (const section of notes.sections) {
        // Strip markdown syntax for cleaner TTS
        const clean = (section.content as string)
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/#+\s/g, "")
          .replace(/`/g, "")
          .trim();
        spokenText += `${section.title}. ${clean} `;
      }
    }
  } else {
    spokenText += "Please review your notes for more details on this concept.";
  }

  // Trim to ElevenLabs limit (~5000 chars for monolingual model)
  spokenText = spokenText.slice(0, 4800);

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: spokenText,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    return Response.json({ error: `TTS failed: ${err}` }, { status: 500 });
  }

  return new Response(ttsRes.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
