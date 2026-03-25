import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ELEVENLABS_API_KEY) {
    return Response.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  const { text } = await request.json();
  if (!text?.trim()) return Response.json({ error: "No text provided" }, { status: 400 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `ElevenLabs TTS failed: ${err}` }, { status: 500 });
  }

  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
