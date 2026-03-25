"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { useUserStore } from "@/stores/userStore";

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
  const router = useRouter();
  const { refreshSubjects } = useUserStore();

  const [phase, setPhase] = useState<"drop" | "processing" | "done" | "error">("drop");
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [nodeCount, setNodeCount] = useState(0);
  const [subjectId, setSubjectId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [errorMsg, setErrorMsg] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  function startStepTicker() {
    setStep(0);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    stepIntervalRef.current = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 900);
  }

  function stopStepTicker() {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  }

  async function uploadContent(file: File) {
    setFileName(file.name);
    setErrorMsg("");
    setPhase("processing");
    startStepTicker();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/subjects/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Upload failed");
        setPhase("error");
        return;
      }

      setNodeCount(data.nodeCount ?? 0);
      setSubjectId(data.subjectId ?? "");
      await refreshSubjects();
      setStep(STEPS.length);
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    } finally {
      stopStepTicker();
    }
  }

  function handleFile(file: File) {
    const baseName = subjectName.trim() || file.name.replace(/\.[^/.]+$/, "");
    if (!subjectName.trim()) setSubjectName(baseName);

    const ext = file.name.match(/\.[^/.]+$/)?.[0] ?? "";
    const normalizedName = `${baseName}${ext}`;
    const preparedFile =
      file.name === normalizedName
        ? file
        : new File([file], normalizedName, {
            type: file.type || "application/octet-stream",
          });

    uploadContent(preparedFile);
  }

  function handleTextSubmit() {
    if (!pastedText.trim()) return;
    const baseName = subjectName.trim() || "pasted-notes";
    if (!subjectName.trim()) setSubjectName(baseName);

    const textFile = new File([pastedText], `${baseName}.txt`, {
      type: "text/plain",
    });

    uploadContent(textFile);
  }

  function reset() {
    stopStepTicker();
    setPhase("drop");
    setStep(0);
    setFileName("");
    setNodeCount(0);
    setSubjectId("");
    setDragOver(false);
    setSubjectName("");
    setPastedText("");
    setInputMode("file");
    setErrorMsg("");
    onClose();
  }

  function openWeb() {
    const nextSubjectId = subjectId;
    reset();
    if (nextSubjectId) {
      router.push(`/web/${nextSubjectId}`);
    } else {
      router.push("/web");
    }
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
              <div>
                <Label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
                  Subject name
                </Label>
                <Input
                  placeholder="e.g. Calculus, Organic Chemistry, EU Law..."
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

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
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
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
                    PDF, TXT, MD, DOCX - or click to browse
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Paste your lecture notes, textbook section, or any text here..."
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
                          .
                        </motion.span>
                      ) : String(i + 1)}
                    </div>
                    <span
                      className="text-sm transition-colors duration-300"
                      style={{ color: i <= step ? "var(--text-primary)" : "var(--text-tertiary)" }}
                    >
                      {s}
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
                {nodeCount} concept{nodeCount !== 1 ? "s" : ""} extracted and linked into your knowledge graph.
              </p>
              <Button
                onClick={openWeb}
                className="rounded-full px-6"
                style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
              >
                Open Concept Web
              </Button>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-6 text-center"
            >
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-sm mb-4 text-red-500">{errorMsg || "Upload failed"}</p>
              <Button
                variant="outline"
                onClick={() => setPhase("drop")}
                className="rounded-full"
                style={{ borderColor: "var(--border-default)" }}
              >
                Try again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
