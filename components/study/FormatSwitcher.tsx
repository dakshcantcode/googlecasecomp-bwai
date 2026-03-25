"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FormatMode } from "@/hooks/useFormatCascade";

const FORMAT_LABELS: Record<FormatMode, string> = {
  "default": "Standard",
  "worked-example": "Worked Example",
  "simplified": "Plain Language",
  "detailed": "Detailed Derivation",
  "audio": "Audio Walkthrough",
  "simulation": "Simulation",
  "youtube": "Video Clip",
};

interface FormatSwitcherProps {
  mode: FormatMode;
  children: React.ReactNode;
}

export default function FormatSwitcher({ mode, children }: FormatSwitcherProps) {
  return (
    <div>
      {mode !== "default" && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Switched to:</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              background: "rgba(212,168,67,0.12)",
              color: "var(--accent-primary)",
              borderBottom: "2px solid var(--accent-primary)",
            }}
          >
            {FORMAT_LABELS[mode]}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
