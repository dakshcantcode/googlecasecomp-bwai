import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { getOrGenerateQuestions } from "@/lib/questionGenerator";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { conceptId } = await request.json();
  if (!conceptId) return Response.json({ error: "conceptId required" }, { status: 400 });

  // Verify concept belongs to user (via subject ownership)
  const { data: node } = await adminSupabase
    .from("concept_nodes")
    .select("id, label, definition, subjects!inner(user_id)")
    .eq("id", conceptId)
    .single();

  if (!node) return Response.json({ error: "Not found" }, { status: 404 });
  // @ts-expect-error Supabase join typing
  if (node.subjects?.user_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const questions = await getOrGenerateQuestions(
    conceptId,
    node.label,
    node.definition ?? ""
  );

  return Response.json(questions);
}
