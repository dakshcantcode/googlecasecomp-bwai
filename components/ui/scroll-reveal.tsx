/**
 * ScrollReveal — Scroll-triggered entrance wrapper
 * Ported as-is from NeuroSketch components/ui/scroll-reveal.tsx
 */

"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  margin?: string;
  direction?: "up" | "left";
}

const upVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const leftVariants: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0 },
};

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  margin = "-60px",
  direction = "up",
}: ScrollRevealProps) {
  return (
    <motion.div
      variants={direction === "left" ? leftVariants : upVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
