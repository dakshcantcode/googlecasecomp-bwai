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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [subjectName, setSubjectName] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
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
    if (!subjectName.trim()) {
      setSubjectName(file.name.replace(/\.[^/.]+$/, ""));
    }
    startProcessing(file.name);
  }

  function handleTextSubmit() {
    if (!pastedText.trim()) return;
    const name = subjectName.trim() || "Pasted content";
    startProcessing(name);
  }

  function reset() {
    setPhase("drop");
    setStep(0);
    setFileName("");
    setSubjectName("");
    setPastedText("");
    setInputMode("file");
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
              className="space-y-4"
            >
              {/* Subject name */}
              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
                  Subject name
                </Label>
                <Input
                  placeholder="e.g. Calculus, Organic Chemistry, EU Law…"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
                {(["file", "text"] as const).map((mode) => (
                  <button
                    key={mode}
                    className="flex-1 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: inputMode === mode ? "var(--accent-primary)" : "var(--bg-primary)",
                      color: inputMode === mode ? "#1A1A1A" : "var(--text-secondary)",
                    }}
                    onClick={() => setInputMode(mode)}
                  >
                    {mode === "file" ? "Upload PDF / File" : "Paste Notes"}
                  </button>
                ))}
              </div>

              {inputMode === "file" ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
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
                  <p className="text-3xl mb-2">📄</p>
                  <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    Drop your PDF or notes here
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    PDF, TXT, MD, DOCX — or click to browse
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.docx"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Paste your lecture notes, textbook section, or any text here…"
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)", color: "var(--text-primary)", resize: "none" }}
                  />
                  <Button
                    className="w-full rounded-full"
                    style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
                    disabled={!pastedText.trim()}
                    onClick={handleTextSubmit}
                  >
                    Build my web
                  </Button>
                </div>
              )}
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
              <div className="flex items-center gap-3 mb-6">
                {/* CSS spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
                />
                <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  Processing <strong style={{ color: "var(--text-primary)" }}>{fileName}</strong>
                </p>
              </div>

              <div className="space-y-3">
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300"
                      style={{
                        background:
                          i < step
                            ? "var(--accent-primary)"
                            : i === step
                            ? "rgba(212,168,67,0.25)"
                            : "var(--bg-primary)",
                        color: i < step ? "#1A1A1A" : "var(--text-tertiary)",
                        border: "1px solid",
                        borderColor: i <= step ? "var(--accent-primary)" : "var(--border-default)",
                      }}
                    >
                      {i < step ? "✓" : i === step ? (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          ·
                        </motion.span>
                      ) : String(i + 1)}
                    </div>
                    <span
                      className="text-sm transition-colors duration-300"
                      style={{ color: i <= step ? "var(--text-primary)" : "var(--text-tertiary)" }}
                    >
                      {s}
                      {i === step && (
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          style={{ color: "var(--accent-primary)" }}
                        >
                          {" "}…
                        </motion.span>
                      )}
                    </span>
                  </motion.div>
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
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--text-primary)" }}
              >
                {subjectName || "Your web"} is ready.
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                12 concepts extracted and linked into your knowledge graph.
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
