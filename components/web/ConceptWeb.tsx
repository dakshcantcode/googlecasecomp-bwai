"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { ConceptNode, ConceptStrand } from "@/stores/webStore";
import { project3D, rotateX, rotateY, clamp, type Vec3 } from "@/lib/3d-utils";

/* ── Site-palette node colors ─────────────────────────────────────────── */
const NODE_STYLE: Record<ConceptNode["state"], { rgb: string; darkRgb: string; label: string }> = {
  mastered: { rgb: "212,168,67",  darkRgb: "110,80,14",  label: "#D4A843" }, // site gold
  progress: { rgb: "52,211,153",  darkRgb: "12,105,65",  label: "#34D399" }, // jade
  decay:    { rgb: "251,146,60",  darkRgb: "155,55,8",   label: "#FB923C" }, // amber
  locked:   { rgb: "110,95,68",   darkRgb: "48,40,22",   label: "#9A8458" }, // warm sepia
};

const STRAND_RGB = (a: ConceptNode, b: ConceptNode): string => {
  if (a.state === "mastered" && b.state === "mastered") return "212,168,67";
  if (a.state === "locked"   || b.state === "locked")   return "130,108,72";
  if (a.state === "decay"    || b.state === "decay")    return "251,146,60";
  return "52,211,153";
};

const GRID_SPACING = 120;

/* ── Spider-web ring layout via BFS ──────────────────────────────────── */
// Hub (most-connected) sits at centre; BFS depth = ring number.
// Nodes in the same ring are evenly distributed on a circle, giving
// a genuine concentric-ring spider-web appearance.
function buildSpiderLayout(
  nodes: ConceptNode[],
  strands: ConceptStrand[]
): Map<string, Vec3> {
  if (!nodes.length) return new Map();

  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const s of strands) {
    adj.get(s.from)?.push(s.to);
    adj.get(s.to)?.push(s.from);
  }

  // Hub = most-connected node
  let hubId = nodes[0].id;
  let maxDeg = -1;
  for (const n of nodes) {
    const deg = adj.get(n.id)?.length ?? 0;
    if (deg > maxDeg) { maxDeg = deg; hubId = n.id; }
  }

  // BFS to assign ring depth
  const ring = new Map<string, number>();
  const queue: string[] = [hubId];
  ring.set(hubId, 0);
  while (queue.length) {
    const curr = queue.shift()!;
    const r = ring.get(curr)!;
    for (const nb of (adj.get(curr) ?? [])) {
      if (!ring.has(nb)) { ring.set(nb, r + 1); queue.push(nb); }
    }
  }
  const maxRing = Math.max(0, ...ring.values());
  for (const n of nodes) if (!ring.has(n.id)) ring.set(n.id, maxRing + 1);

  // Group by ring
  const byRing = new Map<number, string[]>();
  for (const [id, r] of ring) {
    if (!byRing.has(r)) byRing.set(r, []);
    byRing.get(r)!.push(id);
  }

  const RING_R = 120; // world units between rings
  const positions = new Map<string, Vec3>();

  for (const [r, ids] of byRing) {
    const radius = r * RING_R;
    ids.forEach((id, i) => {
      const angle = (i / Math.max(ids.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positions.set(id, {
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 14,
        y: Math.sin(angle) * radius + (Math.random() - 0.5) * 14,
        // Slight Z per ring so rings have depth when rotated
        z: (Math.random() - 0.5) * 60,
      });
    });
  }

  return positions;
}

/* ── Types ────────────────────────────────────────────────────────────── */
interface TooltipData { node: ConceptNode; x: number; y: number }

interface ConceptWebProps {
  nodes: ConceptNode[];
  strands: ConceptStrand[];
  spiderNodeId?: string | null;
  onNodeClick?: (node: ConceptNode) => void;
}

/* ── Component ────────────────────────────────────────────────────────── */
export default function ConceptWeb({
  nodes: initialNodes,
  strands,
  spiderNodeId,
  onNodeClick,
}: ConceptWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef  = useRef<ConceptNode[]>([]);
  const pos3DRef  = useRef<Map<string, Vec3>>(new Map());
  const gridRef   = useRef<Vec3[]>([]);
  // camZ: -800 (far) → -280 (close). Node Z is ±30 so viewZ is always ≥ 250 at closest zoom.
  const camRef    = useRef({ rotX: 0.15, rotY: 0.25, camZ: -560 });
  const dragRef   = useRef<{ sx: number; sy: number; rotX: number; rotY: number } | null>(null);
  const rafRef    = useRef<number>(0);
  const timeRef   = useRef(0);
  const lastTsRef = useRef(0);

  const [tooltip,   setTooltip]   = useState<TooltipData | null>(null);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [prereqIds, setPrereqIds] = useState<string[]>([]);

  /* ── Rebuild layout + grid whenever nodes/strands change ── */
  useEffect(() => {
    nodesRef.current = [...initialNodes];
    const layout = buildSpiderLayout(initialNodes, strands);
    pos3DRef.current = layout;

    // Sphere-shaped grid: 2 voxels past the furthest node, minimum 3 voxels radius.
    const pts = Array.from(layout.values());
    const maxNodeR = pts.reduce((m, p) => Math.max(m, Math.hypot(p.x, p.y, p.z)), 0);
    const gridRadius = Math.max(maxNodeR + 2 * GRID_SPACING, 3 * GRID_SPACING);
    const half = Math.ceil(gridRadius / GRID_SPACING);
    const grid: Vec3[] = [];
    for (let x = -half; x <= half; x++)
      for (let y = -half; y <= half; y++)
        for (let z = -half; z <= half; z++) {
          const pt = { x: x * GRID_SPACING, y: y * GRID_SPACING, z: z * GRID_SPACING };
          if (Math.hypot(pt.x, pt.y, pt.z) <= gridRadius) grid.push(pt);
        }
    gridRef.current = grid;
  }, [initialNodes, strands]);

  /* ── Project one node into screen space ── */
  const projectNode = useCallback(
    (n: ConceptNode, W: number, H: number) => {
      const p3 = pos3DRef.current.get(n.id);
      if (!p3) return null;
      const cam = camRef.current;
      let p: Vec3 = { ...p3 };
      p = rotateY(p, cam.rotY);
      p = rotateX(p, cam.rotX);
      const viewZ = p.z - cam.camZ;
      if (viewZ < 8) return null;
      return project3D({ ...p, z: viewZ }, 420, W / 2, H / 2);
    },
    []
  );

  /* ── Hit-test ── */
  const getNodeAt = useCallback(
    (mx: number, my: number, W: number, H: number): ConceptNode | null => {
      let best: ConceptNode | null = null;
      let bestD = 22;
      for (const n of nodesRef.current) {
        const proj = projectNode(n, W, H);
        if (!proj) continue;
        const d = Math.hypot(proj.x - mx, proj.y - my);
        if (d < bestD) { bestD = d; best = n; }
      }
      return best;
    },
    [projectNode]
  );

  /* ── Canvas render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = canvas!.clientWidth  * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    /* ── Draw one frame ── */
    function draw(time: number) {
      const W = canvas!.clientWidth;
      const H = canvas!.clientHeight;
      ctx.clearRect(0, 0, W, H);

      const isDark = document.documentElement.classList.contains("dark");
      const cam    = camRef.current;
      const cx = W / 2, cy = H / 2;
      const focal  = 420;
      const maxFog = 1100;

      // Background — matches site globals
      ctx.fillStyle = isDark ? "#141414" : "#FAFAF5";
      ctx.fillRect(0, 0, W, H);

      // ── Voxel grid dots (warm gold tint to match site accent) ────────
      const dotRgb = isDark ? "212,168,67" : "110,80,25";
      for (const pt of gridRef.current) {
        let p = rotateY(pt, cam.rotY);
        p = rotateX(p, cam.rotX);
        const viewZ = p.z - cam.camZ;
        if (viewZ < 10) continue;
        const proj = project3D({ ...p, z: viewZ }, focal, cx, cy);
        const fog  = clamp(1 - viewZ / maxFog, 0.02, 0.45);
        const dotR = Math.max(0.6, proj.scale * 2.8);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotRgb},${fog})`;
        ctx.fill();
      }

      const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]));

      // ── Strands ──────────────────────────────────────────────────────
      for (const s of strands) {
        const a = nodeMap.get(s.from);
        const b = nodeMap.get(s.to);
        if (!a || !b) continue;
        const pa = projectNode(a, W, H);
        const pb = projectNode(b, W, H);
        if (!pa || !pb) continue;

        const isPrereq   = prereqIds.includes(a.id) || prereqIds.includes(b.id);
        const isLocked   = a.state === "locked" || b.state === "locked";
        const isMastered = a.state === "mastered" && b.state === "mastered";
        const hasDecay   = a.state === "decay"    || b.state === "decay";

        const rgb   = isPrereq ? "212,168,67" : STRAND_RGB(a, b);
        const alpha = isPrereq ? 0.95
          : isLocked   ? 0.55   // clearly visible dashed line
          : isMastered ? 0.65
          : hasDecay   ? 0.55
          : 0.45;
        const lw    = isPrereq ? 2.5 : isMastered ? 2.0 : isLocked ? 1.2 : 1.4;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        if (hasDecay) {
          ctx.setLineDash([7, 4]);
          ctx.lineDashOffset = -time * 22;
        } else if (isLocked) {
          ctx.setLineDash([6, 5]); // larger dash, clearly visible
        }
        ctx.strokeStyle = `rgba(${rgb},${alpha})`;
        ctx.lineWidth   = lw;
        ctx.stroke();
        ctx.restore();
      }

      // ── Nodes ────────────────────────────────────────────────────────
      for (const n of nodesRef.current) {
        const proj = projectNode(n, W, H);
        if (!proj) continue;

        const isPrereq = prereqIds.includes(n.id);
        const isSpider = n.id === spiderNodeId;
        const style    = NODE_STYLE[n.state];
        const px       = pos3DRef.current.get(n.id)?.x ?? 0;
        const pulse    = n.state === "decay" ? 1 + 0.18 * Math.sin(time * 4 + px * 0.1) : 1;
        const r        = (isSpider ? 18 : 13) * proj.scale * pulse;

        // Outer glow
        const glowRgb = isPrereq ? "212,168,67" : style.rgb;
        const glow    = ctx.createRadialGradient(proj.x, proj.y, r * 0.3, proj.x, proj.y, r * 3.2);
        glow.addColorStop(0, `rgba(${glowRgb},0.30)`);
        glow.addColorStop(1, `rgba(${glowRgb},0)`);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // 3D sphere — radial gradient lit from top-left
        const lx     = proj.x - r * 0.38;
        const ly     = proj.y - r * 0.38;
        const sphere = ctx.createRadialGradient(lx, ly, 0, proj.x, proj.y, r);
        const opacity = n.state === "locked" ? 0.60 : 0.95;
        sphere.addColorStop(0,    "rgba(255,255,255,0.80)");
        sphere.addColorStop(0.28, `rgba(${style.rgb},${opacity})`);
        sphere.addColorStop(1,    `rgba(${style.darkRgb},${opacity})`);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
        ctx.fillStyle = sphere;
        ctx.fill();

        // Specular highlight
        const sx2 = proj.x - r * 0.3, sy2 = proj.y - r * 0.3;
        const spec = ctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, r * 0.42);
        spec.addColorStop(0, "rgba(255,255,255,0.52)");
        spec.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(sx2, sy2, r * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = spec;
        ctx.fill();

        // Prereq highlight ring
        if (isPrereq) {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(212,168,67,0.9)";
          ctx.lineWidth   = 2;
          ctx.stroke();
        }

        // Progress mastery arc
        if (n.state === "progress" && n.masteryPercent > 0) {
          ctx.beginPath();
          ctx.arc(
            proj.x, proj.y,
            r + 4 * proj.scale,
            -Math.PI / 2,
            -Math.PI / 2 + (n.masteryPercent / 100) * Math.PI * 2
          );
          ctx.strokeStyle = "rgba(52,211,153,0.65)";
          ctx.lineWidth   = 2;
          ctx.stroke();
        }

        // Label — no zoom-fade, always readable
        ctx.fillStyle  = isPrereq ? "#D4A843" : style.label;
        ctx.font       = `${Math.round(13 * proj.scale)}px var(--font-inter, sans-serif)`;
        ctx.textAlign  = "center";
        ctx.fillText(n.label, proj.x, proj.y + r + 16 * proj.scale);

        if (isSpider) {
          ctx.font = `${Math.round(14 * proj.scale)}px sans-serif`;
          ctx.fillText("🕷", proj.x, proj.y - r - 6 * proj.scale);
        }
      }
    }

    /* ── RAF loop ── */
    function loop(ts: number) {
      const dt = lastTsRef.current > 0 ? Math.min((ts - lastTsRef.current) / 1000, 0.05) : 0.016;
      lastTsRef.current = ts;
      timeRef.current += dt;


      draw(timeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    /* ── Mouse: drag to rotate ── */
    function onMouseDown(e: MouseEvent) {
      dragRef.current = {
        sx: e.clientX, sy: e.clientY,
        rotX: camRef.current.rotX, rotY: camRef.current.rotY,
      };
    }
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current) {
        camRef.current.rotY = dragRef.current.rotY + (e.clientX - dragRef.current.sx) * 0.007;
        camRef.current.rotX = clamp(
          dragRef.current.rotX + (e.clientY - dragRef.current.sy) * 0.007,
          -1.2, 1.2
        );
        canvas!.style.cursor = "grabbing";
        return;
      }
      const rect = canvas!.getBoundingClientRect();
      const hit  = getNodeAt(
        e.clientX - rect.left, e.clientY - rect.top,
        canvas!.clientWidth, canvas!.clientHeight
      );
      canvas!.style.cursor = hit ? "pointer" : "grab";
      setTooltip(hit
        ? { node: hit, x: e.clientX - rect.left, y: e.clientY - rect.top }
        : null
      );
    }
    function onMouseUp(e: MouseEvent) {
      if (!dragRef.current) return;
      const moved = Math.hypot(e.clientX - dragRef.current.sx, e.clientY - dragRef.current.sy);
      dragRef.current = null;
      canvas!.style.cursor = "grab";
      if (moved < 5) {
        const rect = canvas!.getBoundingClientRect();
        const hit  = getNodeAt(
          e.clientX - rect.left, e.clientY - rect.top,
          canvas!.clientWidth, canvas!.clientHeight
        );
        if (hit) handleNodeClick(hit);
      }
    }

    /* ── Scroll: move camera closer/further — clamped so nodes never clip ── */
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      camRef.current.camZ = clamp(camRef.current.camZ + e.deltaY * 0.6, -800, -60);
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup",   onMouseUp);
    canvas.addEventListener("wheel",     onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup",   onMouseUp);
      canvas.removeEventListener("wheel",     onWheel);
    };
  }, [strands, spiderNodeId, prereqIds, getNodeAt, projectNode]);

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

      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 rounded text-xs"
          style={{
            left: tooltip.x + 14,
            top:  tooltip.y - 10,
            background: "var(--bg-secondary)",
            border: `1px solid ${NODE_STYLE[tooltip.node.state].label}66`,
            color: "var(--text-primary)",
            maxWidth: 210,
          }}
        >
          <p className="font-semibold mb-0.5" style={{ color: NODE_STYLE[tooltip.node.state].label }}>
            {tooltip.node.label}
          </p>
          {tooltip.node.state !== "locked" ? (
            <>
              <p>Mastery: {tooltip.node.masteryPercent}%</p>
              <p>Last reviewed: {tooltip.node.lastReviewed}</p>
              {tooltip.node.errorCount > 0 && <p>Errors flagged: {tooltip.node.errorCount}</p>}
            </>
          ) : (
            <p style={{ color: "var(--text-tertiary)" }}>Locked — complete prerequisites</p>
          )}
        </div>
      )}

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
