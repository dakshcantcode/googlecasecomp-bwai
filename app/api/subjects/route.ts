import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, node_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const subjects = (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    nodeCount: s.node_count ?? 0,
    masteryPercent: 0,
    lastStudied: new Date(s.created_at).toLocaleDateString(),
  }));

  return Response.json(subjects);
}
