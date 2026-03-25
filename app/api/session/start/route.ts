import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { getOrGenerateQuestions } from "@/lib/questionGenerator";
import { NextRequest } from "next/server";

const OBJECTIVE_TYPES = new Set(["multiple-choice", "numeric", "latex", "multi-step"]);

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { conceptIds, questionCount }: { conceptIds: string[]; questionCount: number } =
    await request.json();

  // Resolve concepts — if none provided, pick concepts due for review
  let resolvedIds = conceptIds.filter(Boolean);
  if (resolvedIds.length === 0) {
    const { data: due } = await adminSupabase
      .from("concept_nodes")
      .select("id, subjects!inner(user_id)")
      .lte("due_date", new Date().toISOString().split("T")[0])
      .limit(10);

    resolvedIds = (due ?? [])
      // @ts-expect-error Supabase join typing
      .filter((n) => n.subjects?.user_id === user.id)
      .map((n: { id: string }) => n.id);
  }

  if (resolvedIds.length === 0) {
    return Response.json({ error: "No concepts available" }, { status: 400 });
  }

  // Fetch concept metadata
  const { data: nodes } = await adminSupabase
    .from("concept_nodes")
    .select("id, label, definition, state, mastery_pct")
    .in("id", resolvedIds);

  if (!nodes || nodes.length === 0) {
    return Response.json({ error: "Concepts not found" }, { status: 404 });
  }

  // If concept is locked, move it to progress so it's playable
  const lockedIds = nodes.filter((n) => n.state === "locked").map((n) => n.id);
  if (lockedIds.length > 0) {
    await adminSupabase
      .from("concept_nodes")
      .update({ state: "progress" })
      .in("id", lockedIds);
  }

  // Generate (or fetch cached) questions for each concept
  const allQuestions = (
    await Promise.all(
      nodes.map((n) => getOrGenerateQuestions(n.id, n.label, n.definition ?? ""))
    )
  ).flat();

  if (allQuestions.length === 0) {
    return Response.json({ error: "Question generation failed" }, { status: 500 });
  }

  // Build a balanced set: objective-first with some subjective variety.
  const objective = shuffle(allQuestions.filter((q) => OBJECTIVE_TYPES.has(q.type)));
  const subjective = shuffle(allQuestions.filter((q) => !OBJECTIVE_TYPES.has(q.type)));

  const targetObjectiveCount = Math.min(
    objective.length,
    Math.max(1, Math.ceil(questionCount * 0.6))
  );

  const selected: typeof allQuestions = [];
  selected.push(...objective.slice(0, targetObjectiveCount));
  selected.push(...subjective.slice(0, Math.max(0, questionCount - selected.length)));

  if (selected.length < questionCount) {
    const usedIds = new Set(selected.map((q) => q.id));
    const remainingObjective = objective.filter((q) => !usedIds.has(q.id));
    const remainingSubjective = subjective.filter((q) => !usedIds.has(q.id));
    const fill = [...remainingObjective, ...remainingSubjective].slice(0, questionCount - selected.length);
    selected.push(...fill);
  }

  const shuffled = shuffle(selected).slice(0, questionCount);

  // Keep the first question responsive/easy-to-submit by preferring objective first.
  if (shuffled.length > 1 && !OBJECTIVE_TYPES.has(shuffled[0].type)) {
    const objectiveIndex = shuffled.findIndex((q) => OBJECTIVE_TYPES.has(q.type));
    if (objectiveIndex > 0) {
      [shuffled[0], shuffled[objectiveIndex]] = [shuffled[objectiveIndex], shuffled[0]];
    }
  }

  // Snapshot mastery before session
  const masterySnapshot: Record<string, number> = {};
  nodes.forEach((n) => { masterySnapshot[n.id] = n.mastery_pct ?? 0; });

  // Create session row
  const { data: session, error: sessionError } = await adminSupabase
    .from("sessions")
    .insert({
      user_id: user.id,
      subject_id: null,
      mastery_snapshot: masterySnapshot,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return Response.json({ error: sessionError?.message ?? "Session creation failed" }, { status: 500 });
  }

  return Response.json({ sessionId: session.id, questions: shuffled });
}
