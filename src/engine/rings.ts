// Glass dial rendering, fix-01 revision (gate-feedback-01 items 1/5/9/10/11):
// - the dial reads as a COMPLETE disc: full-circle crisp tube outline and all
//   parts visible around the ring (back ones dimmed/smaller, front 2-4
//   dominant), so no "half-empty" read;
// - glass = thin-tube donut with crisp edge lines, sharp specular dashes,
//   real see-through refraction (backdrop redrawn magnified inside the tube
//   clip) and a soft OFF-CANVAS drop shadow — no grey smoke stroke on the
//   canvas (that was the "cheap" look);
// - 3D tilt with front/back: back arc parts/edges live in the under-pass so
//   the head occluder can cut them (top ring passes behind the head).
//
// 2026-08-10 player call: the oil-paint "melt" copies between slots are GONE.
// Pre-blurred sprites smeared along the ring path at low alpha read as cheap
// haze floating over the backdrop, not as paint. Everything the dial draws is
// now crisp by construction — the glass sells itself on edges and refraction,
// not on blur. The per-part white sheen ellipse went with them for the same
// reason. Do not reintroduce either.

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
// Gallery composition (2026-08-10): three plates stacked down the picture, so
// all three sit at nearly the same shallow tilt — the small opposing thetas
// keep the stack from reading as three identical stacked hoops. The squash is
// looser than the old outboard discs because these rings no longer have to
// hide behind the sitter; a rounder plate reads as a plate.
export const RING_POSE: Record<PartKind, {theta: number; squash: number; focus: number}> = {
  nose: {theta: -0.08, squash: 0.62, focus: Math.PI / 2},
  eye: {theta: 0.09, squash: 0.62, focus: Math.PI / 2},
  // fix-05 #1: selection focus on the lower-LEFT arc, clear of the centre
  // shutter, which still sits inside the bottom ring.
  mouth: {theta: 0.03, squash: 0.6, focus: Math.PI * 0.75},
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
  n: number;
  sim: DialSim = {angle: 0, velocity: 0};
  idle = true; // slow auto-rotation until first touch of this dial

  constructor(kind: PartKind, parts: HTMLCanvasElement[]) {
    this.kind = kind;
    this.parts = parts;
    this.n = parts.length;
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
    ctx.restore();
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
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(spec.cx - spec.r - tube, spec.cy - spec.r - tube, (spec.r + tube) * 2, (spec.r + tube) * 2);
      const sheen = ctx.createLinearGradient(0, spec.cy - spec.r * this.tilt.squash - tube, 0, spec.cy + spec.r * this.tilt.squash + tube);
      sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
      sheen.addColorStop(0.45, 'rgba(255,255,255,0.02)');
      sheen.addColorStop(1, 'rgba(255,255,255,0.12)');
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
    this.edgeStroke(ctx, spec, spec.r + tube, 0, Math.PI * 2, 0.6, 1.6);
    this.edgeStroke(ctx, spec, Math.max(1, spec.r - tube), 0, Math.PI * 2, 0.38, 1.2);
    // Back-arc specular ridge (light upper-left) — occludable.
    this.edgeStroke(ctx, spec, spec.r + tube, -Math.PI * 0.86, -Math.PI * 0.3, 0.95, 2.4);

    // Back parts (behind the head for the occluded ring).
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

    const {front} = this.slotsByDepth(spec);
    for (const s of front) this.drawPart(ctx, spec, s.i, s.pos, now);
  }
}
