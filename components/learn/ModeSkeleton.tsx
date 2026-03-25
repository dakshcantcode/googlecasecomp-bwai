"use client";

interface ModeSkeletonProps {
  variant: "flashcard" | "visual" | "audio" | "focus" | "scholar";
}

export function ModeSkeleton({ variant }: ModeSkeletonProps) {
  if (variant === "flashcard") {
    return (
      <div className="animate-pulse space-y-4 py-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded" style={{ background: "var(--border-default)" }} />
            <div className="h-3 w-40 rounded" style={{ background: "var(--border-default)" }} />
          </div>
          <div className="w-24 h-24 rounded-full" style={{ background: "var(--border-default)" }} />
        </div>
        <div className="h-56 rounded-2xl" style={{ background: "var(--border-default)" }} />
        <div className="flex justify-center gap-3">
          <div className="h-8 w-32 rounded-full" style={{ background: "var(--border-default)" }} />
          <div className="h-8 w-24 rounded-full" style={{ background: "var(--border-default)" }} />
        </div>
      </div>
    );
  }

  if (variant === "audio") {
    return (
      <div className="animate-pulse py-8 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full" style={{ background: "var(--border-default)" }} />
        <div className="w-48 h-2 rounded" style={{ background: "var(--border-default)" }} />
        <div className="flex items-end gap-1 h-12 w-full max-w-xs px-4">
          {[40, 70, 55, 85, 45, 75, 60, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "var(--border-default)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "focus") {
    return (
      <div className="animate-pulse space-y-3 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl" style={{ background: "var(--border-default)" }} />
        ))}
      </div>
    );
  }

  if (variant === "scholar") {
    return (
      <div className="animate-pulse space-y-6 py-4">
        <div className="h-8 w-40 rounded-full" style={{ background: "var(--border-default)" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 rounded" style={{ background: "var(--border-default)" }} />
            <div className="h-3 rounded" style={{ background: "var(--border-default)", width: "100%" }} />
            <div className="h-3 rounded" style={{ background: "var(--border-default)", width: "88%" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-8 py-4">
      {/* Bar chart silhouette */}
      <div>
        <div className="h-4 w-48 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="flex items-end gap-2 h-40 px-4">
          {[70, 45, 85, 55, 65, 40].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "var(--border-default)" }} />
          ))}
        </div>
      </div>
      {/* Radar silhouette */}
      <div className="flex justify-center">
        <div className="w-56 h-56 rounded-full" style={{ background: "var(--border-default)" }} />
      </div>
      {/* Timeline silhouette */}
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-44 h-28 rounded-xl" style={{ background: "var(--border-default)" }} />
        ))}
      </div>
    </div>
  );
}
