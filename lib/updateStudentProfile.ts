import { adminSupabase } from "@/lib/supabase/admin";
import { chatGroqSync } from "@/lib/langchain";
import { PROFILE_UPDATE_PROMPT } from "@/lib/tutor-prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function updateStudentProfile(userId: string): Promise<void> {
  try {
    const [messagesRes, profileRes] = await Promise.all([
      adminSupabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(24),
      adminSupabase
        .from("student_profiles")
        .select("summary, preferences, weak_areas")
        .eq("user_id", userId)
        .single(),
    ]);

    const messages = messagesRes.data;
    if (!messages || messages.length === 0) return;

    const currentProfile = profileRes.data;

    const conversationText = [...messages]
      .reverse()
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const existingProfileText = currentProfile
      ? `\nExisting profile to merge with:\n${JSON.stringify(currentProfile, null, 2)}\n\n`
      : "";

    const result = await chatGroqSync.invoke([
      new SystemMessage(PROFILE_UPDATE_PROMPT),
      new HumanMessage(`${existingProfileText}Conversation to analyse:\n${conversationText}`),
    ]);

    const raw = (result.content as string).trim().replace(/^```json\s*|^```\s*|```$/gm, "");
    const parsed: { summary?: string; preferences?: object; weak_areas?: string[] } = JSON.parse(raw);

    await adminSupabase
      .from("student_profiles")
      .update({
        summary: parsed.summary ?? currentProfile?.summary ?? "",
        preferences: parsed.preferences ?? currentProfile?.preferences ?? {},
        weak_areas: parsed.weak_areas ?? currentProfile?.weak_areas ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } catch {
    // Non-critical — silently swallow errors
  }
}
