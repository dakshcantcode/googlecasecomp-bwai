"use client";

import { Badge } from "@/components/ui/badge";
import type { ErrorType } from "@/lib/api";

const ERROR_CONFIG: Record<ErrorType, { label: string; color: string }> = {
  careless: { label: "Careless", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  procedural: { label: "Procedural", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  conceptual: { label: "Conceptual", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  fatigue: { label: "Fatigue", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export default function ErrorChip({ type }: { type: ErrorType }) {
  const cfg = ERROR_CONFIG[type];
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
      {cfg.label} error
    </Badge>
  );
}
