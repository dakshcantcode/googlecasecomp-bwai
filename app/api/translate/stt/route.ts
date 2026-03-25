import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ELEVENLABS_API_KEY) {
    return Response.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  if (!audioFile) return Response.json({ error: "No audio file provided" }, { status: 400 });

  const elForm = new FormData();
  elForm.append("file", audioFile, audioFile.name || "recording.webm");
  elForm.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    body: elForm,
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `ElevenLabs STT failed: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  return Response.json({ text: data.text ?? "" });
}
