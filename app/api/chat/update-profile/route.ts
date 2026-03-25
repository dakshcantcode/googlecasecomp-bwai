import { updateStudentProfile } from "@/lib/updateStudentProfile";
import { NextRequest } from "next/server";

// Internal endpoint — called by /api/chat/stream, not directly by clients
export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId: string = body.userId ?? "";
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  await updateStudentProfile(userId);
  return Response.json({ ok: true });
}
