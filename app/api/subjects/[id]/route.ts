import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Verify subject belongs to user (user client respects RLS)
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (subjectError || !subject) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Use adminSupabase to bypass RLS — concept_nodes/strands have no user read policy
  const { data: nodes, error: nodesError } = await adminSupabase
    .from("concept_nodes")
    .select("id, label, definition, state, mastery_pct")
    .eq("subject_id", id);
  if (nodesError) return Response.json({ error: nodesError.message }, { status: 500 });

  const { data: strands, error: strandsError } = await adminSupabase
    .from("concept_strands")
    .select("from_id, to_id")
    .eq("subject_id", id);
  if (strandsError) return Response.json({ error: strandsError.message }, { status: 500 });

  const graph = {
    name: subject.name,
    nodes: (nodes ?? []).map((n) => ({
      id: n.id,
      label: n.label,
      state: n.state ?? "locked",
      masteryPercent: n.mastery_pct ?? 0,
      lastReviewed: "never",
      errorCount: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    })),
    strands: (strands ?? []).map((s) => ({
      from: s.from_id,
      to: s.to_id,
    })),
  };

  return Response.json(graph);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await adminSupabase
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
