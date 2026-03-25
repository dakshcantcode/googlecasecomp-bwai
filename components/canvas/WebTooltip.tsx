/**
 * WebTooltip — Gold newspaper-themed tooltip for spider web nodes
 * Ported from NeuroSketch FactOverlay.tsx
 * Changes: cyan → gold, Parkinson's facts → Co-Synapse feature descriptions
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface WebFactData {
  title: string;
  body: string;
}

interface WebTooltipProps {
  activeNodeId: number | null;
  visible: boolean;
  positions: { x: number; y: number }[];
  facts: WebFactData[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function WebTooltip({
  activeNodeId,
  visible,
  positions,
  facts,
  onMouseEnter,
  onMouseLeave,
}: WebTooltipProps) {
  const isActive = visible && activeNodeId !== null;
  const pos = isActive && activeNodeId !== null ? positions[activeNodeId] : null;
  const fact = isActive && activeNodeId !== null ? facts[activeNodeId] : null;

  return (
    <AnimatePresence mode="wait">
      {isActive && pos && fact && (
        <motion.div
          key={activeNodeId}
          initial={{ opacity: 0, y: 22, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute z-40 pointer-events-auto"
          style={{
            left: pos.x,
            top: pos.y,
            transform: "translate(-50%, -110%)",
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className="relative max-w-[260px] w-max px-4 py-3 backdrop-blur-md"
            style={{
              background: "rgba(250, 250, 245, 0.92)",
              border: "1px solid rgba(212, 168, 67, 0.4)",
              boxShadow: "0 0 20px rgba(212, 168, 67, 0.15), 0 8px 32px rgba(0,0,0,0.15)",
              borderRadius: "4px",
            }}
          >
            {/* Caret */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
              style={{
                background: "rgba(250, 250, 245, 0.92)",
                borderBottom: "1px solid rgba(212, 168, 67, 0.4)",
                borderRight: "1px solid rgba(212, 168, 67, 0.4)",
              }}
            />
            {/* Gold left border accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l"
              style={{ background: "#D4A843" }}
            />
            <h3
              className="text-xs font-semibold mb-1 pl-2"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#D4A843",
                letterSpacing: "0.02em",
              }}
            >
              {fact.title}
            </h3>
            <p className="text-xs leading-relaxed pl-2" style={{ color: "#1A1A1A" }}>
              {fact.body}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
