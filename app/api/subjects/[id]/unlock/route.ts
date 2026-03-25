import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: subjectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", subjectId)
    .eq("user_id", user.id)
    .single();
  if (!subject) return Response.json({ error: "Not found" }, { status: 404 });

  // Fetch all nodes and strands for this subject
  const { data: nodes } = await adminSupabase
    .from("concept_nodes")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("state", "locked");

  const { data: strands } = await adminSupabase
    .from("concept_strands")
    .select("to_id")
    .eq("subject_id", subjectId);

  if (!nodes || nodes.length === 0) {
    return Response.json({ unlockedCount: 0 });
  }

  // Root nodes = nodes with no incoming strands (no prerequisites)
  const hasPrerequisite = new Set((strands ?? []).map((s) => s.to_id));
  const rootIds = nodes
    .filter((n) => !hasPrerequisite.has(n.id))
    .map((n) => n.id);

  if (rootIds.length === 0) {
    // No root nodes found — unlock all locked nodes so the user can start
    const allLockedIds = nodes.map((n) => n.id);
    await adminSupabase
      .from("concept_nodes")
      .update({ state: "progress" })
      .in("id", allLockedIds);
    return Response.json({ unlockedCount: allLockedIds.length });
  }

  await adminSupabase
    .from("concept_nodes")
    .update({ state: "progress" })
    .in("id", rootIds);

  return Response.json({ unlockedCount: rootIds.length });
}
