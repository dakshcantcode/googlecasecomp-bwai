"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "./ChatBubble";
import { useChatStore } from "@/stores/chatStore";

interface ChatPanelProps {
  onClose?: () => void;
  fullPage?: boolean;
}

export function ChatPanel({ onClose, fullPage = false }: ChatPanelProps) {
  const { messages, isLoading, sendMessage, loadHistory } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyLoaded = useRef(false);

  useEffect(() => {
    if (!historyLoaded.current) {
      historyLoaded.current = true;
      loadHistory();
    }
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: fullPage ? "calc(100vh - 96px)" : "520px",
        background: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div>
          <p className="newspaper-label text-[10px]">AI TUTOR</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Ask me anything
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close chat"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-tertiary)" }}>
            Your tutor is ready. Ask about any concept, get help with a problem, or explain something back to me.
          </p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your tutor…"
            rows={1}
            className="resize-none flex-1 min-h-[38px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
            aria-label="Send message"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
