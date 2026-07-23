// CollageEngine: owns the full-bleed canvas, the rAF loop, dials, applied
// parts, HUD and input routing. React owns DOM chrome (sidebar, shutter,
// result overlay) and the top state machine.

import type {Anchor, HudConfig, PartFit, PartKind, RingSpec, Selection} from '../types';
import {
  coverTransform,
  defaultAnchors,
  faceAnchors,
  lerp,
  ringSpecs,
  videoToScreen,
  type FaceAnchors,
  type Pt,
} from './facefit';
import {angleDelta, palmAngularVelocity} from './dialmath';
import {Dial} from './rings';
import type {PartBank} from './parts';
import type {Vision} from './vision';
import {playSfx} from './audio';

const KINDS: PartKind[] = ['eye', 'nose', 'mouth'];

// Hand-feel tuning lives in one place for Harden's calibration pass.
export const TUNING = {
  faceLostHoldMs: 2000,
  anchorEase: 8,
  ringEase: 5,
  palmGain: 0.55,
  palmMaxSpeed: 8,
  palmMinSpeed: 0.25,
  palmZoneSlack: 1.3,
  dragMaxSpeed: 12,
  // Sub-step drags still advance one notch instead of springing back
  // (gate item 3 responsiveness).
  nudgeFraction: 0.22,
  nudgeSpeed: 2.4,
  flightMs: 380,
  dressStaggerMs: 130,
  scaleMin: 0.22,
  scaleMax: 1.8,
  handleHitPx: 26, // ≥44pt hit diameter; visual handles are half that (#7)
  bodyHitPad: 8,
  // fix-07 #2: exclusive margin around window handles — inside this ring
  // around a corner, the ring band never steals the pointer (dead zone
  // between handle radius and radius+margin).
  ringExclusionPx: 10,
};

// fix-03 #3 (voids the round-17 oversize=1.35 ruling): CONTAIN framing —
// the sprite renders at ~92% of the default 0.80 window, so the whole organ
// is visible with a breathing edge the moment it lands. The sprite size
// stays fixed (landmark-anchored); dragging the window bigger reveals out to
// the canvas edge, never scales the sticker (mechanic ② intact).
export const WINDOW_STYLE = {oversize: 0.8 * 0.92};

// Player final ruling (round 19): "缩小至少一半" in round 18 meant the
// corner HANDLES only — the window body stays at the round-17 uniform 0.80.
// (The fix-02 halving to 0.40 was over-execution, reverted here; halved
// handle visuals and every other fix-02 change stay.)
const WINDOW_DEFAULT: Record<PartKind, number> = {eye: 0.8, nose: 0.8, mouth: 0.8};

const defaultFits = (): Record<PartKind, PartFit> => ({
  eye: {scale: WINDOW_DEFAULT.eye, dx: 0, dy: 0},
  nose: {scale: WINDOW_DEFAULT.nose, dx: 0, dy: 0},
  mouth: {scale: WINDOW_DEFAULT.mouth, dx: 0, dy: 0},
});

interface Flight {
  kind: PartKind;
  index: number;
  from: {x: number; y: number; w: number; h: number};
  t0: number;
  soft: boolean; // idle-drift flights land quietly
}

type DragMode =
  | {type: 'none'}
  | {type: 'ring'; kind: PartKind; lastAngle: number; lastT: number; velocity: number; netDelta: number}
  | {type: 'scale'; kind: PartKind; startDist: number; startScale: number}
  | {type: 'move'; kind: PartKind; startX: number; startY: number; startDx: number; startDy: number};

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export interface EngineCallbacks {
  onFirstInteraction?: () => void;
  onFaceChange?: (visible: boolean) => void;
}

export class CollageEngine {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private vision: Vision;
  private bank: PartBank;
  private dials: Record<PartKind, Dial>;
  private raf = 0;
  private lastFrame = 0;

  private viewW = 0;
  private viewH = 0;
  private dpr = 1;

  private anchors: FaceAnchors;
  private targetAnchors: FaceAnchors;
  private rings: Record<PartKind, RingSpec>;
  private meshPts: Pt[] = [];
  private handPts: Pt[][] = [];
  private lastFaceAt = -Infinity;
  faceVisible = false;

  applied: Selection = {eye: null, nose: null, mouth: null};
  // fit = the white WINDOW (gate/fix-01 mechanic): scale/offset move the
  // viewing window; the painting itself stays anchored to the landmark.
  fits: Record<PartKind, PartFit> = defaultFits();
  hud: HudConfig = {showHud: true, showOverlay: true, saturation: 100};

  private dressed = false;
  private flights: Flight[] = [];
  private lastSel: Record<PartKind, number>;
  private drag: DragMode = {type: 'none'};
  private bracketTouchedAt: Record<PartKind, number> = {eye: -1e9, nose: -1e9, mouth: -1e9};
  private palmPrev = new Map<number, {x: number; y: number; t: number}>();
  private inputEnabled = () => true;
  private cb: EngineCallbacks;
  private firstInteractionFired = false;

  constructor(container: HTMLElement, vision: Vision, bank: PartBank, cb: EngineCallbacks = {}) {
    this.vision = vision;
    this.bank = bank;
    this.cb = cb;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    this.dials = {
      eye: new Dial('eye', bank.byKind('eye')),
      nose: new Dial('nose', bank.byKind('nose')),
      mouth: new Dial('mouth', bank.byKind('mouth')),
    };
    this.lastSel = {
      eye: this.dials.eye.selected,
      nose: this.dials.nose.selected,
      mouth: this.dials.mouth.selected,
    };

    this.resize();
    this.anchors = defaultAnchors(this.viewW, this.viewH);
    this.targetAnchors = this.anchors;
    this.rings = ringSpecs(this.anchors.box, this.viewW, this.viewH);

    this.bgImage = new Image();
    this.bgImage.onload = () => {
      this.bgReady = true;
    };
    this.bgImage.src = `${import.meta.env.BASE_URL}bg/background.webp`;

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('resize', this.resize);

    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.canvas.remove();
  }

  setInputEnabled(fn: () => boolean) {
    this.inputEnabled = fn;
  }

  setDressed(v: boolean) {
    this.dressed = v;
  }

  setSaturation(v: number) {
    this.hud.saturation = v;
    // CSS filter keeps the hot path cheap; white HUD lines are saturation-invariant.
    this.canvas.style.filter = v === 100 ? '' : `saturate(${v}%)`;
  }

  toggleHud(): boolean {
    this.hud.showHud = !this.hud.showHud;
    return this.hud.showHud;
  }

  toggleOverlay(): boolean {
    this.hud.showOverlay = !this.hud.showOverlay;
    return this.hud.showOverlay;
  }

  resetBare() {
    this.applied = {eye: null, nose: null, mouth: null};
    this.fits = defaultFits();
    this.flights = [];
  }

  dressRandom() {
    const now = performance.now();
    KINDS.forEach((kind, i) => {
      const dial = this.dials[kind];
      const idx = Math.floor(Math.random() * dial.n);
      dial.idle = false;
      dial.snapToSlot(idx);
      this.lastSel[kind] = idx;
      this.flights = this.flights.filter((f) => f.kind !== kind);
      const p = dial.partSize(this.rings[kind].r);
      const pos = dial.slotPos(idx, this.rings[kind]);
      this.flights.push({
        kind,
        index: idx,
        from: {x: pos.x, y: pos.y, w: p.w, h: p.h},
        t0: now + i * TUNING.dressStaggerMs,
        soft: false,
      });
    });
  }

  private resize = () => {
    const parent = this.canvas.parentElement!;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== this.viewW || h !== this.viewH || this.canvas.width !== Math.round(w * this.dpr)) {
      this.viewW = w;
      this.viewH = h;
      this.canvas.width = Math.round(w * this.dpr);
      this.canvas.height = Math.round(h * this.dpr);
    }
  };

  // ---------- input ----------

  // The white window rectangle (also the bracket + hit box).
  private appliedBox(kind: PartKind): {x: number; y: number; w: number; h: number} | null {
    if (this.applied[kind] === null || !this.hud.showOverlay) return null;
    const a = this.anchorFor(kind);
    const f = this.fits[kind];
    const w = a.w * f.scale;
    const h = a.h * f.scale;
    return {x: a.cx + f.dx - w / 2, y: a.cy + f.dy - h / 2, w, h};
  }

  private markInteracted() {
    if (!this.firstInteractionFired) {
      this.firstInteractionFired = true;
      this.cb.onFirstInteraction?.();
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.inputEnabled()) return;
    const {x, y} = this.toLocal(e);
    this.canvas.setPointerCapture(e.pointerId);
    this.markInteracted();

    // 1) bracket corner handles (scale) — nearest corner across ALL windows
    // wins (adjacent windows on a small face must not steal each other's
    // handles) — then window body (move), smallest containing window wins.
    let bestCorner: {kind: PartKind; d: number; cx: number; cy: number} | null = null;
    let bestBody: {kind: PartKind; area: number} | null = null;
    for (const kind of KINDS) {
      const box = this.appliedBox(kind);
      if (!box) continue;
      const corners = [
        [box.x, box.y],
        [box.x + box.w, box.y],
        [box.x, box.y + box.h],
        [box.x + box.w, box.y + box.h],
      ];
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      for (const [px, py] of corners) {
        const d = Math.hypot(x - px, y - py);
        if (d < TUNING.handleHitPx && (!bestCorner || d < bestCorner.d)) {
          bestCorner = {kind, d, cx, cy};
        }
      }
      const pad = TUNING.bodyHitPad;
      if (x > box.x - pad && x < box.x + box.w + pad && y > box.y - pad && y < box.y + box.h + pad) {
        const area = box.w * box.h;
        if (!bestBody || area < bestBody.area) bestBody = {kind, area};
      }
    }
    if (bestCorner) {
      this.bracketTouchedAt[bestCorner.kind] = performance.now();
      this.drag = {
        type: 'scale',
        kind: bestCorner.kind,
        startDist: Math.max(20, Math.hypot(x - bestCorner.cx, y - bestCorner.cy)),
        startScale: this.fits[bestCorner.kind].scale,
      };
      return;
    }
    if (bestBody) {
      this.bracketTouchedAt[bestBody.kind] = performance.now();
      this.drag = {
        type: 'move',
        kind: bestBody.kind,
        startX: x,
        startY: y,
        startDx: this.fits[bestBody.kind].dx,
        startDy: this.fits[bestBody.kind].dy,
      };
      return;
    }

    // Hard priority ordering (fix-07 #2): handles > window body > ring band.
    // A pointer near ANY handle (hit radius + exclusion margin) never falls
    // through to the ring — dead margin instead of a mis-grab.
    for (const kind of KINDS) {
      const box = this.appliedBox(kind);
      if (!box) continue;
      const corners2 = [
        [box.x, box.y],
        [box.x + box.w, box.y],
        [box.x, box.y + box.h],
        [box.x + box.w, box.y + box.h],
      ];
      const guard = TUNING.handleHitPx + TUNING.ringExclusionPx;
      if (corners2.some(([px, py]) => Math.hypot(x - px, y - py) < guard)) return;
    }

    // 2) dials — pick the ring whose band is nearest. The comparison must
    // use the same squashed-ellipse metric as hitTest (a circular distance
    // let neighbouring dials steal top-arc grabs — fix-04 forensics).
    let best: {kind: PartKind; d: number} | null = null;
    for (const kind of KINDS) {
      const spec = this.rings[kind];
      const dial = this.dials[kind];
      if (!dial.hitTest(x, y, spec)) continue;
      const d = Math.abs(dial.localDist(spec, x, y) - spec.r);
      if (!best || d < best.d) best = {kind, d};
    }
    if (best) {
      const spec = this.rings[best.kind];
      const dial = this.dials[best.kind];
      dial.idle = false;
      dial.sim.velocity = 0;
      this.drag = {
        type: 'ring',
        kind: best.kind,
        lastAngle: dial.localAngle(spec, x, y),
        lastT: performance.now(),
        velocity: 0,
        netDelta: 0,
      };
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.drag.type === 'none') return;
    const {x, y} = this.toLocal(e);
    if (this.drag.type === 'ring') {
      const spec = this.rings[this.drag.kind];
      const a = this.dials[this.drag.kind].localAngle(spec, x, y);
      const d = angleDelta(this.drag.lastAngle, a);
      const now = performance.now();
      const dt = Math.max(1, now - this.drag.lastT) / 1000;
      this.dials[this.drag.kind].sim.angle += d;
      this.drag.velocity = this.drag.velocity * 0.5 + (d / dt) * 0.5;
      this.drag.netDelta += d;
      this.drag.lastAngle = a;
      this.drag.lastT = now;
    } else if (this.drag.type === 'scale') {
      const box = this.appliedBox(this.drag.kind);
      if (!box) return;
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const dist = Math.max(20, Math.hypot(x - cx, y - cy));
      this.fits[this.drag.kind].scale = Math.min(
        TUNING.scaleMax,
        Math.max(TUNING.scaleMin, (this.drag.startScale * dist) / this.drag.startDist),
      );
      this.bracketTouchedAt[this.drag.kind] = performance.now();
    } else if (this.drag.type === 'move') {
      this.fits[this.drag.kind].dx = this.drag.startDx + (x - this.drag.startX);
      this.fits[this.drag.kind].dy = this.drag.startDy + (y - this.drag.startY);
      this.bracketTouchedAt[this.drag.kind] = performance.now();
    }
  };

  private onPointerUp = () => {
    if (this.drag.type === 'ring') {
      const dial = this.dials[this.drag.kind];
      let v = Math.max(-TUNING.dragMaxSpeed, Math.min(TUNING.dragMaxSpeed, this.drag.velocity));
      // A deliberate short drag advances one notch instead of springing back.
      const step = (Math.PI * 2) / dial.n;
      const net = this.drag.netDelta;
      if (Math.abs(v) < TUNING.nudgeSpeed && Math.abs(net) > step * TUNING.nudgeFraction) {
        v = Math.sign(net) * TUNING.nudgeSpeed;
      }
      dial.sim.velocity = v;
    }
    this.drag = {type: 'none'};
  };

  private toLocal(e: PointerEvent): Pt {
    const r = this.canvas.getBoundingClientRect();
    return {x: e.clientX - r.left, y: e.clientY - r.top};
  }

  // ---------- palm steering ----------

  private steerWithPalms(now: number) {
    if (this.handPts.length === 0) {
      this.palmPrev.clear();
      return;
    }
    this.handPts.forEach((hand, hi) => {
      if (hand.length < 18) return;
      const palm = {
        x: (hand[0].x + hand[5].x + hand[9].x + hand[13].x + hand[17].x) / 5,
        y: (hand[0].y + hand[5].y + hand[9].y + hand[13].y + hand[17].y) / 5,
      };
      const prev = this.palmPrev.get(hi);
      this.palmPrev.set(hi, {...palm, t: now});
      if (!prev) return;
      const dt = (now - prev.t) / 1000;
      if (dt <= 0 || dt > 0.25) return;
      for (const kind of KINDS) {
        if (this.drag.type === 'ring' && this.drag.kind === kind) continue;
        const spec = this.rings[kind];
        const dial = this.dials[kind];
        const dist = dial.localDist(spec, palm.x, palm.y);
        if (Math.abs(dist - spec.r) > dial.bandWidth(spec.r) * TUNING.palmZoneSlack) continue;
        const w = palmAngularVelocity(spec.cx, spec.cy, prev, palm, dt, spec.r);
        if (Math.abs(w) < TUNING.palmMinSpeed) continue;
        dial.idle = false;
        this.markInteracted();
        const v = dial.sim.velocity * 0.8 + w * TUNING.palmGain;
        dial.sim.velocity = Math.max(-TUNING.palmMaxSpeed, Math.min(TUNING.palmMaxSpeed, v));
      }
    });
  }

  // ---------- frame loop ----------

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.fpsCount++;
    if (now - this.fpsAt >= 1000) {
      this.renderFps = Math.round((this.fpsCount * 1000) / (now - this.fpsAt));
      this.fpsCount = 0;
      this.fpsAt = now;
    }
    this.resize();

    // Vision
    const res = this.vision.detect(now);
    if (res.face) {
      const t = coverTransform(this.vision.video.videoWidth, this.vision.video.videoHeight, this.viewW, this.viewH);
      const pts = res.face.map((lm) =>
        videoToScreen(lm, this.vision.video.videoWidth, this.vision.video.videoHeight, t),
      );
      this.meshPts = pts;
      this.targetAnchors = faceAnchors(pts);
      this.lastFaceAt = now;
      if (!this.faceVisible) {
        this.faceVisible = true;
        this.cb.onFaceChange?.(true);
      }
      this.handPts = res.hands.map((hand) =>
        hand.map((lm) => videoToScreen(lm, this.vision.video.videoWidth, this.vision.video.videoHeight, t)),
      );
    } else {
      this.handPts = [];
      if (now - this.lastFaceAt > TUNING.faceLostHoldMs && this.faceVisible) {
        this.faceVisible = false;
        this.meshPts = [];
        this.targetAnchors = defaultAnchors(this.viewW, this.viewH);
        this.cb.onFaceChange?.(false);
      }
    }

    // Smooth anchors + rings
    const ka = 1 - Math.exp(-TUNING.anchorEase * dt);
    this.anchors = smoothAnchors(this.anchors, this.targetAnchors, ka);
    const targetRings = ringSpecs(this.anchors.box, this.viewW, this.viewH);
    const kr = 1 - Math.exp(-TUNING.ringEase * dt);
    for (const kind of KINDS) {
      const cur = this.rings[kind];
      const tgt = targetRings[kind];
      this.rings[kind] = {
        cx: lerp(cur.cx, tgt.cx, kr),
        cy: lerp(cur.cy, tgt.cy, kr),
        r: lerp(cur.r, tgt.r, kr),
      };
    }

    this.steerWithPalms(now);

    // Dials + selection changes → flights
    for (const kind of KINDS) {
      const dial = this.dials[kind];
      dial.step(dt);
      const sel = dial.selected;
      if (sel !== this.lastSel[kind]) {
        this.lastSel[kind] = sel;
        if (this.dressed) {
          if (!dial.idle) playSfx('click', 0.55);
          const p = dial.partSize(this.rings[kind].r);
          const pos = dial.slotPos(sel, this.rings[kind]);
          this.flights = this.flights.filter((f) => f.kind !== kind);
          this.flights.push({
            kind,
            index: sel,
            from: {x: pos.x, y: pos.y, w: p.w, h: p.h},
            t0: now,
            soft: dial.idle,
          });
        }
      }
    }

    // Flights that finished
    this.flights = this.flights.filter((f) => {
      const t = (now - f.t0) / TUNING.flightMs;
      if (t >= 1) {
        this.applied[f.kind] = f.index;
        playSfx('land', f.soft ? 0.25 : 0.5);
        // Draggability affordance (#1): handles breathe after every landing.
        this.bracketTouchedAt[f.kind] = now;
        return false;
      }
      return true;
    });

    const tScene = performance.now();
    this.drawScene(this.ctx, this.dpr, now, {hud: this.hud.showHud, rings: true});
    const cost = performance.now() - tScene;
    this.frameMs = this.frameMs === 0 ? cost : this.frameMs * 0.9 + cost * 0.1;
    this.raf = requestAnimationFrame(this.loop);
  };

  private anchorFor(kind: PartKind): Anchor {
    return this.anchors[kind];
  }

  // ---------- drawing ----------

  private drawScene(
    ctx: CanvasRenderingContext2D,
    dpr: number,
    now: number,
    opts: {hud: boolean; rings: boolean},
  ) {
    const t0 = performance.now();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high'; // fix-03 #1: no cheap resampling
    ctx.clearRect(0, 0, this.viewW, this.viewH);

    // fix-06 layer order: FIXED oil painting → glass rings → segmented
    // person. The camera never paints the backdrop again (ghosting gone by
    // construction; the whole clean-plate/Kuwahara pipeline is retired).
    this.drawPaintingBackdrop(ctx);

    // Layer order (fix-04 player correction): painted background → nose/eye
    // glass rings (behind the person) → person → MOUTH ring (foreground, at
    // the chin, always visible) → windows → HUD.
    if (opts.rings) {
      for (const kind of ['nose', 'eye'] as PartKind[]) {
        const dial = this.dials[kind];
        const spec = this.rings[kind];
        const refraction = () => this.drawBackdropScaled(ctx, spec.cx, spec.cy, 1.06, now);
        dial.drawUnder(ctx, spec, now, refraction);
        dial.drawOver(ctx, spec, now);
      }
      if (this.vision.videoReady) this.drawPersonCutout(ctx);
      else this.drawFallbackSitter(ctx, now);
      const mDial = this.dials.mouth;
      const mSpec = this.rings.mouth;
      // Foreground glass refracts everything behind it: painted room + the
      // sharp person layer.
      const mRefraction = () => {
        this.drawBackdropScaled(ctx, mSpec.cx, mSpec.cy, 1.06, now);
        if (this.vision.videoReady && this.personCanvas) {
          ctx.save();
          ctx.translate(mSpec.cx, mSpec.cy);
          ctx.scale(1.06, 1.06);
          ctx.translate(-mSpec.cx, -mSpec.cy);
          ctx.drawImage(this.personCanvas, 0, 0, this.viewW, this.viewH);
          ctx.restore();
        }
      };
      mDial.drawUnder(ctx, mSpec, now, mRefraction);
      mDial.drawOver(ctx, mSpec, now);
    } else if (!this.vision.videoReady) {
      this.drawFallbackSitter(ctx, now);
    }

    // fix-01 mechanic ②: the painting shows only inside the white windows,
    // above the person.
    if (this.hud.showOverlay) {
      for (const kind of KINDS) {
        const idx = this.applied[kind];
        if (idx === null) continue;
        if (this.flights.some((f) => f.kind === kind)) continue; // in-flight replacement
        this.drawAppliedPart(ctx, kind, idx, 1);
      }
      // In-flight sprites fly toward their window, unclipped while moving.
      for (const f of this.flights) {
        const t = Math.min(1, Math.max(0, (now - f.t0) / TUNING.flightMs));
        if (t <= 0) continue;
        const e = easeOutBack(t);
        const a = this.anchorFor(f.kind);
        const fit = this.fits[f.kind];
        const tx = a.cx + fit.dx;
        const ty = a.cy + fit.dy;
        // Land into the sprite's contained footprint, not the window frame.
        const tw = a.w * WINDOW_STYLE.oversize;
        const th = a.h * WINDOW_STYLE.oversize;
        const x = lerp(f.from.x, tx, e);
        const y = lerp(f.from.y, ty, e);
        const w = lerp(f.from.w, tw, e);
        const h = lerp(f.from.h, th, e);
        const sprite = this.bank.byKind(f.kind)[f.index];
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.drawImage(sprite, x - w / 2, y - h / 2, w, h);
        ctx.restore();
      }
    }

    if (opts.hud) this.drawHud(ctx, now);
    if (opts.hud) this.drawHands(ctx);

    ctx.restore();
  }

  // Window semantics: rectangular clip at the window rect; the sprite itself
  // stays anchored to the landmark at a fixed oversize, so resizing the
  // window reveals more/less painting (never scales the sticker).
  private drawAppliedPart(ctx: CanvasRenderingContext2D, kind: PartKind, idx: number, alpha: number) {
    const box = this.appliedBox(kind);
    if (!box) return;
    const a = this.anchorFor(kind);
    const sw = a.w * WINDOW_STYLE.oversize;
    const sh = a.h * WINDOW_STYLE.oversize;
    const sprite = this.bank.byKind(kind)[idx];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.drawImage(sprite, a.cx - sw / 2, a.cy - sh / 2, sw, sh);
    ctx.restore();
  }

  private drawHud(ctx: CanvasRenderingContext2D, now: number) {
    // Face mesh dots (subset), inherited HUD language.
    if (this.meshPts.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 0; i < this.meshPts.length; i += 8) {
        const p = this.meshPts[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Brackets + corner handles around applied parts. Where two windows'
    // corners meet (uniform-0.80 ruling: nose may touch eye/mouth), the
    // touching handles render smaller so the cluster stays readable —
    // hit-testing is untouched (nearest-corner routing owns that).
    const views = KINDS.map((kind) => ({
      kind,
      box: this.appliedBox(kind),
      active: now - this.bracketTouchedAt[kind] < 2500,
    })).filter((v) => v.box !== null) as {kind: PartKind; box: NonNullable<ReturnType<CollageEngine['appliedBox']>>; active: boolean}[];
    const cornersOf = (b: {x: number; y: number; w: number; h: number}) => [
      [b.x, b.y],
      [b.x + b.w, b.y],
      [b.x, b.y + b.h],
      [b.x + b.w, b.y + b.h],
    ];
    for (const v of views) {
      const small = cornersOf(v.box).map(([px, py]) =>
        views.some(
          (o) =>
            o.kind !== v.kind &&
            cornersOf(o.box).some(([qx, qy]) => Math.hypot(px - qx, py - qy) < 18),
        ),
      );
      drawBracket(ctx, v.box.x, v.box.y, v.box.w, v.box.h, v.active, now, small);
    }
  }

  private drawHands(ctx: CanvasRenderingContext2D) {
    for (const hand of this.handPts) {
      if (hand.length < 21) continue;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(hand[a].x, hand[a].y);
        ctx.lineTo(hand[b].x, hand[b].y);
        ctx.stroke();
      }
      hand.forEach((p, idx) => {
        ctx.fillStyle = idx % 4 === 0 ? '#ffffff' : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === 0 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  private drawVideoCover(ctx: CanvasRenderingContext2D) {
    const v = this.vision.video;
    const t = coverTransform(v.videoWidth, v.videoHeight, this.viewW, this.viewH);
    ctx.save();
    ctx.translate(this.viewW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, t.offX, t.offY, v.videoWidth * t.scale, v.videoHeight * t.scale);
    ctx.restore();
  }

  // fix-06/06b: fixed oil-painting backdrop (player-repainted dawn-gradient
  // canvas with baked-in impasto texture, bundled same-origin as q88 WebP so
  // the polaroid canvas stays clean).
  private bgImage: HTMLImageElement;
  bgReady = false;
  renderFps = 0; // measured render-loop FPS (fix-05 #2 evidence)
  frameMs = 0; // EMA of drawScene cost (fix-06 perf-recovery evidence)
  private fpsCount = 0;
  private fpsAt = 0;

  // fix-06b: the backdrop is a FIXED oil painting — the player's repainted
  // dawn-gradient canvas (1290×2293 source → 900-wide q88 WebP, bundled
  // same-origin). Its baked-in impasto texture made the procedural grain
  // overlay redundant, so that pass is gone too. No per-frame pixel work.
  private drawPaintingBackdrop(ctx: CanvasRenderingContext2D) {
    if (!this.bgReady) {
      ctx.fillStyle = '#20242c';
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      return;
    }
    const iw = this.bgImage.naturalWidth;
    const ih = this.bgImage.naturalHeight;
    const t = coverTransform(iw, ih, this.viewW, this.viewH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.bgImage, t.offX, t.offY, iw * t.scale, ih * t.scale);
    ctx.restore();
  }

  // Backdrop re-drawn slightly magnified about a point — the see-through
  // refraction inside the glass tube (caller clips). Background only: the
  // person and the windows sit IN FRONT of the glass.
  private drawBackdropScaled(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, now: number) {
    void now;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
    this.drawPaintingBackdrop(ctx); // glass refracts the painting
    ctx.restore();
  }

  private personCanvas: HTMLCanvasElement | null = null;

  // fix-01 mechanic ①: the person re-drawn over the rings. Preferred source
  // is the selfie-segmentation mask; without it, a feathered head+torso blob
  // anchored to the face box (degraded but stable).
  private drawPersonCutout(ctx: CanvasRenderingContext2D) {
    const v = this.vision.video;
    if (!this.personCanvas) this.personCanvas = document.createElement('canvas');
    const pc = this.personCanvas;
    if (pc.width !== this.canvas.width || pc.height !== this.canvas.height) {
      pc.width = this.canvas.width;
      pc.height = this.canvas.height;
    }
    const pctx = pc.getContext('2d')!;
    pctx.save();
    pctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    pctx.clearRect(0, 0, this.viewW, this.viewH);
    this.drawVideoCover(pctx);
    pctx.globalCompositeOperation = 'destination-in';
    const mask = this.vision.maskCanvas;
    if (mask) {
      // The mask is aligned with the raw video frame — same mirrored cover.
      const t = coverTransform(v.videoWidth, v.videoHeight, this.viewW, this.viewH);
      pctx.translate(this.viewW, 0);
      pctx.scale(-1, 1);
      pctx.drawImage(mask, t.offX, t.offY, v.videoWidth * t.scale, v.videoHeight * t.scale);
    } else {
      const b = this.anchors.box;
      const w = b.w * 2.6;
      const h = b.h * 3.0;
      pctx.drawImage(personFallbackMask(), b.cx - w / 2, b.cy - h * 0.28, w, h);
    }
    pctx.restore();
    ctx.drawImage(pc, 0, 0, this.viewW, this.viewH);
  }

  // Abstract sitter drawn ABOVE the rings (it plays the person's layer role
  // in the no-camera world).
  private drawFallbackSitter(ctx: CanvasRenderingContext2D, now: number) {
    const b = this.anchors.box;
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(b.cx, b.cy, b.w * 0.5, b.h * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.cx - b.w * 0.18, b.cy + b.h * 0.47);
    ctx.quadraticCurveTo(b.cx - b.w * 0.5, b.cy + b.h * 0.75, b.cx - b.w * 1.0, b.cy + b.h * 1.15);
    ctx.moveTo(b.cx + b.w * 0.18, b.cy + b.h * 0.47);
    ctx.quadraticCurveTo(b.cx + b.w * 0.5, b.cy + b.h * 0.75, b.cx + b.w * 1.0, b.cy + b.h * 1.15);
    ctx.stroke();
    // Gentle breathing dot grid inside the face.
    ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.06 * Math.sin(now / 900)})`;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const th = (r / 6) * Math.PI - Math.PI / 2;
        const ph = (c / 6) * Math.PI - Math.PI / 2;
        const x = b.cx + b.w * 0.44 * Math.cos(th) * Math.sin(ph);
        const y = b.cy + b.h * 0.44 * Math.sin(th);
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Scene without HUD chrome, saturation baked in — the polaroid photo
  // source. Rings stay in shot: they are scene furniture behind the person
  // (fix-01 layering). faceBox is CSS px; scale converts to canvas pixels.
  capture(): {canvas: HTMLCanvasElement; faceBox: FaceAnchors['box']; scale: number} {
    const off = document.createElement('canvas');
    const dpr = this.dpr;
    off.width = Math.round(this.viewW * dpr);
    off.height = Math.round(this.viewH * dpr);
    const octx = off.getContext('2d')!;
    this.drawScene(octx, dpr, performance.now(), {hud: false, rings: true});
    if (this.hud.saturation !== 100) applySaturation(octx, off.width, off.height, this.hud.saturation / 100);
    return {canvas: off, faceBox: {...this.anchors.box}, scale: dpr};
  }
}

function smoothAnchors(cur: FaceAnchors, tgt: FaceAnchors, k: number): FaceAnchors {
  const sA = (a: Anchor, b: Anchor): Anchor => ({
    cx: lerp(a.cx, b.cx, k),
    cy: lerp(a.cy, b.cy, k),
    w: lerp(a.w, b.w, k),
    h: lerp(a.h, b.h, k),
  });
  return {
    box: {
      cx: lerp(cur.box.cx, tgt.box.cx, k),
      cy: lerp(cur.box.cy, tgt.box.cy, k),
      w: lerp(cur.box.w, tgt.box.w, k),
      h: lerp(cur.box.h, tgt.box.h, k),
    },
    eye: sA(cur.eye, tgt.eye),
    nose: sA(cur.nose, tgt.nose),
    mouth: sA(cur.mouth, tgt.mouth),
  };
}

// fix-09 reskin: window frames follow the player's frame.svg — a thin-line
// rectangle plus four THICK 45° diagonal ticks crossing each corner
// (SVG geometry: viewBox 1163.92×717.21, rect stroke 3, tick stroke 10,
// tick half-length ≈50.58, tick centred exactly on the rect corner along
// the corner's outward diagonal). Parameterized against the window's min
// dimension with minimum floors; hit zones (TUNING.handleHitPx + dead
// margin) are untouched — this is visuals only.
const FRAME_REF = {min: 717.21, rectStroke: 3, tickStroke: 10, tickHalf: 50.58};
// fix-11 #2: the whole frame reads 50% thinner — ref values AND minimum
// floors are scaled together so the proportions hold.
const FRAME_SCALE = 0.5;

function drawBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  active: boolean,
  now: number,
  small: boolean[] = [false, false, false, false],
) {
  const breathe = active ? 0.85 + 0.15 * Math.sin(now / 400) : 0.85;
  const minDim = Math.min(w, h);
  const s = (minDim / FRAME_REF.min) * FRAME_SCALE;
  const rectStroke = Math.max(1.2 * FRAME_SCALE, Math.min(3 * FRAME_SCALE, FRAME_REF.rectStroke * s));
  const tickStroke = Math.max(3 * FRAME_SCALE, Math.min(10 * FRAME_SCALE, FRAME_REF.tickStroke * s));
  const tickHalf = Math.max(7 * FRAME_SCALE, Math.min(50 * FRAME_SCALE, FRAME_REF.tickHalf * s));
  ctx.save();
  // fix-10 #1: pure white frame lines, no dark halo (only the window
  // frames — ring ridges / drop shadows elsewhere keep their shadows).
  ctx.strokeStyle = `rgba(255,255,255,${breathe})`;
  // Thin rectangle = the window boundary itself.
  ctx.lineWidth = rectStroke;
  ctx.strokeRect(x, y, w, h);
  // Corner ticks: 45° diagonals through each corner, along the corner's
  // outward diagonal axis (frame.svg geometry).
  const corners: [number, number, number, number][] = [
    [x, y, -1, -1],
    [x + w, y, 1, -1],
    [x, y + h, -1, 1],
    [x + w, y + h, 1, 1],
  ];
  ctx.lineWidth = tickStroke;
  ctx.lineCap = 'butt';
  corners.forEach(([px, py, ox, oy], i) => {
    const half = (small[i] ? tickHalf * 0.65 : tickHalf) * Math.SQRT1_2;
    ctx.beginPath();
    ctx.moveTo(px - ox * half, py - oy * half);
    ctx.lineTo(px + ox * half, py + oy * half);
    ctx.stroke();
  });
  ctx.restore();
}

let personMaskCache: HTMLCanvasElement | null = null;

// Feathered head + torso silhouette for the degraded person cutout (used
// only when the selfie segmenter is unavailable).
function personFallbackMask(): HTMLCanvasElement {
  if (personMaskCache) return personMaskCache;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext('2d')!;
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(128, 96, 68, 88, 0, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, 320);
  ctx.quadraticCurveTo(52, 196, 128, 178); // shoulders → torso
  ctx.quadraticCurveTo(204, 196, 218, 320);
  ctx.closePath();
  ctx.fill();
  personMaskCache = c;
  return c;
}

function easeOutBack(t: number): number {
  const c1 = 1.20158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function applySaturation(ctx: CanvasRenderingContext2D, w: number, h: number, s: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const L = 0.213 * d[i] + 0.715 * d[i + 1] + 0.072 * d[i + 2];
    d[i] = L + (d[i] - L) * s;
    d[i + 1] = L + (d[i + 1] - L) * s;
    d[i + 2] = L + (d[i + 2] - L) * s;
  }
  ctx.putImageData(img, 0, 0);
}
