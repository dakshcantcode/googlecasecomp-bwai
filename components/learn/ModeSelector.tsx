"use client";

import { motion } from "framer-motion";
import { FileText, CreditCard, BarChart2, Headphones, Zap, Globe } from "lucide-react";

export type LearnMode = "notes" | "audio" | "flashcards" | "focus" | "visual" | "scholar";

interface ModeSelectorProps {
  activeMode: LearnMode;
  onChange: (mode: LearnMode) => void;
}

const TABS: { mode: LearnMode; label: string; Icon: React.ElementType }[] = [
  { mode: "notes",      label: "Notes",      Icon: FileText   },
  { mode: "audio",      label: "Audio",      Icon: Headphones },
  { mode: "flashcards", label: "Flashcards", Icon: CreditCard },
  { mode: "focus",      label: "Focus",      Icon: Zap        },
  { mode: "visual",     label: "Visual",     Icon: BarChart2  },
  { mode: "scholar",    label: "Scholar",    Icon: Globe      },
];

export function ModeSelector({ activeMode, onChange }: ModeSelectorProps) {
  return (
    <div
      className="flex overflow-x-auto border-b mb-6"
      style={{ borderColor: "var(--border-default)" }}
    >
      {TABS.map(({ mode, label, Icon }) => {
        const isActive = activeMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className="relative flex items-center gap-1.5 px-5 py-3 text-sm whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)",
              fontWeight: isActive ? 600 : 400,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon size={14} />
            {label}
            {isActive && (
              <motion.div
                layoutId="mode-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: "var(--accent-primary)" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
