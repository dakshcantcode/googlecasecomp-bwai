"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight, ChevronDown, Bot } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import type { ChatMessage } from "@/stores/chatStore";

// ── Individual message variants ────────────────────────────────────────────

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div
      className="px-4 py-3 text-sm"
      style={{
        borderLeft: "2px solid var(--accent-primary)",
        background: "rgba(212,168,67,0.03)",
      }}
    >
      <div className="flex gap-2 items-start">
        <span
          className="text-base flex-shrink-0 mt-0.5 leading-none"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          🕷
        </span>
        <div className="flex-1 min-w-0" style={{ color: "var(--text-secondary)" }}>
          {message.streaming && message.content === "" ? (
            <div className="flex gap-1 items-center py-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "var(--text-tertiary)", animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 mb-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1">{children}</ol>,
                  strong: ({ children }) => (
                    <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code
                      className="px-1 py-0.5 rounded text-xs"
                      style={{ background: "var(--bg-primary)", color: "var(--accent-primary)" }}
                    >
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.streaming && (
                <span className="animate-pulse" style={{ color: "var(--accent-primary)" }}>
                  ▋
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div
      className="px-4 py-3 text-sm"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex justify-end mb-1">
        <span className="newspaper-label text-[9px]" style={{ color: "var(--text-tertiary)" }}>
          YOU
        </span>
      </div>
      <p className="text-right leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {message.content}
      </p>
    </div>
  );
}

function ContextMessage({ message }: { message: ChatMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="mx-3 my-2 rounded-lg overflow-hidden text-xs"
      style={{
        background: "rgba(212,168,67,0.05)",
        border: "1px solid rgba(212,168,67,0.2)",
      }}
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-2 transition-opacity hover:opacity-70"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <Bot size={12} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
        <span className="flex-1 text-left" style={{ color: "var(--text-secondary)" }}>
          Question context injected
        </span>
        <ChevronDown
          size={12}
          style={{
            color: "var(--text-tertiary)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>
      {isExpanded && (
        <div
          className="px-3 pb-3 text-xs leading-relaxed whitespace-pre-wrap break-words"
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            color: "var(--text-tertiary)",
            borderTop: "1px solid rgba(212,168,67,0.15)",
            paddingTop: "8px",
          }}
        >
          {message.content}
        </div>
      )}
    </div>
  );
}

function TutorMessageItem({ message }: { message: ChatMessage }) {
  if (message.type === "context") return <ContextMessage message={message} />;
  if (message.role === "assistant") return <AssistantMessage message={message} />;
  return <UserMessage message={message} />;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function TutorAgentPanel() {
  const { messages, isOpen, isLoading, close, sendMessage, loadHistory } = useChatStore();
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
      style={{
        position: "fixed",
        right: 0,
        top: "56px",
        width: "380px",
        height: "calc(100vh - 56px)",
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-default)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease",
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">🕷</span>
            <span className="newspaper-label text-[10px]">TUTOR</span>
            {isLoading && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#4ADE80", display: "inline-block" }}
              />
            )}
          </div>
          <button
            onClick={close}
            className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-70"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close tutor panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="newspaper-rule" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <p
            className="text-xs text-center mt-10 px-6"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}
          >
            Ask me anything about the material. I&apos;ll adapt to how you learn.
          </p>
        )}
        <div className="space-y-1 py-2">
          {messages.map((msg) => (
            <TutorMessageItem key={msg.id} message={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Terminal-style input */}
      <div
        className="flex-shrink-0 border-t"
        style={{ borderColor: "var(--border-default)", background: "var(--bg-primary)" }}
      >
        <div className="flex items-start gap-2 px-3 py-3">
          <span
            className="text-sm mt-1.5 flex-shrink-0 select-none"
            style={{ color: "var(--accent-primary)", fontFamily: "var(--font-jetbrains), monospace" }}
          >
            ~
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your tutor…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent border-0 outline-none focus:outline-none text-xs leading-relaxed"
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: "13px",
              color: "var(--text-primary)",
              minHeight: "22px",
              maxHeight: "96px",
            }}
          />
        </div>
        <p
          className="px-3 pb-2 text-[10px]"
          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}
        >
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
