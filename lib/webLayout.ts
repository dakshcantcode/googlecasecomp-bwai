/**
 * webLayout — Force-directed layout for concept web
 * Custom O(n²) spring simulation; no d3 dependency.
 * Radial bias: foundational nodes near center, advanced at periphery.
 */

import type { ConceptNode, ConceptStrand } from "@/stores/webStore";

const REPULSION = 8000;
const ATTRACTION = 0.04;
const DAMPING = 0.85;
const CENTER_GRAVITY = 0.012;

export function tickLayout(
  nodes: ConceptNode[],
  strands: ConceptStrand[],
  cx: number,
  cy: number,
  dt = 1
): ConceptNode[] {
  const next = nodes.map((n) => ({ ...n }));

  // Repulsion between all pairs
  for (let i = 0; i < next.length; i++) {
    for (let j = i + 1; j < next.length; j++) {
      const dx = next[j].x - next[i].x;
      const dy = next[j].y - next[i].y;
      const dist2 = dx * dx + dy * dy + 0.01;
      const force = REPULSION / dist2;
      const dist = Math.sqrt(dist2);
      next[i].vx -= (force * dx) / dist;
      next[i].vy -= (force * dy) / dist;
      next[j].vx += (force * dx) / dist;
      next[j].vy += (force * dy) / dist;
    }
  }

  // Spring attraction along strands
  const nodeMap = new Map(next.map((n) => [n.id, n]));
  for (const strand of strands) {
    const a = nodeMap.get(strand.from);
    const b = nodeMap.get(strand.to);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const restLen = 120;
    const stretch = dist - restLen;
    const fx = ATTRACTION * stretch * (dx / dist);
    const fy = ATTRACTION * stretch * (dy / dist);
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Center gravity
  for (const n of next) {
    n.vx += (cx - n.x) * CENTER_GRAVITY;
    n.vy += (cy - n.y) * CENTER_GRAVITY;
    n.vx *= DAMPING;
    n.vy *= DAMPING;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
  }

  return next;
}

export function initLayout(
  nodeIds: string[],
  strands: ConceptStrand[],
  cx: number,
  cy: number
): Pick<ConceptNode, "id" | "x" | "y" | "vx" | "vy">[] {
  // Rough radial init — connected-degree heuristic for depth
  const degree = new Map<string, number>();
  for (const s of strands) {
    degree.set(s.from, (degree.get(s.from) ?? 0) + 1);
    degree.set(s.to, (degree.get(s.to) ?? 0) + 1);
  }
  const maxDeg = Math.max(...degree.values(), 1);

  return nodeIds.map((id, i) => {
    const deg = degree.get(id) ?? 1;
    const radius = 60 + ((maxDeg - deg) / maxDeg) * 280;
    const angle = (i / nodeIds.length) * Math.PI * 2 + Math.random() * 0.3;
    return {
      id,
      x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
      y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
      vx: 0,
      vy: 0,
    };
  });
}
