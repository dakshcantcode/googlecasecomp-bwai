"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ZeigarnikBarProps {
  total: number;
  completed: number;
  visible: boolean; // true after first answer submitted
}

export default function ZeigarnikBar({ total, completed, visible }: ZeigarnikBarProps) {
  const allDone = completed >= total;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="flex items-center gap-3 rounded-full px-5 py-2.5 shadow-lg"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
          >
            {allDone ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm font-semibold"
                style={{ color: "var(--accent-primary)" }}
              >
                Session complete!
              </motion.span>
            ) : (
              <>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Progress</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: total }, (_, i) => (
                    <motion.div
                      key={i}
                      initial={i < completed ? false : { scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: i < completed ? "var(--accent-primary)" : "transparent",
                        border: `1.5px solid ${i < completed ? "var(--accent-primary)" : "var(--border-default)"}`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {completed}/{total}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
