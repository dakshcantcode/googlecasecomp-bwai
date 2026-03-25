"use client";

import { useRef, useState } from "react";
import { Mic, MicOff, Volume2, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QuestionTranslatorProps {
  language: string;
}

export function QuestionTranslator({ language }: QuestionTranslatorProps) {
  const [questionText, setQuestionText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startMicRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);

        // STT: transcribe native language voice
        const form = new FormData();
        form.append("audio", blob, "question.webm");
        setIsTranslating(true);
        try {
          const sttRes = await fetch("/api/translate/stt", { method: "POST", body: form });
          const { text } = await sttRes.json();
          if (text?.trim()) setQuestionText(text.trim());
        } finally {
          setIsTranslating(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch {
      alert("Microphone access denied.");
    }
  }

  function stopMicRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function translateAndPlay() {
    if (!questionText.trim()) return;
    setIsTranslating(true);
    setTranslatedText("");

    try {
      // Translate native language → English
      let english = questionText;
      if (language !== "English") {
        const res = await fetch("/api/translate/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: questionText, fromLanguage: language, toLanguage: "English" }),
        });
        const data = await res.json();
        english = data.translated ?? questionText;
      }
      setTranslatedText(english);
    } finally {
      setIsTranslating(false);
    }
  }

  async function playEnglish() {
    if (!translatedText.trim()) return;
    setIsPlaying(true);
    try {
      console.log(`[TTS] Fetching audio for: "${translatedText}"`);
      const res = await fetch("/api/translate/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translatedText }),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[TTS] API error: ${res.status} - ${errText}`);
        setIsPlaying(false); 
        return; 
      }
      
      const blob = await res.blob();
      console.log(`[TTS] Received blob: ${blob.size} bytes, type: ${blob.type}`);
      
      if (blob.size === 0) {
        console.error("[TTS] Blob is empty!");
        setIsPlaying(false);
        return;
      }
      
      const url = URL.createObjectURL(blob);
      console.log(`[TTS] Created blob URL: ${url}`);
      
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      
      return new Promise<void>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(url);
          setIsPlaying(false);
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
      setIsPlaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">💬</span>
          <span className="newspaper-label text-[10px]">ASK A QUESTION</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Type or speak your question in {language}. We&apos;ll translate it to English and play it aloud.
        </p>
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-start">
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={`Type your question in ${language}…`}
          rows={3}
          className="flex-1 resize-none text-sm"
          style={{ fontFamily: "var(--font-inter), system-ui" }}
        />
        <button
          onClick={isRecording ? stopMicRecording : startMicRecording}
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border transition-all"
          style={{
            background: isRecording ? "#F87171" : "var(--bg-secondary)",
            borderColor: isRecording ? "#F87171" : "var(--border-default)",
            color: isRecording ? "#fff" : "var(--text-secondary)",
          }}
          title={isRecording ? "Stop recording (auto-stops at 10s)" : "Record question in native language"}
        >
          {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
        </button>
      </div>

      {isRecording && (
        <p className="text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
          Recording… (auto-stops in 10s)
        </p>
      )}

      {/* Translate button */}
      <Button
        className="rounded-full gap-2 text-sm"
        style={{ background: "var(--accent-primary)", color: "#1A1A1A" }}
        onClick={translateAndPlay}
        disabled={!questionText.trim() || isTranslating || isPlaying}
      >
        {isTranslating ? (
          <><Loader2 size={14} className="animate-spin" /> Translating…</>
        ) : (
          <><Volume2 size={14} /> Translate</>
        )}
      </Button>

      {/* Result */}
      {translatedText && (
        <div
          className="rounded-lg px-4 py-3 border text-sm space-y-2"
          style={{ background: "rgba(212,168,67,0.05)", borderColor: "rgba(212,168,67,0.2)" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
              Your question ({language})
            </p>
            <p style={{ color: "var(--text-secondary)" }}>{questionText}</p>
          </div>
          <div className="border-t pt-2" style={{ borderColor: "rgba(212,168,67,0.2)" }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--accent-primary)" }}>
              English (spoken aloud)
            </p>
            <div className="flex items-start gap-2">
              <p className="font-medium flex-1" style={{ color: "var(--text-primary)" }}>{translatedText}</p>
              <button
                onClick={playEnglish}
                disabled={isPlaying}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                style={{
                  background: isPlaying ? "rgba(212,168,67,0.15)" : "var(--accent-primary)",
                  color: isPlaying ? "var(--accent-primary)" : "#1A1A1A",
                }}
                title="Play English audio"
              >
                {isPlaying ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                {isPlaying ? "Playing…" : "Play"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
