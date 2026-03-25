/**
 * Spider cursor physics — spring snap-back and silk bezier helpers
 */

export interface Vec2 { x: number; y: number; }

export interface SpringState {
  pos: Vec2;
  vel: Vec2;
}

/** Run one spring physics tick toward target. */
export function springTick(
  state: SpringState,
  target: Vec2,
  stiffness = 300,
  damping = 15,
  dt = 1 / 60
): SpringState {
  const dx = target.x - state.pos.x;
  const dy = target.y - state.pos.y;
  const ax = dx * stiffness - state.vel.x * damping;
  const ay = dy * stiffness - state.vel.y * damping;
  const vx = state.vel.x + ax * dt;
  const vy = state.vel.y + ay * dt;
  return {
    pos: { x: state.pos.x + vx * dt, y: state.pos.y + vy * dt },
    vel: { x: vx, y: vy },
  };
}

/** Lerp a vec2 toward target at given rate. */
export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Distance between two vec2s. */
export function dist2(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Midpoint. */
export function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
