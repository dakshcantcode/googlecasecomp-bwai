"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { ConceptNode, ConceptStrand } from "@/stores/webStore";
import { initLayout, tickLayout } from "@/lib/webLayout";
import { clamp } from "@/lib/3d-utils";

const STATE_COLORS: Record<ConceptNode["state"], string> = {
  mastered: "#4ADE80",
  progress: "#A78BFA",
  decay: "#FB923C",
  locked: "rgba(180,180,180,0.35)",
};

const STRAND_COLORS = (a: ConceptNode, b: ConceptNode): string => {
  if (a.state === "mastered" && b.state === "mastered") return "rgba(212,168,67,0.7)";
  if (a.state === "locked" || b.state === "locked") return "rgba(180,180,180,0.18)";
  if (a.state === "decay" || b.state === "decay") return "rgba(251,146,60,0.5)";
  return "rgba(212,168,67,0.35)";
};

interface TooltipData {
  node: ConceptNode;
  x: number;
  y: number;
}

interface ConceptWebProps {
  nodes: ConceptNode[];
  strands: ConceptStrand[];
  spiderNodeId?: string | null;
  onNodeClick?: (node: ConceptNode) => void;
}

export default function ConceptWeb({ nodes: initialNodes, strands, spiderNodeId, onNodeClick }: ConceptWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<ConceptNode[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [prereqIds, setPrereqIds] = useState<string[]>([]);
  const decayOffset = useRef(0);

  // Init layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const inited = initLayout(initialNodes.map((n) => n.id), strands, cx, cy);
    nodesRef.current = initialNodes.map((n) => ({
      ...n,
      ...inited.find((p) => p.id === n.id)!,
    }));
    frameRef.current = 0;
  }, [initialNodes, strands]);

  const getNodeAt = useCallback((cx: number, cy: number): ConceptNode | null => {
    const cam = cameraRef.current;
    const wx = (cx - cam.x) / cam.scale;
    const wy = (cy - cam.y) / cam.scale;
    for (const n of nodesRef.current) {
      const dx = n.x - wx;
      const dy = n.y - wy;
      if (Math.sqrt(dx * dx + dy * dy) < 14) return n;
    }
    return null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function worldToScreen(x: number, y: number) {
      const cam = cameraRef.current;
      return { sx: x * cam.scale + cam.x, sy: y * cam.scale + cam.y };
    }

    function draw(time: number) {
      const W = canvas!.clientWidth;
      const H = canvas!.clientHeight;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "var(--bg-primary)";
      ctx.fillRect(0, 0, W, H);

      const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]));
      decayOffset.current = time * 0.04;

      // Strands
      for (const s of strands) {
        const a = nodeMap.get(s.from);
        const b = nodeMap.get(s.to);
        if (!a || !b) continue;
        const pa = worldToScreen(a.x, a.y);
        const pb = worldToScreen(b.x, b.y);
        const isPrereq = prereqIds.includes(a.id) || prereqIds.includes(b.id);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);

        const bothMastered = a.state === "mastered" && b.state === "mastered";
        const hasDecay = a.state === "decay" || b.state === "decay";

        if (hasDecay) {
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -decayOffset.current * 20;
        } else if (a.state === "locked" || b.state === "locked") {
          ctx.setLineDash([3, 5]);
        }

        ctx.strokeStyle = isPrereq ? "rgba(212,168,67,0.9)" : STRAND_COLORS(a, b);
        ctx.lineWidth = isPrereq ? 2.5 : bothMastered ? 2 : 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // Nodes
      for (const n of nodesRef.current) {
        const { sx, sy } = worldToScreen(n.x, n.y);
        const isPrereq = prereqIds.includes(n.id);
        const isSpider = n.id === spiderNodeId;
        const baseR = isSpider ? 10 : 8;

        // Pulse for decay
        const pulse = n.state === "decay" ? 1 + 0.15 * Math.sin(time * 4 + n.x * 0.1) : 1;
        const r = baseR * pulse * cameraRef.current.scale;

        // Glow for mastered / prereq highlight
        if (n.state === "mastered" || isPrereq || isSpider) {
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5);
          const gc = isSpider ? "212,168,67" : isPrereq ? "212,168,67" : n.state === "mastered" ? "74,222,128" : "167,139,250";
          grd.addColorStop(0, `rgba(${gc},0.3)`);
          grd.addColorStop(1, `rgba(${gc},0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = n.state === "locked" ? STATE_COLORS.locked : STATE_COLORS[n.state];
        ctx.fill();

        if (isPrereq) {
          ctx.strokeStyle = "rgba(212,168,67,0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Mastery ring for progress nodes
        if (n.state === "progress" && n.masteryPercent > 0) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 3 * cameraRef.current.scale, -Math.PI / 2, -Math.PI / 2 + (n.masteryPercent / 100) * Math.PI * 2);
          ctx.strokeStyle = "rgba(167,139,250,0.6)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Label
        const labelAlpha = clamp(cameraRef.current.scale - 0.4, 0, 1);
        if (labelAlpha > 0.1) {
          ctx.fillStyle = `rgba(${n.state === "locked" ? "150,150,150" : "255,255,255"},${labelAlpha * 0.85})`;
          ctx.font = `${Math.round(10 * cameraRef.current.scale)}px var(--font-inter, sans-serif)`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, sx, sy + r + 13 * cameraRef.current.scale);
        }

        // Spider indicator
        if (isSpider) {
          ctx.fillStyle = "rgba(212,168,67,0.9)";
          ctx.font = `${Math.round(14 * cameraRef.current.scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("🕷", sx, sy - r - 6 * cameraRef.current.scale);
        }
      }
    }

    function loop(time: number) {
      if (frameRef.current < 200) {
        nodesRef.current = tickLayout(nodesRef.current, strands, canvas!.clientWidth / 2, canvas!.clientHeight / 2);
        frameRef.current++;
      }
      draw(time * 0.001);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    // Mouse/touch pan
    function onMouseDown(e: MouseEvent) {
      dragRef.current = { startX: e.clientX, startY: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y };
    }
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) {
        const rect = canvas!.getBoundingClientRect();
        const n = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        canvas!.style.cursor = n ? "pointer" : "grab";
        if (n) {
          setTooltip({ node: n, x: e.clientX - rect.left, y: e.clientY - rect.top });
        } else {
          setTooltip(null);
        }
        return;
      }
      cameraRef.current.x = dragRef.current.camX + (e.clientX - dragRef.current.startX);
      cameraRef.current.y = dragRef.current.camY + (e.clientY - dragRef.current.startY);
    }
    function onMouseUp(e: MouseEvent) {
      if (dragRef.current) {
        const moved = Math.abs(e.clientX - dragRef.current.startX) + Math.abs(e.clientY - dragRef.current.startY);
        dragRef.current = null;
        if (moved < 5) {
          const rect = canvas!.getBoundingClientRect();
          const n = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
          if (n) handleNodeClick(n);
        }
      }
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = clamp(cameraRef.current.scale * factor, 0.3, 3);
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      cameraRef.current.x = mx - (mx - cameraRef.current.x) * (newScale / cameraRef.current.scale);
      cameraRef.current.y = my - (my - cameraRef.current.y) * (newScale / cameraRef.current.scale);
      cameraRef.current.scale = newScale;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [strands, spiderNodeId, prereqIds, getNodeAt]);

  function handleNodeClick(node: ConceptNode) {
    if (node.state === "locked") {
      // Visual feedback: highlight prerequisite nodes
      const prereqs = strands
        .filter((s) => s.to === node.id)
        .map((s) => s.from);
      setPrereqIds(prereqs);
      setLockedMsg("Study this concept to unlock it.");
      setTimeout(() => { setPrereqIds([]); setLockedMsg(null); }, 3000);
    } else {
      setPrereqIds([]);
      setLockedMsg(null);
    }
    // Always call parent — parent shows concept detail for all nodes
    onNodeClick?.(node);
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: "grab", touchAction: "none" }}
      />

      {/* Node tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 rounded text-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: "rgba(30,30,30,0.92)",
            border: "1px solid rgba(212,168,67,0.3)",
            color: "#fff",
            maxWidth: 200,
          }}
        >
          <p className="font-semibold mb-0.5" style={{ color: STATE_COLORS[tooltip.node.state] }}>
            {tooltip.node.label}
          </p>
          {tooltip.node.state !== "locked" ? (
            <>
              <p>Mastery: {tooltip.node.masteryPercent}%</p>
              <p>Last reviewed: {tooltip.node.lastReviewed}</p>
              {tooltip.node.errorCount > 0 && <p>Errors flagged: {tooltip.node.errorCount}</p>}
            </>
          ) : (
            <p style={{ color: "rgba(180,180,180,0.7)" }}>Locked — complete prerequisites</p>
          )}
        </div>
      )}

      {/* Locked message */}
      {lockedMsg && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded text-sm"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--accent-primary)",
            color: "var(--text-primary)",
          }}
        >
          🔒 {lockedMsg}
        </div>
      )}
    </div>
  );
}
