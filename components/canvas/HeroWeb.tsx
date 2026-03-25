/**
 * HeroWeb — First-Person 3D Spider Web Canvas Engine
 * Ported from NeuroSketch HeroNeuron.tsx
 *
 * Changes from source:
 * - buildNeuronTree() → buildSpiderWeb() (concentric rings + spokes topology)
 * - Cyan palette → gold palette (rgba 212, 168, 67)
 * - Dark cyber background → warm newsprint gradient
 * - 80 warp lines → 20 warp lines, gold colored
 * - White flash → warm gold vignette
 * - FactOverlay → WebTooltip with Co-Synapse feature descriptions
 * - Parkinson's facts → Co-Synapse feature descriptions
 * ALL camera, projection, fog, near-clip, parallax, particle, and warp
 * logic is UNCHANGED from NeuroSketch.
 */

"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  project3D,
  rotateX,
  rotateY,
  lerp,
  clamp,
  type Vec3,
} from "@/lib/3d-utils";
import { useWebZoom } from "@/hooks/use-web-zoom";
import WebTooltip, { type WebFactData } from "@/components/canvas/WebTooltip";

/* ─── Types ────────────────────────────────────────────────────────────── */

interface WebNode {
  pos: Vec3;
  ring: number;
  spoke: number;
  pulsePhase: number;
  factIndex: number | null;
}

interface WebStrand {
  from: Vec3;
  to: Vec3;
  type: "ring" | "spoke";
  sagAmount: number;
  pulsePhase: number;
}

interface Particle {
  strand: WebStrand;
  t: number;
  speed: number;
  baseSpeed: number;
  size: number;
}

/* ─── Co-Synapse Feature Descriptions ─────────────────────────────────── */

interface SpatialFeature {
  id: number;
  pos: Vec3;
  fact: WebFactData;
}

const SPATIAL_FEATURES: SpatialFeature[] = [
  { id: 0, pos: { x: -100, y: -70, z: 80 }, fact: { title: "Content Ingestion", body: "Upload any content — PDFs, slides, notes, audio" } },
  { id: 1, pos: { x: 110, y: -40, z: -60 }, fact: { title: "Concept Extraction", body: "AI chunks your material into concept nodes" } },
  { id: 2, pos: { x: -60, y: 80, z: 100 }, fact: { title: "Six Formats", body: "Text, examples, quizzes, audio, simulations, and video. Exams ask from every angle." } },
  { id: 3, pos: { x: 80, y: 60, z: -80 }, fact: { title: "Bayesian Tracing", body: "Bayesian Knowledge Tracing knows what you know" } },
  { id: 4, pos: { x: -30, y: -90, z: 140 }, fact: { title: "Bloom's Taxonomy", body: "Questions climb from recall to analysis" } },
  { id: 5, pos: { x: 90, y: -80, z: 50 }, fact: { title: "Flash Rounds", body: "Stress-test skills under exam pressure with timers and distractors" } },
  { id: 6, pos: { x: -120, y: 30, z: -70 }, fact: { title: "Error Taxonomy", body: "Every mistake classified. Careless, procedural, conceptual, or fatigue." } },
  { id: 7, pos: { x: 40, y: 100, z: 60 }, fact: { title: "Pattern Detection", body: "Silly mistake detection — catches recurring error patterns" } },
  { id: 8, pos: { x: -80, y: -50, z: -120 }, fact: { title: "Reverse Case Testing", body: "Finds exactly where your understanding breaks down" } },
  { id: 9, pos: { x: 120, y: 20, z: 90 }, fact: { title: "Format Switching", body: "Stuck? Try a different angle — worked example, audio, simulation" } },
  { id: 10, pos: { x: -40, y: 110, z: -50 }, fact: { title: "Forget Engine", body: "Revision timed for maximum struggle — that's when memory strengthens most" } },
  { id: 11, pos: { x: 70, y: -100, z: -90 }, fact: { title: "Knowledge Web", body: "Watch your knowledge literally take shape as nodes fill in" } },
  { id: 12, pos: { x: -110, y: -20, z: 100 }, fact: { title: "Mental-State Detection", body: "Adapts to confusion, distraction, and overwhelm in real time" } },
  { id: 13, pos: { x: 50, y: 80, z: -110 }, fact: { title: "Teachback Mode", body: "Explain it to the AI to prove you understand" } },
  { id: 14, pos: { x: -70, y: -110, z: 30 }, fact: { title: "Academic Integrity", body: "Socratic decomposition makes shortcuts useless" } },
];

/* ─── Spider Web Generator ─────────────────────────────────────────────── */

function buildSpiderWeb(
  rings: number,
  spokes: number
): { nodes: WebNode[]; strands: WebStrand[] } {
  const nodes: WebNode[] = [];
  const strands: WebStrand[] = [];

  // Center node
  const center: WebNode = {
    pos: { x: 0, y: 0, z: 0 },
    ring: 0,
    spoke: 0,
    pulsePhase: Math.random() * Math.PI * 2,
    factIndex: null,
  };
  nodes.push(center);

  // Build rings — ringNodes[r][s] = node at ring r, spoke s
  const ringNodes: WebNode[][] = [[center]];

  for (let r = 1; r <= rings; r++) {
    const rLayer: WebNode[] = [];
    const radius = r * 55 + (Math.random() - 0.5) * 8;

    for (let s = 0; s < spokes; s++) {
      const angle =
        (s / spokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const zDepth = (Math.random() - 0.5) * 40;
      const node: WebNode = {
        pos: {
          x: Math.cos(angle) * radius + (Math.random() - 0.5) * 6,
          y: Math.sin(angle) * radius + (Math.random() - 0.5) * 6,
          z: zDepth,
        },
        ring: r,
        spoke: s,
        pulsePhase: Math.random() * Math.PI * 2,
        factIndex: null,
      };
      rLayer.push(node);
      nodes.push(node);
    }
    ringNodes.push(rLayer);
  }

  // Spoke strands: center→ring1, ring(r-1)→ring(r)
  for (let r = 1; r <= rings; r++) {
    for (let s = 0; s < spokes; s++) {
      const fromNode = r === 1 ? ringNodes[0][0] : ringNodes[r - 1][s];
      const toNode = ringNodes[r][s];
      strands.push({
        from: fromNode.pos,
        to: toNode.pos,
        type: "spoke",
        sagAmount: 5 + Math.random() * 10,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Ring strands: connect adjacent nodes on same ring
  for (let r = 1; r <= rings; r++) {
    for (let s = 0; s < spokes; s++) {
      const nextS = (s + 1) % spokes;
      strands.push({
        from: ringNodes[r][s].pos,
        to: ringNodes[r][nextS].pos,
        type: "ring",
        sagAmount: 8 + Math.random() * 12,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Assign factIndex to ~15 non-center nodes spread across rings 2+
  const candidates = nodes.filter((n) => n.ring >= 2);
  const step = Math.max(1, Math.floor(candidates.length / SPATIAL_FEATURES.length));
  for (let i = 0; i < SPATIAL_FEATURES.length && i * step < candidates.length; i++) {
    candidates[i * step].factIndex = i;
  }

  return { nodes, strands };
}

/* ─── Props ────────────────────────────────────────────────────────────── */

interface HeroWebProps {
  onCinematicChange?: (state: {
    isWarping: boolean;
    hasReachedCenter: boolean;
    zoom: number;
  }) => void;
}

/* ─── Component ────────────────────────────────────────────────────────── */

export default function HeroWeb({ onCinematicChange }: HeroWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const warpProgressRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodePositionsRef = useRef<{ x: number; y: number }[]>([]);
  const hoverExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerPosRef = useRef<{ x: number; y: number; r: number }>({ x: 0, y: 0, r: 0 });
  const centerHoveredRef = useRef(false);

  const [nodePositions, setNodePositions] = useState<{ x: number; y: number }[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  const {
    zoom,
    isWarping,
    hasReachedCenter,
    handleWheel,
    resetWarp,
    activeNode,
    setActiveNode,
  } = useWebZoom({ warpThreshold: 0.85 });

  const onCinematicRef = useRef(onCinematicChange);
  onCinematicRef.current = onCinematicChange;

  useEffect(() => {
    onCinematicRef.current?.({ isWarping, hasReachedCenter, zoom });
  }, [isWarping, hasReachedCenter, zoom]);

  // Refs for jitter-free canvas (decoupled from React render cycle)
  const hoveredNodeRef = useRef<number | null>(null);
  const activeNodeRef = useRef<number | null>(null);
  const zoomRef = useRef(0);
  const isWarpingRef = useRef(false);
  const hasReachedCenterRef = useRef(false);
  const handleWheelRef = useRef(handleWheel);
  const resetWarpRef = useRef(resetWarp);

  zoomRef.current = zoom;
  isWarpingRef.current = isWarping;
  hasReachedCenterRef.current = hasReachedCenter;
  handleWheelRef.current = handleWheel;
  resetWarpRef.current = resetWarp;
  activeNodeRef.current = activeNode;

  // Build spider web once
  const { nodes, strands } = useMemo(() => buildSpiderWeb(6, 14), []);

  // Generate particles along strands
  const particles = useMemo<Particle[]>(() => {
    return strands
      .filter(() => Math.random() < 0.5)
      .map((strand) => {
        const spd = 0.003 + Math.random() * 0.005;
        return {
          strand,
          t: Math.random(),
          speed: spd,
          baseSpeed: spd,
          size: 1.5 + Math.random() * 2.5,
        };
      });
  }, [strands]);

  /* ─── Hover detection ─────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (hasReachedCenterRef.current) {
        const cp = centerPosRef.current;
        const ndx = mouseRef.current.x - cp.x;
        const ndy = mouseRef.current.y - cp.y;
        centerHoveredRef.current = ndx * ndx + ndy * ndy < cp.r * cp.r;
        canvas!.style.cursor = centerHoveredRef.current ? "pointer" : "default";
      }

      if (!hasReachedCenterRef.current) return;

      const positions = nodePositionsRef.current;
      let found: number | null = null;
      for (let i = 0; i < positions.length; i++) {
        const dx = mouseRef.current.x - positions[i].x;
        const dy = mouseRef.current.y - positions[i].y;
        if (dx * dx + dy * dy < 35 * 35) {
          found = i;
          break;
        }
      }

      if (found !== null) {
        if (hoverExitTimer.current) {
          clearTimeout(hoverExitTimer.current);
          hoverExitTimer.current = null;
        }
        hoveredNodeRef.current = found;
        setHoveredNodeId(found);
        setActiveNode(found);
      } else if (hoveredNodeRef.current !== null) {
        if (!hoverExitTimer.current) {
          hoverExitTimer.current = setTimeout(() => {
            hoveredNodeRef.current = null;
            setHoveredNodeId(null);
            setActiveNode(null);
            hoverExitTimer.current = null;
          }, 150);
        }
      }
    }

    function onLeave() {
      if (!hoverExitTimer.current) {
        hoverExitTimer.current = setTimeout(() => {
          hoveredNodeRef.current = null;
          setHoveredNodeId(null);
          setActiveNode(null);
          hoverExitTimer.current = null;
        }, 150);
      }
    }

    function onClick() {
      if (!hasReachedCenterRef.current) return;
      const cp = centerPosRef.current;
      const ndx = mouseRef.current.x - cp.x;
      const ndy = mouseRef.current.y - cp.y;
      if (ndx * ndx + ndy * ndy < cp.r * cp.r) {
        centerHoveredRef.current = false;
        canvas!.style.cursor = "default";
        hoveredNodeRef.current = null;
        setHoveredNodeId(null);
        setActiveNode(null);
        resetWarpRef.current();
      }
    }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
      if (hoverExitTimer.current) clearTimeout(hoverExitTimer.current);
    };
  }, [setActiveNode]);

  /* ─── Canvas animation loop ────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => handleWheelRef.current(e);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const ctx = canvas.getContext("2d")!;
    let width = 0;
    let height = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    /* ─── Render single strand ──────────────────────────────── */

    function renderStrand(
      strand: WebStrand,
      time: number,
      focalLength: number,
      cx: number,
      cy: number,
      rotAngleY: number,
      rotAngleX: number,
      camZ: number,
      warpFactor: number,
      maxFogDist: number
    ) {
      let s = rotateY(strand.from, rotAngleY);
      s = rotateX(s, rotAngleX);
      let e = rotateY(strand.to, rotAngleY);
      e = rotateX(e, rotAngleX);

      const viewZs = s.z - camZ;
      const viewZe = e.z - camZ;
      const nearClipMin = -focalLength + 50;

      if (viewZs < nearClipMin && viewZe < nearClipMin) return;

      const minViewZ = Math.min(viewZs, viewZe);
      const nearFade =
        minViewZ < 80
          ? clamp((minViewZ - nearClipMin) / (80 - nearClipMin), 0, 1)
          : 1;

      const avgViewZ = (viewZs + viewZe) / 2;
      const fogFactor = clamp(1 - avgViewZ / maxFogDist, 0.08, 1);

      s = { ...s, z: viewZs };
      e = { ...e, z: viewZe };

      const p1 = project3D(s, focalLength, cx, cy);
      const p2 = project3D(e, focalLength, cx, cy);

      const pulse = 0.6 + 0.4 * Math.sin(time * 2 + strand.pulsePhase);
      const warpStretch = 1 + warpFactor * 2.5;

      // Gold palette (instead of cyan)
      const r = 212, g = 168, b = 67;

      const lineWidth = Math.min(
        10,
        Math.max(0.5, 2.5 * p1.scale * warpStretch)
      );
      const alpha = clamp(
        pulse * p1.scale * (1 + warpFactor) * nearFade * fogFactor * 0.8,
        0,
        1
      );

      if (alpha < 0.005) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);

      if (warpFactor > 0.01) {
        // Speed-line stretch during warp
        const dx = p2.x - cx;
        const dy = p2.y - cy;
        ctx.lineTo(p2.x + dx * warpFactor * 1.5, p2.y + dy * warpFactor * 1.5);
      } else {
        // Quadratic bezier sag — the spider web droop
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2 + strand.sagAmount * p1.scale;
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      }

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    /* ─── Render web node ───────────────────────────────────── */

    function renderWebNode(
      node: WebNode,
      time: number,
      focalLength: number,
      cx: number,
      cy: number,
      rotAngleY: number,
      rotAngleX: number,
      camZ: number,
      maxFogDist: number
    ) {
      let p = rotateY(node.pos, rotAngleY);
      p = rotateX(p, rotAngleX);
      const viewZ = p.z - camZ;
      const nearClipMin = -focalLength + 50;
      if (viewZ < nearClipMin) return;
      const nearFade =
        viewZ < 80
          ? clamp((viewZ - nearClipMin) / (80 - nearClipMin), 0, 1)
          : 1;
      const fogFactor = clamp(1 - viewZ / maxFogDist, 0.08, 1);
      p = { ...p, z: viewZ };
      const proj = project3D(p, focalLength, cx, cy);
      const radius = (node.factIndex !== null ? 6 : 3) * proj.scale;
      const pulse = 0.7 + 0.3 * Math.sin(time * 2.5 + node.pulsePhase);
      const alpha = clamp(pulse * nearFade * fogFactor * 0.9, 0, 1);
      if (alpha < 0.01) return;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 168, 67, ${alpha})`;
      ctx.fill();
    }

    /* ─── Render center orb (= nucleus in NeuroSketch) ─────── */

    function renderCenterOrb(
      time: number,
      focalLength: number,
      cx: number,
      cy: number,
      rotAngleY: number,
      rotAngleX: number,
      zoomLevel: number,
      camZ: number,
      warpFactor: number,
      hoverScale: number
    ) {
      let orbPos: Vec3 = { x: 0, y: 0, z: 0 };
      orbPos = rotateY(orbPos, rotAngleY);
      orbPos = rotateX(orbPos, rotAngleX);
      const viewZ = orbPos.z - camZ;
      const nearClipMin = -focalLength + 50;
      const nearFade =
        viewZ < 80
          ? clamp((viewZ - nearClipMin) / (80 - nearClipMin), 0, 1)
          : 1;
      if (nearFade < 0.01) return;
      orbPos = { ...orbPos, z: viewZ };
      const projected = project3D(orbPos, focalLength, cx, cy);
      const baseRadius = 18 + zoomLevel * 40;
      const pulse = 1 + 0.2 * Math.sin(time * 3);
      const warpExpand = 1 + warpFactor * 8;
      const radius = baseRadius * projected.scale * pulse * warpExpand * hoverScale;

      centerPosRef.current = { x: projected.x, y: projected.y, r: radius * 1.5 };

      const glowAlpha = (0.45 + warpFactor * 0.45) * pulse * nearFade;
      const glowGrad = ctx.createRadialGradient(
        projected.x, projected.y, radius * 0.3,
        projected.x, projected.y, radius * (2.5 + warpFactor * 4)
      );
      glowGrad.addColorStop(0, `rgba(212, 168, 67, ${clamp(glowAlpha, 0, 1)})`);
      glowGrad.addColorStop(0.5, `rgba(184, 146, 47, ${clamp(glowAlpha * 0.5, 0, 1)})`);
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius * (2.5 + warpFactor * 4), 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      const coreAlpha = nearFade;
      const coreGrad = ctx.createRadialGradient(
        projected.x, projected.y, 0,
        projected.x, projected.y, radius
      );
      coreGrad.addColorStop(0, `rgba(255, 240, 200, ${0.98 * coreAlpha})`);
      coreGrad.addColorStop(0.4, `rgba(212, 168, 67, ${0.9 * coreAlpha})`);
      coreGrad.addColorStop(1, `rgba(184, 146, 47, ${0.3 * coreAlpha})`);
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    /* ─── Render particles ──────────────────────────────────── */

    function renderParticles(
      time: number,
      focalLength: number,
      cx: number,
      cy: number,
      rotAngleY: number,
      rotAngleX: number,
      camZ: number,
      warpFactor: number,
      maxFogDist: number
    ) {
      particles.forEach((p) => {
        const speedMult = 1 + warpFactor * 15;
        p.t = (p.t + p.baseSpeed * speedMult) % 1;
        const pos: Vec3 = {
          x: lerp(p.strand.from.x, p.strand.to.x, p.t),
          y: lerp(p.strand.from.y, p.strand.to.y, p.t),
          z: lerp(p.strand.from.z, p.strand.to.z, p.t),
        };
        let rPos = rotateY(pos, rotAngleY);
        rPos = rotateX(rPos, rotAngleX);
        const viewZ = rPos.z - camZ;
        const nearClipMin = -focalLength + 50;
        if (viewZ < nearClipMin) return;
        const nearFade = viewZ < 80 ? clamp((viewZ - nearClipMin) / (80 - nearClipMin), 0, 1) : 1;
        const fogFactor = clamp(1 - viewZ / maxFogDist, 0.08, 1);
        rPos = { ...rPos, z: viewZ };
        const proj = project3D(rPos, focalLength, cx, cy);
        const alpha = (0.55 + 0.45 * Math.sin(time * 5 + p.strand.pulsePhase)) * nearFade * fogFactor;

        const trailLen = warpFactor * 6;
        if (trailLen > 0.1) {
          const dx = proj.x - cx;
          const dy = proj.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(proj.x + (dx / dist) * trailLen * 8, proj.y + (dy / dist) * trailLen * 8);
          ctx.strokeStyle = `rgba(212, 168, 67, ${clamp(alpha * proj.scale * 0.5, 0, 0.6)})`;
          ctx.lineWidth = p.size * proj.scale * 0.5;
          ctx.stroke();
        }

        const pxSize = Math.min(10, p.size * proj.scale * (1 + warpFactor) * 1.2);
        ctx.fillStyle = `rgba(212, 168, 67, ${clamp(alpha * proj.scale * (1 + warpFactor * 2) * 1.3, 0, 1)})`;
        ctx.fillRect(proj.x - pxSize / 2, proj.y - pxSize / 2, pxSize, pxSize);
      });
    }

    /* ─── Render warp lines (gold, 20 lines) ────────────────── */

    function renderWarpLines(cx: number, cy: number, warpFactor: number, time: number) {
      if (warpFactor < 0.01) return;
      const numLines = Math.floor(warpFactor * 20); // 80→20
      ctx.save();
      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2 + time * 0.5;
        const innerR = 30 + Math.sin(time * 3 + i) * 20;
        const outerR = innerR + warpFactor * 400 * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.strokeStyle = `rgba(212, 168, 67, ${clamp(warpFactor * 0.3, 0, 0.4)})`;
        ctx.lineWidth = 0.5 + warpFactor;
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ─── Main animation frame ──────────────────────────────── */

    let currentZoom = 0;
    let postGlowExpand = 1;
    let cameraZPos = -320;
    let parallaxX = 0;
    let parallaxY = 0;
    let autoTriggered = false;

    function animate() {
      const time = (timeRef.current += 0.016);

      currentZoom = lerp(currentZoom, zoomRef.current, 0.08);

      if (isWarpingRef.current) {
        warpProgressRef.current = lerp(warpProgressRef.current, 1, 0.025); // slower: 0.04→0.025
      } else {
        warpProgressRef.current = lerp(warpProgressRef.current, 0, 0.06);
      }
      const warpFactor = warpProgressRef.current;

      const expandTarget = hasReachedCenterRef.current ? 1.25 : 1;
      postGlowExpand = lerp(postGlowExpand, expandTarget, 0.018);

      ctx.clearRect(0, 0, width, height);

      // Background — warm newsprint (newspaper aesthetic), not dark cyber
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.7
      );
      // Detect dark mode via html.classList
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      if (isDark) {
        bgGrad.addColorStop(0, `rgba(30, 30, 30, 1)`);
        bgGrad.addColorStop(1, `rgba(20, 20, 20, 1)`);
      } else {
        bgGrad.addColorStop(0, `rgba(250, 250, 245, 1)`);
        bgGrad.addColorStop(1, `rgba(242, 240, 232, 1)`);
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const focalLength = 350;
      const maxFogDist = 1100;

      // Camera Z (unchanged from NeuroSketch)
      let targetCamZ: number;
      if (isWarpingRef.current) {
        targetCamZ = 600;
      } else if (hasReachedCenterRef.current) {
        targetCamZ = 0;
      } else {
        targetCamZ = -320 + currentZoom * 376;
      }
      const camLerp = isWarpingRef.current ? 0.035 : 0.06;
      cameraZPos = lerp(cameraZPos, targetCamZ, camLerp);

      // Camera rotation (unchanged from NeuroSketch)
      let rotY: number;
      let rotXAngle: number;

      if (hasReachedCenterRef.current) {
        const mx = width > 0 ? (mouseRef.current.x - cx) / (width * 0.5) : 0;
        const my = height > 0 ? (mouseRef.current.y - cy) / (height * 0.5) : 0;
        parallaxX = lerp(parallaxX, mx * 0.85, 0.06);
        parallaxY = lerp(parallaxY, my * 0.65, 0.06);
        rotY = parallaxX;
        rotXAngle = parallaxY;
      } else {
        const rotDampen = Math.max(0, 1 - currentZoom * 1.4);
        const rotSpeed = 0.15 * rotDampen;
        rotY = time * rotSpeed;
        rotXAngle = Math.sin(time * 0.1) * 0.15 * rotDampen;
      }

      renderWarpLines(cx, cy, warpFactor, time);

      // Render strands
      strands.forEach((strand) =>
        renderStrand(strand, time, focalLength, cx, cy, rotY, rotXAngle, cameraZPos, warpFactor, maxFogDist)
      );

      // Render nodes
      nodes.forEach((node) =>
        renderWebNode(node, time, focalLength, cx, cy, rotY, rotXAngle, cameraZPos, maxFogDist)
      );

      const centerHoverScale = centerHoveredRef.current ? 1.2 : 1;
      renderCenterOrb(time, focalLength, cx, cy, rotY, rotXAngle, currentZoom, cameraZPos, warpFactor, centerHoverScale);

      renderParticles(time, focalLength, cx, cy, rotY, rotXAngle, cameraZPos, warpFactor, maxFogDist);

      // 3D spatial feature nodes (same pattern as NeuroSketch stems)
      if (hasReachedCenterRef.current) {
        const positions: { x: number; y: number }[] = [];
        let closestIdx: number | null = null;
        let closestScreenDist = Infinity;

        SPATIAL_FEATURES.forEach((sf, idx) => {
          let worldPos = rotateY(sf.pos, rotY);
          worldPos = rotateX(worldPos, rotXAngle);
          const viewZ = worldPos.z - cameraZPos;
          if (viewZ < -focalLength + 50) {
            positions.push({ x: -9999, y: -9999 });
            return;
          }
          const proj = project3D({ x: worldPos.x, y: worldPos.y, z: viewZ }, focalLength, cx, cy);
          const stemX = cx + (proj.x - cx) * postGlowExpand;
          const stemY = cy + (proj.y - cy) * postGlowExpand;

          const dist3D = Math.sqrt(worldPos.x ** 2 + worldPos.y ** 2 + viewZ ** 2);
          const proximity = clamp(1 - dist3D / 250, 0, 1);
          const screenDist = Math.sqrt((stemX - cx) ** 2 + (stemY - cy) ** 2);
          if (proximity > 0.15 && screenDist < closestScreenDist) {
            closestScreenDist = screenDist;
            closestIdx = idx;
          }

          const isHot = hoveredNodeRef.current === idx || activeNodeRef.current === idx;
          const glowIntensity = Math.max(proximity, isHot ? 1 : 0);
          const baseAlpha = isHot ? 0.95 : 0.4 + proximity * 0.4 + 0.15 * Math.sin(time * 2 + idx);
          const stemFog = clamp(1 - viewZ / 900, 0.15, 1);
          const lineAlpha = baseAlpha * stemFog;

          // Gold strand from center to feature node
          const grad = ctx.createLinearGradient(cx, cy, stemX, stemY);
          grad.addColorStop(0, `rgba(212, 168, 67, ${lineAlpha * 0.3})`);
          grad.addColorStop(1, `rgba(212, 168, 67, ${lineAlpha})`);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          const cpx = (cx + stemX) / 2 + Math.sin(time + idx * 1.3) * 12;
          const cpy = (cy + stemY) / 2 + Math.cos(time + idx * 0.9) * 12;
          ctx.quadraticCurveTo(cpx, cpy, stemX, stemY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = isHot ? 3 : 1.5 + proximity;
          ctx.lineCap = "round";
          ctx.stroke();

          // Terminal bulb
          const proximityPulse = proximity > 0.25 ? 1 + 0.3 * Math.sin(time * 4 + idx * 1.5) : 1;
          const bulbRadius = (5 + glowIntensity * 8) * proximityPulse;
          const glowSpread = bulbRadius * (2.5 + proximity * 2);
          const bulbGlow = ctx.createRadialGradient(stemX, stemY, 0, stemX, stemY, glowSpread);
          bulbGlow.addColorStop(0, `rgba(212, 168, 67, ${0.5 + glowIntensity * 0.5})`);
          bulbGlow.addColorStop(0.4, `rgba(184, 146, 47, ${0.1 + glowIntensity * 0.4})`);
          bulbGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.beginPath();
          ctx.arc(stemX, stemY, glowSpread, 0, Math.PI * 2);
          ctx.fillStyle = bulbGlow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(stemX, stemY, bulbRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 220, 140, ${0.6 + glowIntensity * 0.35})`;
          ctx.fill();

          positions.push({ x: stemX, y: stemY });
        });

        if (!autoTriggered && closestIdx !== null) {
          autoTriggered = true;
          hoveredNodeRef.current = closestIdx;
          setHoveredNodeId(closestIdx);
          setActiveNode(closestIdx);
        }

        nodePositionsRef.current = positions;
        setNodePositions([...positions]);
      }

      // Gold vignette during warp (instead of white flash)
      if (warpFactor > 0.6) {
        const vigAlpha = clamp((warpFactor - 0.6) / 0.4 * 0.45, 0, 0.45);
        const vigGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
        vigGrad.addColorStop(0, `rgba(212, 168, 67, 0)`);
        vigGrad.addColorStop(1, `rgba(212, 168, 67, ${vigAlpha})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, width, height);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [nodes, strands, particles]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />

      <WebTooltip
        activeNodeId={hoveredNodeId}
        visible={hasReachedCenter}
        positions={nodePositions}
        facts={SPATIAL_FEATURES.map((sf) => sf.fact)}
        onMouseEnter={() => {
          if (hoverExitTimer.current) {
            clearTimeout(hoverExitTimer.current);
            hoverExitTimer.current = null;
          }
        }}
        onMouseLeave={() => {
          if (!hoverExitTimer.current) {
            hoverExitTimer.current = setTimeout(() => {
              hoveredNodeRef.current = null;
              setHoveredNodeId(null);
              setActiveNode(null);
              hoverExitTimer.current = null;
            }, 150);
          }
        }}
      />

      {/* Instruction hint — fades as user scrolls */}
      {!hasReachedCenter && (
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center select-none"
          style={{ opacity: Math.max(0, 1 - zoom * 2.5), transition: "opacity 0.6s ease-out" }}
        >
          <p
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Scroll to dive in · Hover nodes to explore
          </p>
        </div>
      )}
    </div>
  );
}
