/**
 * Co-Synapse — 3D Math Utilities
 * Ported from NeuroSketch lib/utils.ts — pure math, no domain logic.
 */

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/* ─── 3D Projection ────────────────────────────────────────────────────── */

/** Project a 3D point onto a 2D plane using perspective division. */
export function project3D(
  point: Vec3,
  focalLength: number,
  cx: number,
  cy: number
): Vec2 & { scale: number } {
  const perspective = focalLength / (focalLength + point.z);
  return {
    x: point.x * perspective + cx,
    y: point.y * perspective + cy,
    scale: perspective,
  };
}

/** Rotate a 3D point around the Y-axis. */
export function rotateY(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.z * sin,
    y: point.y,
    z: point.x * sin + point.z * cos,
  };
}

/** Rotate a 3D point around the X-axis. */
export function rotateX(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
}

/* ─── Math Helpers ─────────────────────────────────────────────────────── */

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
