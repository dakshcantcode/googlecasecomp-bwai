import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { chatGroq } from "@/lib/langchain";
import { buildTutorSystemPrompt } from "@/lib/tutor-prompts";
import { updateStudentProfile } from "@/lib/updateStudentProfile";
import { NextRequest } from "next/server";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export const maxDuration = 120;

const HISTORY_WINDOW = 20;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const message: string = body.message ?? "";
  if (!message.trim()) return Response.json({ error: "message required" }, { status: 400 });

  // Ensure student_profiles row exists (upsert on first message)
  await adminSupabase
    .from("student_profiles")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  const [profileRes, historyRes] = await Promise.all([
    adminSupabase
      .from("student_profiles")
      .select("summary, preferences, weak_areas, message_count")
      .eq("user_id", user.id)
      .single(),
    adminSupabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_WINDOW),
  ]);

  const profile = profileRes.data ?? { summary: "", preferences: {}, weak_areas: [], message_count: 0 };
  const history = (historyRes.data ?? []).reverse();

  // Persist user message immediately
  await adminSupabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: message });

  // Build LangChain message array
  const systemPrompt = buildTutorSystemPrompt({
    summary: profile.summary,
    preferences: profile.preferences as Record<string, unknown>,
    weak_areas: profile.weak_areas,
  });

  const langchainMessages = [
    new SystemMessage(systemPrompt),
    ...history.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
    new HumanMessage(message),
  ];

  const stream = await chatGroq.stream(langchainMessages);

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = String(chunk.content ?? "");
          if (token) {
            fullResponse += token;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();

        // Persist assistant reply + increment count (fire-and-forget)
        Promise.resolve(
          adminSupabase.from("chat_messages")
            .insert({ user_id: user.id, role: "assistant", content: fullResponse })
        ).then(async () => {
          const newCount = (profile.message_count ?? 0) + 1;
          await adminSupabase
            .from("student_profiles")
            .update({ message_count: newCount })
            .eq("user_id", user.id);

          if (newCount % 8 === 0) {
            void updateStudentProfile(user.id);
          }
        }).catch(() => {});
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
