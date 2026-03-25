"use client";

import { useChatStore } from "@/stores/chatStore";

export function TutorLayoutWrapper({ children }: { children: React.ReactNode }) {
  const isOpen = useChatStore((s) => s.isOpen);

  return (
    <main
      className={`pt-20 ${isOpen ? "md:pr-[380px]" : ""}`}
      style={{ transition: "padding-right 0.3s ease" }}
    >
      {children}
    </main>
  );
}
