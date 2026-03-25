"use client";

import { useUserStore } from "@/stores/userStore";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DailyBriefing() {
  const { user, stats } = useUserStore();

  return (
    <div
      className="rounded-lg p-8 border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-default)",
      }}
    >
      <p
        className="text-xs tracking-widest uppercase mb-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        DAILY BRIEFING · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      <h1
        className="text-3xl font-bold mb-1"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
      >
        {getGreeting()},{" "}
        <span style={{ color: "var(--accent-primary)" }}>{user?.name ?? "Scholar"}</span>.
      </h1>

      <p
        className="text-base italic mt-2"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-secondary)" }}
      >
        You have retrieved information from memory{" "}
        <strong style={{ color: "var(--text-primary)" }}>
          {stats.streak * 4} times
        </strong>{" "}
        this week. Your streak stands at{" "}
        <strong style={{ color: "var(--accent-primary)" }}>{stats.streak} days</strong>.
      </p>
    </div>
  );
}
