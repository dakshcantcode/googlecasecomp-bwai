"use client";

import { useUserStore } from "@/stores/userStore";
import { Progress } from "@/components/ui/progress";

export default function MetricCards() {
  const { stats } = useUserStore();

  const cards = [
    {
      label: "MASTERY",
      value: `${stats.masteryPercent}%`,
      sub: "across all subjects",
      progress: stats.masteryPercent,
      color: "#4ADE80",
    },
    {
      label: "ACTIVE ERROR PATTERNS",
      value: String(stats.activeErrorPatterns),
      sub: "awaiting targeted drill",
      progress: null,
      color: "var(--accent-primary)",
    },
    {
      label: "STREAK",
      value: `${stats.streak}d`,
      sub: "consecutive study days",
      progress: Math.min(100, (stats.streak / 30) * 100),
      color: "var(--accent-primary)",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg p-6 border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-default)",
          }}
        >
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            {c.label}
          </p>
          <p
            className="text-4xl font-bold mb-1"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: c.color }}
          >
            {c.value}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {c.sub}
          </p>
          {c.progress !== null && (
            <div className="mt-3">
              <Progress value={c.progress} className="h-1" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
