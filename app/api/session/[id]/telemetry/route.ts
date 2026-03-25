import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { state, metrics, timestamp } = await request.json();

  await adminSupabase.from("telemetry").insert({
    session_id: sessionId,
    mental_state: state,
    metrics_json: metrics,
    recorded_at: new Date(timestamp ?? Date.now()).toISOString(),
  });

  // Read last 3 telemetry rows for this session to detect patterns
  const { data: recent } = await adminSupabase
    .from("telemetry")
    .select("mental_state")
    .eq("session_id", sessionId)
    .order("recorded_at", { ascending: false })
    .limit(3);

  let interventionType: string | null = null;

  if (recent && recent.length >= 2) {
    const states = recent.map((r) => r.mental_state);
    const allOverwhelmed = states.every((s) => s === "overwhelmed");
    const twoConfused = states.slice(0, 2).every((s) => s === "confused");
    const twoDistracted = states.slice(0, 2).every((s) => s === "distracted");

    if (allOverwhelmed && states.length >= 3) interventionType = "break";
    else if (twoConfused) interventionType = "simplify";
    else if (twoDistracted) interventionType = "encourage";
  }

  return Response.json({ interventionType });
}
