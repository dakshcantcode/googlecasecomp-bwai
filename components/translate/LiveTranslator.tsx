"use client";

import { useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TranscriptPanel, type TranscriptEntry } from "./TranscriptPanel";

interface LiveTranslatorProps {
  language: string;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveTranslator({ language }: LiveTranslatorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  async function processChunk(chunks: Blob[]) {
    if (chunks.length === 0) return;
    setIsProcessing(true);
    const blob = new Blob(chunks, { type: "audio/webm" });
    const elapsed = Date.now() - startTimeRef.current;

    try {
      // 1. STT via ElevenLabs
      const sttForm = new FormData();
      sttForm.append("audio", blob, "chunk.webm");
      const sttRes = await fetch("/api/translate/stt", { method: "POST", body: sttForm });
      const { text } = await sttRes.json();
      if (!text?.trim()) return;

      // 2. Translate via Groq
      let translated = text;
      if (language !== "English") {
        const transRes = await fetch("/api/translate/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, fromLanguage: "English", toLanguage: language }),
        });
        const transData = await transRes.json();
        translated = transData.translated ?? text;
      }

      // 3. Append to transcript
      const entry: TranscriptEntry = {
        time: formatTime(elapsed),
        original: text,
        translated,
        language,
      };
      setTranscript((prev) => [...prev, entry]);
    } catch {
      // Silently skip failed chunks
    } finally {
      setIsProcessing(false);
    }
  }

  function startChunkCycle(stream: MediaStream) {
    function startRecorder() {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const chunks = [...chunksRef.current];
        chunksRef.current = [];
        processChunk(chunks);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    }

    startRecorder();
    // Every 8 seconds: stop current recorder (triggers onstop → processChunk) and start a new one
    intervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      startRecorder();
    }, 8000);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startTimeRef.current = Date.now();
      startChunkCycle(stream);
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🎙</span>
          <span className="newspaper-label text-[10px]">LISTEN &amp; TRANSLATE</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Record your professor&apos;s lecture. Each 8-second chunk is transcribed and spoken in {language}.
        </p>
      </div>

      {/* Record button */}
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isRecording ? "#F87171" : "var(--accent-primary)",
            color: "#1A1A1A",
            boxShadow: isRecording ? "0 0 0 6px rgba(248,113,113,0.25)" : "none",
          }}
        >
          {isRecording && (
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(248,113,113,0.35)" }} />
          )}
          {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {isRecording ? "Recording…" : "Tap to start"}
          </p>
          {isProcessing && (
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
              <Loader2 size={10} className="animate-spin" /> Translating chunk…
            </p>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 min-h-0">
        <TranscriptPanel transcript={transcript} language={language} />
      </div>

      {isRecording && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          style={{ borderColor: "#F87171", color: "#F87171" }}
          onClick={stopRecording}
        >
          Stop Recording
        </Button>
      )}
    </div>
  );
}
