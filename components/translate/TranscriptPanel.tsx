"use client";

import { useRef, useState } from "react";
import { Download, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TranscriptEntry {
  time: string;
  original: string;
  translated: string;
  language: string;
}

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  language: string;
}

function exportPDF(transcript: TranscriptEntry[], language: string) {
  // Dynamic import to avoid SSR issues
  import("jspdf").then(({ default: jsPDF }) => {
    const doc = new jsPDF();
    doc.setFont("helvetica");

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Co-Synapse — Live Translation Transcript", 10, 14);

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Language: ${language}  |  ${new Date().toLocaleDateString()}`, 10, 21);

    // Divider line
    doc.setDrawColor(180);
    doc.line(10, 24, 200, 24);

    let y = 30;
    const PAGE_H = 280;

    for (const entry of transcript) {
      // Original (muted)
      doc.setFontSize(8);
      doc.setTextColor(140);
      const origLines = doc.splitTextToSize(`[${entry.time}] ${entry.original}`, 185);
      if (y + origLines.length * 4 + 12 > PAGE_H) { doc.addPage(); y = 15; }
      doc.text(origLines, 10, y);
      y += origLines.length * 4 + 2;

      // Translated (prominent)
      doc.setFontSize(10);
      doc.setTextColor(20);
      const transLines = doc.splitTextToSize(entry.translated, 185);
      if (y + transLines.length * 5 + 6 > PAGE_H) { doc.addPage(); y = 15; }
      doc.text(transLines, 10, y);
      y += transLines.length * 5 + 6;
    }

    doc.save(`co-synapse-transcript-${Date.now()}.pdf`);
  });
}

type EntryState = "idle" | "loading" | "playing";

export function TranscriptPanel({ transcript, language }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [entryStates, setEntryStates] = useState<Map<number, EntryState>>(new Map());

  async function playEntry(i: number, text: string) {
    setEntryStates((prev) => new Map(prev).set(i, "loading"));
    try {
      console.log(`[TTS] Fetching audio for entry ${i}: "${text}"`);
      const res = await fetch("/api/translate/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[TTS] API error: ${res.status} - ${errText}`);
        setEntryStates((prev) => new Map(prev).set(i, "idle")); 
        return; 
      }
      
      const blob = await res.blob();
      console.log(`[TTS] Received blob: ${blob.size} bytes, type: ${blob.type}`);
      
      if (blob.size === 0) {
        console.error("[TTS] Blob is empty!");
        setEntryStates((prev) => new Map(prev).set(i, "idle"));
        return;
      }
      
      const url = URL.createObjectURL(blob);
      console.log(`[TTS] Created blob URL: ${url}`);
      
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      
      setEntryStates((prev) => new Map(prev).set(i, "playing"));
      
      return new Promise<void>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(url);
          setEntryStates((prev) => new Map(prev).set(i, "idle"));
          audio.removeEventListener("canplay", handleCanPlay);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("error", handleError);
        };
        
        const handleCanPlay = () => {
          console.log("[TTS] Audio ready, starting playback");
          audio.play().catch((err) => {
            console.error("[TTS] play() error:", err);
            cleanup();
            resolve();
          });
        };
        
        const handleEnded = () => {
          console.log("[TTS] Audio playback finished");
          cleanup();
          resolve();
        };
        
        const handleError = (event: Event) => {
          console.error("[TTS] Audio error event:", (event.target as HTMLAudioElement).error);
          cleanup();
          resolve();
        };
        
        audio.addEventListener("canplay", handleCanPlay, { once: true });
        audio.addEventListener("ended", handleEnded, { once: true });
        audio.addEventListener("error", handleError);
        
        console.log("[TTS] Loading audio from blob URL");
        audio.load();
      });
    } catch (error) {
      console.error("[TTS] Fetch/processing error:", error);
      setEntryStates((prev) => new Map(prev).set(i, "idle"));
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {transcript.length === 0 ? (
          <p className="text-xs text-center mt-8" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}>
            Transcript will appear here as you record…
          </p>
        ) : (
          transcript.map((entry, i) => {
            const state = entryStates.get(i) ?? "idle";
            return (
              <div
                key={i}
                className="rounded-lg px-3 py-2 border"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)" }}
              >
                <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}>
                  [{entry.time}] {entry.original}
                </p>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-primary)" }}>
                    {entry.translated}
                  </p>
                  <button
                    onClick={() => playEntry(i, entry.translated)}
                    disabled={state === "loading" || state === "playing"}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: state === "playing" ? "rgba(212,168,67,0.15)" : "var(--bg-secondary)",
                      color: state === "playing" ? "var(--accent-primary)" : "var(--text-tertiary)",
                      border: "1px solid var(--border-default)",
                    }}
                    title={`Play in ${entry.language}`}
                  >
                    {state === "loading" ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Volume2 size={11} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {transcript.length > 0 && (
        <div className="pt-3 border-t mt-3 flex-shrink-0" style={{ borderColor: "var(--border-default)" }}>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-full gap-2 text-xs"
            onClick={() => exportPDF(transcript, language)}
          >
            <Download size={13} /> Export Transcript as PDF
          </Button>
        </div>
      )}
    </div>
  );
}
