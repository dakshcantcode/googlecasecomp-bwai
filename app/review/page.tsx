"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ScrollReveal from "@/components/ui/scroll-reveal";

type Urgency = "optimal" | "due" | "overdue";

interface ReviewItem {
  id: string;
  concept: string;
  subject: string;
  storage: number;
  retrieval: number;
  nextReview: string;
  urgency: Urgency;
}

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string }> = {
  optimal: { label: "Optimal window", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  due: { label: "Due today", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  overdue: { label: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review/queue")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQueue(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const urgentCount = queue.filter((i) => i.urgency !== "optimal").length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <ScrollReveal>
          <div>
            <span className="newspaper-label">REVIEW QUEUE</span>
            <div className="newspaper-rule mt-1 mb-4" />
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
            >
              {loading
                ? "Loading queue…"
                : queue.length === 0
                ? "Nothing due — all caught up!"
                : `${urgentCount} concept${urgentCount !== 1 ? "s" : ""} need attention`}
            </h1>
          </div>
        </ScrollReveal>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border p-5 animate-pulse"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)", height: 112 }}
              />
            ))}
          </div>
        )}

        {/* Queue */}
        {!loading && queue.length > 0 && (
          <div className="space-y-3">
            {queue.map((item, i) => {
              const cfg = URGENCY_CONFIG[item.urgency];
              return (
                <ScrollReveal key={item.id} delay={i * 0.04}>
                  <div
                    className="rounded-lg border p-5"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: item.urgency === "overdue" ? "rgba(248,113,113,0.3)" : "var(--border-default)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3
                            className="font-semibold"
                            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
                          >
                            {item.concept}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                          {item.subject} · {item.nextReview}
                        </p>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-tertiary)" }}>Storage</span>
                            <Progress value={item.storage} className="flex-1 h-1.5" />
                            <span className="text-xs w-8 text-right" style={{ color: "#4ADE80" }}>{item.storage}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-tertiary)" }}>Retrieval</span>
                            <Progress value={item.retrieval} className="flex-1 h-1.5" />
                            <span className="text-xs w-8 text-right" style={{ color: "#60A5FA" }}>{item.retrieval}%</span>
                          </div>
                        </div>
                      </div>

                      <Link href={`/study/review-${item.id}?concept=${item.id}`}>
                        <Button
                          size="sm"
                          className="rounded-full shrink-0"
                          style={{
                            background: item.urgency === "optimal" ? "transparent" : "var(--accent-primary)",
                            color: item.urgency === "optimal" ? "var(--accent-primary)" : "#1A1A1A",
                            border: item.urgency === "optimal" ? "1px solid var(--accent-primary)" : "none",
                          }}
                        >
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
