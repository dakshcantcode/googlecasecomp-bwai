"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";

export default function ChatPage() {
  const router = useRouter();
  const open = useChatStore((s) => s.open);

  useEffect(() => {
    open();
    router.replace("/dashboard");
  }, [open, router]);

  return null;
}
