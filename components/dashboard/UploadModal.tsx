"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  "Parsing document structure",
  "Extracting key concepts",
  "Building concept graph",
  "Generating study sessions",
];

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const [phase, setPhase] = useState<"drop" | "processing" | "done">("drop");
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startProcessing(name: string) {
    setFileName(name);
    setPhase("processing");
    setStep(0);

    let s = 0;
    const iv = setInterval(() => {
      s++;
      if (s >= STEPS.length) {
        clearInterval(iv);
        setStep(STEPS.length);
        setTimeout(() => setPhase("done"), 600);
      } else {
        setStep(s);
      }
    }, 900);
  }

  function handleFile(file: File) {
    startProcessing(file.name);
  }

  function reset() {
    setPhase("drop");
    setStep(0);
    setFileName("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && reset()}>
      <DialogContent className="max-w-md" style={{ background: "var(--bg-secondary)" }}>
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
          >
            Upload Study Material
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === "drop" && (
            <motion.div
              key="drop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: dragOver ? "var(--accent-primary)" : "var(--border-default)",
                  background: dragOver ? "rgba(212,168,67,0.06)" : "transparent",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <p className="text-3xl mb-3">📄</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                  Drop your PDF or notes here
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                  or click to browse
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md,.docx"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <p className="text-sm mb-6 truncate" style={{ color: "var(--text-secondary)" }}>
                Processing: <strong>{fileName}</strong>
              </p>

              <Progress value={(step / STEPS.length) * 100} className="mb-6" />

              <div className="space-y-3">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background:
                          i < step ? "var(--accent-primary)" : i === step ? "rgba(212,168,67,0.3)" : "var(--bg-primary)",
                        color: i < step ? "#1A1A1A" : "var(--text-tertiary)",
                        border: "1px solid",
                        borderColor: i <= step ? "var(--accent-primary)" : "var(--border-default)",
                      }}
                    >
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: i <= step ? "var(--text-primary)" : "var(--text-tertiary)" }}
                    >
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-6 text-center"
            >
              <div className="text-4xl mb-4">🕸</div>
              <p
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
              >
                Your web is ready.
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                12 concepts extracted and linked.
              </p>
              <Button
                onClick={reset}
                className="rounded-full px-6"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
              >
                Open Concept Web
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
