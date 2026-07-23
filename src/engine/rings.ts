// Glass dial rendering, fix-01 revision (gate-feedback-01 items 1/5/9/10/11):
// - the dial reads as a COMPLETE disc: full-circle crisp tube outline and all
//   parts visible around the ring (back ones dimmed/smaller, front 2-4
//   dominant), so no "half-empty" read;
// - glass = thin-tube donut with crisp edge lines, sharp specular dashes,
//   real see-through refraction (backdrop redrawn magnified inside the tube
//   clip) and a soft OFF-CANVAS drop shadow — no grey smoke stroke on the
//   canvas (that was the "cheap" look);
// - 3D tilt with front/back: back arc parts/edges live in the under-pass so
//   the head occluder can cut them (top ring passes behind the head);
// - oil-paint feel only in the part-to-part melt copies along the ring path.

import type {PartKind, RingSpec} from '../types';
import {angleForSlot, selectedIndex, slotAngle, stepDial, type DialSim} from './dialmath';

// Part display size on the ring relative to ring radius (mockup ratios).
const RING_PART: Record<PartKind, {w: number; h: number}> = {
  nose: {w: 0.376, h: 0.655},
  eye: {w: 0.582, h: 0.254},
  mouth: {w: 0.571, h: 0.25},
};

// Per-ring 3D pose: ellipse-axis rotation, vertical squash (tilt), and the
// selection-focus angle (front-bottom for all three; the mouth dial is a
// FOREGROUND ring since the fix-04 player correction, so its bottom arc is
// always visible at the chin).
export const RING_POSE: Record<PartKind, {theta: number; squash: number; focus: number}> = {
  nose: {theta: -0.22, squash: 0.52, focus: Math.PI / 2},
  eye: {theta: 0.16, squash: 0.58, focus: Math.PI / 2},
  // fix-05 #1: flat horizontal band at the chest (player's red-circle spec);
  // selection focus on the lower-LEFT arc, clear of the centre shutter.
  mouth: {theta: 0, squash: 0.46, focus: Math.PI * 0.75},
};

const TUBE_R = 0.125; // tube radius / ring radius — thin bore
const BACK_CUT = 0.08; // depth threshold splitting under/over passes

// Perspective brightness. gate-02 #3: no translucency on the ring parts —
// near-solid everywhere (floor 0.95); depth reads via size + the glass edge
// highlights, not alpha. `floor` stays runtime-tweakable.
export const RING_STYLE = {floor: 0.95};
export const depthBrightness = (depth: number) =>
  RING_STYLE.floor + (1 - RING_STYLE.floor) * Math.min(1, Math.max(0, (depth + 0.25) / 0.85));

export class Dial {
  kind: PartKind;
  parts: HTMLCanvasElement[];
  private blurred: HTMLCanvasElement[]; // pre-blurred smear sprites
  n: number;
  sim: DialSim = {angle: 0, velocity: 0};
  idle = true; // slow auto-rotation until first touch of this dial

  constructor(kind: PartKind, parts: HTMLCanvasElement[]) {
    this.kind = kind;
    this.parts = parts;
    this.n = parts.length;
    this.blurred = parts.map((p, i) => preblur(p, ((i * 53) % 17) - 8));
  }

  get selected(): number {
    return selectedIndex(this.sim.angle, this.n, this.tilt.focus);
  }

  get tilt() {
    return RING_POSE[this.kind];
  }

  partSize(r: number): {w: number; h: number} {
    return {w: RING_PART[this.kind].w * r, h: RING_PART[this.kind].h * r};
  }

  bandWidth(r: number): number {
    const p = this.partSize(r);
    return Math.max(p.w, p.h);
  }

  step(dt: number) {
    if (this.idle && Math.abs(this.sim.velocity) < 0.05) {
      this.sim.angle += 0.22 * dt;
    } else {
      this.sim = stepDial(this.sim, dt, this.n, this.tilt.focus);
    }
  }

  snapToSlot(i: number) {
    this.sim = {angle: angleForSlot(i, this.n, this.tilt.focus), velocity: 0};
  }

  worldFromLocal(spec: RingSpec, a: number, rr = spec.r): {x: number; y: number; depth: number} {
    const {theta, squash} = this.tilt;
    const lx = rr * Math.cos(a);
    const ly = rr * Math.sin(a) * squash;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return {
      x: spec.cx + lx * cos - ly * sin,
      y: spec.cy + lx * sin + ly * cos,
      depth: Math.sin(a),
    };
  }

  localAngle(spec: RingSpec, x: number, y: number): number {
    const {theta, squash} = this.tilt;
    const wx = x - spec.cx;
    const wy = y - spec.cy;
    const cos = Math.cos(-theta);
    const sin = Math.sin(-theta);
    const lx = wx * cos - wy * sin;
    const ly = (wx * sin + wy * cos) / squash;
    return Math.atan2(ly, lx);
  }

  localDist(spec: RingSpec, x: number, y: number): number {
    const {theta, squash} = this.tilt;
    const wx = x - spec.cx;
    const wy = y - spec.cy;
    const cos = Math.cos(-theta);
    const sin = Math.sin(-theta);
    const lx = wx * cos - wy * sin;
    const ly = (wx * sin + wy * cos) / squash;
    return Math.hypot(lx, ly);
  }

  hitTest(x: number, y: number, spec: RingSpec): boolean {
    const d = this.localDist(spec, x, y);
    return Math.abs(d - spec.r) < this.bandWidth(spec.r) * 0.95;
  }

  slotPos(i: number, spec: RingSpec): {x: number; y: number; depth: number} {
    return this.worldFromLocal(spec, slotAngle(i, this.n) + this.sim.angle);
  }

  private ellipsePath(ctx: CanvasRenderingContext2D, spec: RingSpec, rr: number, a0 = 0, a1 = Math.PI * 2) {
    const {theta, squash} = this.tilt;
    ctx.ellipse(spec.cx, spec.cy, rr, rr * squash, theta, a0, a1);
  }

  private tubeClip(ctx: CanvasRenderingContext2D, spec: RingSpec, tube: number) {
    ctx.beginPath();
    this.ellipsePath(ctx, spec, spec.r + tube);
    this.ellipsePath(ctx, spec, Math.max(1, spec.r - tube));
    ctx.clip('evenodd');
  }

  // Slot indices split by current depth; each list sorted back→front.
  private slotsByDepth(spec: RingSpec): {
    back: {i: number; pos: {x: number; y: number; depth: number}}[];
    front: {i: number; pos: {x: number; y: number; depth: number}}[];
  } {
    const all = Array.from({length: this.n}, (_, i) => ({i, pos: this.slotPos(i, spec)}));
    all.sort((a, b) => a.pos.depth - b.pos.depth);
    return {
      back: all.filter((s) => s.pos.depth <= BACK_CUT),
      front: all.filter((s) => s.pos.depth > BACK_CUT),
    };
  }

  private drawPart(
    ctx: CanvasRenderingContext2D,
    spec: RingSpec,
    i: number,
    pos: {x: number; y: number; depth: number},
    now: number,
  ) {
    const p = this.partSize(spec.r);
    const bright = depthBrightness(pos.depth);
    const isSel = i === this.selected;
    const scale = (0.78 + 0.3 * ((pos.depth + 1) / 2)) * (isSel ? 1.08 + 0.03 * Math.sin(now / 280) : 1);
    const jitter = (((i * 37) % 17) - 8) * (Math.PI / 180);
    const w = p.w * scale;
    const h = p.h * scale;
    ctx.save();
    ctx.globalAlpha = bright;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(jitter);
    if (isSel) {
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 18;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
    }
    ctx.drawImage(this.parts[i], -w / 2, -h / 2, w, h);
    // Embedded-in-glass sheen.
    const sheen = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    sheen.addColorStop(0, `rgba(255,255,255,${0.15 * bright})`);
    sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, `rgba(255,255,255,${0.05 * bright})`);
    ctx.shadowBlur = 0;
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Oil-paint melt copies between slots i and i+1, clipped to a depth range.
  private drawSmears(
    ctx: CanvasRenderingContext2D,
    spec: RingSpec,
    now: number,
    backPass: boolean,
  ) {
    const p = this.partSize(spec.r);
    const SMEAR_STEPS = 4;
    for (let i = 0; i < this.n; i++) {
      const a1 = slotAngle(i, this.n) + this.sim.angle;
      const a2 = slotAngle(i + 1, this.n) + this.sim.angle;
      for (let k = 1; k <= SMEAR_STEPS; k++) {
        const t = k / (SMEAR_STEPS + 1);
        const a = a1 + (a2 - a1) * t;
        const pos = this.worldFromLocal(spec, a);
        const inBack = pos.depth <= BACK_CUT;
        if (inBack !== backPass) continue;
        const bright = depthBrightness(pos.depth);
        const im = t < 0.5 ? this.blurred[i] : this.blurred[(i + 1) % this.n];
        const bell = Math.max(0, 1 - Math.abs(t - 0.5) * 1.4);
        const scale = 0.78 + 0.3 * ((pos.depth + 1) / 2);
        ctx.save();
        ctx.globalAlpha = 0.32 * bright * bell;
        ctx.translate(pos.x, pos.y);
        const tangent = this.tangentAngle(spec, a);
        ctx.rotate(tangent);
        ctx.scale(1.4 * scale, 0.72 * scale);
        ctx.drawImage(im, (-p.w * 0.95) / 2, (-p.h * 0.95) / 2, p.w * 0.95, p.h * 0.95);
        ctx.restore();
      }
    }
  }

  // Crisp tube edges over an arc range, with a dark under-shadow so white
  // lines survive bright backdrops.
  private edgeStroke(
    ctx: CanvasRenderingContext2D,
    spec: RingSpec,
    rr: number,
    a0: number,
    a1: number,
    alpha: number,
    width: number,
  ) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 3;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    this.ellipsePath(ctx, spec, rr, a0, a1);
    ctx.stroke();
    ctx.restore();
  }

  // --- pass 1: shadow + glass body + full-circle edges + BACK parts/smears.
  // The engine inserts the head occluder right after this for the top ring.
  drawUnder(ctx: CanvasRenderingContext2D, spec: RingSpec, now: number, drawRefraction: (() => void) | null) {
    const tube = spec.r * TUBE_R;

    // Soft drop shadow via the off-canvas trick: only shadow pixels land on
    // screen — no grey smoke stroke (gate item 9).
    ctx.save();
    const OFF = 4096;
    ctx.shadowColor = 'rgba(0,0,0,0.38)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = OFF + 6;
    ctx.shadowOffsetY = 14;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = tube * 2;
    ctx.beginPath();
    this.ellipsePath(ctx, {...spec, cx: spec.cx - OFF}, spec.r);
    ctx.stroke();
    ctx.restore();

    // Glass body: refracted backdrop + veil + vertical sheen inside the tube.
    if (drawRefraction) {
      ctx.save();
      this.tubeClip(ctx, spec, tube);
      drawRefraction();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(spec.cx - spec.r - tube, spec.cy - spec.r - tube, (spec.r + tube) * 2, (spec.r + tube) * 2);
      const sheen = ctx.createLinearGradient(0, spec.cy - spec.r * this.tilt.squash - tube, 0, spec.cy + spec.r * this.tilt.squash + tube);
      sheen.addColorStop(0, 'rgba(255,255,255,0.2)');
      sheen.addColorStop(0.45, 'rgba(255,255,255,0.02)');
      sheen.addColorStop(1, 'rgba(255,255,255,0.1)');
      ctx.fillStyle = sheen;
      ctx.fillRect(spec.cx - spec.r - tube, spec.cy - spec.r - tube, (spec.r + tube) * 2, (spec.r + tube) * 2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      this.ellipsePath(ctx, spec, spec.r + tube);
      this.ellipsePath(ctx, spec, Math.max(1, spec.r - tube));
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fill('evenodd');
      ctx.restore();
    }

    // Full-circle crisp edges (complete donut silhouette, gate item 1).
    this.edgeStroke(ctx, spec, spec.r + tube, 0, Math.PI * 2, 0.55, 1.4);
    this.edgeStroke(ctx, spec, Math.max(1, spec.r - tube), 0, Math.PI * 2, 0.35, 1);
    // Back-arc specular ridge (light upper-left) — occludable.
    this.edgeStroke(ctx, spec, spec.r + tube, -Math.PI * 0.86, -Math.PI * 0.3, 0.95, 2);

    // Back parts + melt (behind the head for the occluded ring).
    this.drawSmears(ctx, spec, now, true);
    const {back} = this.slotsByDepth(spec);
    for (const s of back) this.drawPart(ctx, spec, s.i, s.pos, now);
  }

  // --- pass 2: front edges + glints + FRONT smears/parts.
  drawOver(ctx: CanvasRenderingContext2D, spec: RingSpec, now: number) {
    const tube = spec.r * TUBE_R;

    // Front-arc edge re-strokes, brighter (nearest to the viewer).
    this.edgeStroke(ctx, spec, spec.r + tube, Math.PI * 0.1, Math.PI * 0.9, 0.9, 1.8);
    this.edgeStroke(ctx, spec, Math.max(1, spec.r - tube), Math.PI * 0.18, Math.PI * 0.66, 0.5, 1.2);
    // Sharp glints — short bright dashes, the "锐利高光棱线".
    this.edgeStroke(ctx, spec, spec.r + tube, Math.PI * 0.42, Math.PI * 0.5, 0.95, 3);
    this.edgeStroke(ctx, spec, spec.r + tube, Math.PI * 0.56, Math.PI * 0.585, 0.8, 2.4);

    this.drawSmears(ctx, spec, now, false);
    const {front} = this.slotsByDepth(spec);
    for (const s of front) this.drawPart(ctx, spec, s.i, s.pos, now);
  }

  private tangentAngle(spec: RingSpec, a: number): number {
    const p1 = this.worldFromLocal(spec, a - 0.02);
    const p2 = this.worldFromLocal(spec, a + 0.02);
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
}

// Pre-blur + hue-jitter a sprite at half resolution (build-time cost only).
function preblur(src: HTMLCanvasElement, hueDeg: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(src.width / 2));
  c.height = Math.max(1, Math.round(src.height / 2));
  const ctx = c.getContext('2d')!;
  ctx.filter = `blur(${Math.max(6, c.width * 0.06)}px) hue-rotate(${hueDeg}deg) saturate(112%)`;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
