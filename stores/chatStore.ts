"use client";

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  type?: "user" | "assistant" | "context";
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openWithContext: (contextText: string) => void;
  loadHistory: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  startNewChat: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  clearMessages: () => set({ messages: [] }),
  startNewChat: async () => {
    set({ messages: [] });
    try {
      await fetch("/api/chat/history", { method: "DELETE" });
    } catch {
      // If server clear fails, we still keep local chat cleared for a fresh start
    }
  },
  openWithContext: (contextText: string) =>
    set((s) => ({
      isOpen: true,
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role: "user", content: contextText, type: "context" },
      ],
    })),

  loadHistory: async () => {
    try {
      const res = await fetch("/api/chat/history");
      if (!res.ok) return;
      const history: ChatMessage[] = await res.json();
      set({ messages: history });
    } catch {
      // Silently fail — UI still works without history
    }
  },

  sendMessage: async (text: string) => {
    if (get().isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const placeholder: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };

    set((s) => ({ messages: [...s.messages, userMsg, placeholder], isLoading: true }));

    const placeholderId = placeholder.id;

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { token } = JSON.parse(payload);
            set((s) => ({
              messages: s.messages.map((m) =>
                m.id === placeholderId ? { ...m, content: m.content + token } : m
              ),
            }));
          } catch { /* ignore malformed SSE */ }
        }
      }

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === placeholderId ? { ...m, streaming: false } : m
        ),
        isLoading: false,
      }));
    } catch {
      // Remove placeholder on error
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== placeholderId),
        isLoading: false,
      }));
    }
  },
}));
