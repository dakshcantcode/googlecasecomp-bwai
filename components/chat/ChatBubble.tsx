"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/stores/chatStore";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
        style={{
          background: isUser ? "var(--accent-primary)" : "var(--bg-secondary)",
          color: isUser ? "#1A1A1A" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--border-default)",
        }}
      >
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 mb-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1">{children}</ol>,
              strong: ({ children }) => (
                <strong style={{ color: isUser ? "#1A1A1A" : "var(--text-primary)", fontWeight: 600 }}>
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code
                  className="px-1 py-0.5 rounded text-xs"
                  style={{
                    background: isUser ? "rgba(0,0,0,0.15)" : "var(--bg-primary)",
                    color: isUser ? "#1A1A1A" : "var(--accent-primary)",
                  }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
