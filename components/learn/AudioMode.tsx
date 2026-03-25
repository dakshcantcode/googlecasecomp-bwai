"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Headphones } from "lucide-react";
import { ModeSkeleton } from "./ModeSkeleton";
import { ModeError } from "./ModeError";

interface AudioModeProps {
  conceptId: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AudioMode({ conceptId }: AudioModeProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let url: string | null = null;

    fetch(`/api/concepts/${conceptId}/audio`)
      .then((r) => {
        if (!r.ok) throw new Error("Audio fetch failed");
        return r.blob();
      })
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [conceptId]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => setIsPlaying(false);
    audio.playbackRate = speed;
    return () => { audio.pause(); audio.src = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  }

  if (status === "loading") return <ModeSkeleton variant="audio" />;
  if (status === "error") return (
    <ModeError mode="audio" onRetry={() => { setStatus("loading"); setAudioUrl(null); }} />
  );

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Headphones size={16} style={{ color: "var(--accent-primary)" }} />
        <span className="newspaper-label text-[11px]">AUDIO MODE</span>
      </div>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Listen to your concept notes. Great for commuting or reviewing hands-free.
      </p>

      {/* Play button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
          style={{
            background: "var(--accent-primary)",
            color: "#1A1A1A",
            boxShadow: isPlaying ? "0 0 0 8px rgba(212,168,67,0.2)" : "none",
          }}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {/* Time display */}
        <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace" }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.5}
          value={currentTime}
          onChange={handleScrub}
          className="w-full max-w-sm"
          style={{ accentColor: "var(--accent-primary)" }}
        />

        {/* Speed chips */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className="px-2.5 py-1 rounded-full text-[11px] border transition-all"
              style={{
                background: speed === s ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: speed === s ? "#1A1A1A" : "var(--text-secondary)",
                borderColor: speed === s ? "var(--accent-primary)" : "var(--border-default)",
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
