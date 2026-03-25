import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";
import type { ErrorType } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch session (verify ownership)
  const { data: session } = await adminSupabase
    .from("sessions")
    .select("id, user_id, mastery_snapshot")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch answers
  const { data: answers } = await adminSupabase
    .from("session_answers")
    .select("correct, error_type, question_id, questions(concept_id)")
    .eq("session_id", sessionId);

  const rows = answers ?? [];
  const questionCount = rows.length;
  const correctCount = rows.filter((r) => r.correct).length;

  // Error breakdown
  const errorBreakdown: Record<ErrorType, number> = {
    careless: 0, procedural: 0, conceptual: 0, fatigue: 0,
  };
  rows.forEach((r) => {
    if (r.error_type && r.error_type in errorBreakdown) {
      errorBreakdown[r.error_type as ErrorType]++;
    }
  });

  // Collect unique concept IDs answered
  const conceptIds = [
    ...new Set(
      rows
        // @ts-expect-error Supabase join typing
        .map((r) => r.questions?.concept_id)
        .filter(Boolean) as string[]
    ),
  ];

  // masteryBefore from snapshot
  const snapshot = (session.mastery_snapshot ?? {}) as Record<string, number>;

  // masteryAfter from current concept_nodes
  let masteryAfter: Record<string, number> = {};
  if (conceptIds.length > 0) {
    const { data: nodes } = await adminSupabase
      .from("concept_nodes")
      .select("id, mastery_pct")
      .in("id", conceptIds);
    (nodes ?? []).forEach((n) => { masteryAfter[n.id] = n.mastery_pct ?? 0; });
  }

  // Build masteryBefore only for concepts actually answered
  const masteryBefore: Record<string, number> = {};
  conceptIds.forEach((id) => { masteryBefore[id] = snapshot[id] ?? 0; });

  // Next review date: nearest due_date among answered concepts
  let nextReviewDate = "Tomorrow";
  if (conceptIds.length > 0) {
    const { data: dueNodes } = await adminSupabase
      .from("concept_nodes")
      .select("due_date")
      .in("id", conceptIds)
      .order("due_date", { ascending: true })
      .limit(1);

    if (dueNodes && dueNodes[0]) {
      const d = new Date(dueNodes[0].due_date);
      const today = new Date();
      const diffDays = Math.round((d.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
      nextReviewDate = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`;
    }
  }

  // Mark session completed
  await adminSupabase
    .from("sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  return Response.json({
    questionCount,
    correctCount,
    masteryBefore,
    masteryAfter,
    errorBreakdown,
    nextReviewDate,
  });
}
