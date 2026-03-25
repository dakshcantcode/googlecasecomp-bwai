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
import { useUserStore } from "@/stores/userStore";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const router = useRouter();
  const { refreshSubjects } = useUserStore();

  const [phase, setPhase] = useState<"drop" | "processing" | "done" | "error">("drop");
  const [fileName, setFileName] = useState("");
  const [nodeCount, setNodeCount] = useState(0);
  const [subjectId, setSubjectId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setPhase("processing");

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
      setNodeCount(data.nodeCount);
      setSubjectId(data.subjectId);
      await refreshSubjects();
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("drop");
    setFileName("");
    setNodeCount(0);
    setSubjectId("");
    setErrorMsg("");
    onClose();
  }

  function openWeb() {
    reset();
    router.push(`/web/${subjectId}`);
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
                  accept=".pdf,.txt,.md"
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
              className="py-8 text-center"
            >
              <div className="flex justify-center mb-4">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
                />
              </div>
              <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                Extracting concepts from <strong>{fileName}</strong>…
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                This may take up to 30 seconds
              </p>
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
                {nodeCount} concept{nodeCount !== 1 ? "s" : ""} extracted and linked.
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
              <p className="text-sm mb-4 text-red-500">{errorMsg}</p>
              <Button
                variant="outline"
                onClick={reset}
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
