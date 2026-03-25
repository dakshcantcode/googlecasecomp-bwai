import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

function sm2(ef: number, interval: number, reps: number, quality: number) {
  if (quality < 3) return { ef, interval: 1, reps: 0 };
  const newEf = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const newInterval =
    reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * ef);
  return { ef: newEf, interval: newInterval, reps: reps + 1 };
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { conceptId, correct } = await request.json();

  const { data: concept } = await adminSupabase
    .from("concept_nodes")
    .select("id, mastery_pct, ease_factor, interval_days, repetitions")
    .eq("id", conceptId)
    .single();

  if (!concept) return Response.json({ error: "Concept not found" }, { status: 404 });

  const quality = correct ? 5 : 0;
  const updated = sm2(
    concept.ease_factor ?? 2.5,
    concept.interval_days ?? 1,
    concept.repetitions ?? 0,
    quality
  );

  const newMastery = Math.min(100, Math.max(0, (concept.mastery_pct ?? 0) + (correct ? 4 : -2)));
  const newState = newMastery >= 85 ? "mastered" : newMastery >= 40 ? "progress" : "locked";
  const nextReviewDate = addDays(updated.interval);

  await adminSupabase
    .from("concept_nodes")
    .update({
      mastery_pct: newMastery,
      state: newState,
      ease_factor: updated.ef,
      interval_days: updated.interval,
      repetitions: updated.reps,
      due_date: nextReviewDate,
    })
    .eq("id", conceptId);

  return Response.json({ nextReviewDate });
}
