import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get all subjects for the user
  const { data: subjects } = await adminSupabase
    .from("subjects")
    .select("id, name")
    .eq("user_id", user.id);

  if (!subjects || subjects.length === 0) return Response.json([]);

  const subjectIds = subjects.map((s) => s.id);
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // Tomorrow's date string
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const today = new Date().toISOString().split("T")[0];

  // Fetch concepts due within the next day
  const { data: nodes } = await adminSupabase
    .from("concept_nodes")
    .select("id, subject_id, label, mastery_pct, due_date")
    .in("subject_id", subjectIds)
    .lte("due_date", tomorrowStr);

  if (!nodes || nodes.length === 0) return Response.json([]);

  // For each node, compute storage and retrieval from recent answers
  const nodeIds = nodes.map((n) => n.id);

  // Fetch last 5 session_answers per concept via questions join
  const { data: answers } = await adminSupabase
    .from("session_answers")
    .select("question_id, correct, questions!inner(concept_id)")
    .filter("questions.concept_id", "in", `(${nodeIds.map((id) => `"${id}"`).join(",")})`)
    .order("created_at", { ascending: false })
    .limit(500);

  // Group answers by concept_id
  const answersByConceptId = new Map<string, boolean[]>();
  if (answers) {
    for (const a of answers) {
      const conceptId = (a.questions as unknown as { concept_id: string }).concept_id;
      if (!answersByConceptId.has(conceptId)) {
        answersByConceptId.set(conceptId, []);
      }
      const arr = answersByConceptId.get(conceptId)!;
      if (arr.length < 5) arr.push(a.correct ?? false);
    }
  }

  const queue = nodes.map((node) => {
    const recentAnswers = answersByConceptId.get(node.id) ?? [];
    const retrieval =
      recentAnswers.length > 0
        ? Math.round((recentAnswers.filter(Boolean).length / recentAnswers.length) * 100)
        : 0;

    const dueDate = node.due_date ?? today;
    let urgency: "overdue" | "due" | "optimal";
    let nextReview: string;

    if (dueDate < today) {
      urgency = "overdue";
      nextReview = "Overdue";
    } else if (dueDate === today) {
      urgency = "due";
      nextReview = "Today";
    } else {
      urgency = "optimal";
      nextReview = "Tomorrow";
    }

    return {
      id: node.id,
      concept: node.label,
      subject: subjectMap.get(node.subject_id) ?? "Unknown",
      storage: node.mastery_pct ?? 0,
      retrieval,
      nextReview,
      urgency,
    };
  });

  // Sort: overdue → due → optimal
  const order: Record<string, number> = { overdue: 0, due: 1, optimal: 2 };
  queue.sort((a, b) => order[a.urgency] - order[b.urgency]);

  return Response.json(queue);
}
