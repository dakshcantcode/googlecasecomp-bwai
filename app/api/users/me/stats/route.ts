import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get all the user's subjects
  const { data: subjects } = await adminSupabase
    .from("subjects")
    .select("id")
    .eq("user_id", user.id);

  const subjectIds = (subjects ?? []).map((s) => s.id);

  // masteryPercent: average mastery across all concepts
  let masteryPercent = 0;
  if (subjectIds.length > 0) {
    const { data: nodes } = await adminSupabase
      .from("concept_nodes")
      .select("mastery_pct")
      .in("subject_id", subjectIds);

    if (nodes && nodes.length > 0) {
      const total = nodes.reduce((sum, n) => sum + (n.mastery_pct ?? 0), 0);
      masteryPercent = Math.round(total / nodes.length);
    }
  }

  // streak: count consecutive days with a completed session
  const { data: sessions } = await adminSupabase
    .from("sessions")
    .select("completed_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  let streak = 0;
  if (sessions && sessions.length > 0) {
    const days = new Set(
      sessions.map((s) => new Date(s.completed_at!).toISOString().split("T")[0])
    );
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (days.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
  }

  // activeErrorPatterns: distinct (concept_id, error_type) combos with ≥3 recent occurrences
  const { data: recentAnswers } = await adminSupabase
    .from("session_answers")
    .select("error_type, sessions!inner(user_id), question_id, questions!inner(concept_id)")
    .filter("sessions.user_id", "eq", user.id)
    .not("error_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  let activeErrorPatterns = 0;
  if (recentAnswers && recentAnswers.length > 0) {
    const counts = new Map<string, number>();
    for (const a of recentAnswers) {
      const conceptId = (a.questions as unknown as { concept_id: string }).concept_id;
      const key = `${conceptId}:${a.error_type}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    activeErrorPatterns = [...counts.values()].filter((c) => c >= 3).length;
  }

  return Response.json({ masteryPercent, activeErrorPatterns, streak });
}
