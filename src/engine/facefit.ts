// Pure geometry: video→screen mapping (mirrored cover-fit) and
// landmark→anchor math for parts and rings. No canvas access here.

import type {Anchor, PartKind, RingSpec} from '../types';
import {RING_POSE} from './rings';

export interface CoverTransform {
  scale: number;
  offX: number;
  offY: number;
  viewW: number;
  viewH: number;
}

// Plain cover fit, centred. This is the PAINTED ROOM's transform — the
// backdrop must stay full-bleed no matter what the sitter does.
export function coverTransform(
  videoW: number,
  videoH: number,
  viewW: number,
  viewH: number,
): CoverTransform {
  const scale = Math.max(viewW / videoW, viewH / videoH);
  return {
    scale,
    offX: (viewW - videoW * scale) / 2,
    offY: (viewH - videoH * scale) / 2,
    viewW,
    viewH,
  };
}

// The sitter is deliberately SMALL (player call 2026-08-10). The composition
// only works when the dials read bigger than the person — the reference has a
// disc-to-sitter width ratio around 1.7:1, while a full-bleed cover camera put
// the person at 0.95:1, which is why two of the three rings could never fit on
// screen no matter how they were posed.
//
// `zoom` is the single knob. Everything that places the sitter — the video
// draw, the segmentation mask and all 468 landmarks (and so the part windows
// anchored to them) — goes through sitterTransform, so nothing can drift out
// of register when this changes. Safe range ~0.45–0.80.
export const SITTER = {
  zoom: 0.58,
  // Bounded float (player call 2026-08-10). Pinned dead to the floor, the
  // camera rect is `zoom` of the stage tall, so the face could never rise
  // above 42% of the screen no matter how the player moved. The rect may now
  // lift off the floor by up to `floatMax`, which buys the face roughly the
  // top 72% of the stage. It is a BOUND, not a free float: everything the
  // rect uncovers at the bottom has to be faked back in (see
  // CollageEngine.drawPersonCutout), and the further it lifts the more of the
  // torso is invention rather than camera.
  floatMax: 120,
  // Lift ramps in only once the face is above this normalized height in the
  // video frame — a player framed mid-shot gets the plain pinned rect.
  liftFrom: 0.45,
  // Exponential ease per second. The rect must never twitch: the whole sitter
  // and every landmark ride on it.
  liftEase: 5,
};

// Target lift for a face at normalized height `faceNormY` (0 = top of frame).
// Monotonic with the player's head: raising the head always raises the face on
// screen, just with extra gain in the upper half.
export function sitterLift(faceNormY: number): number {
  const t = (SITTER.liftFrom - faceNormY) / SITTER.liftFrom;
  return SITTER.floatMax * Math.min(1, Math.max(0, t));
}

// Camera rect: cover x zoom, centred horizontally, sitting `lift` above the
// stage floor. Keep this SEPARATE from coverTransform — they were one function
// until the zoom landed, and sharing it silently shrank the painted backdrop.
export function sitterTransform(
  videoW: number,
  videoH: number,
  viewW: number,
  viewH: number,
  lift = 0,
): CoverTransform {
  const scale = Math.max(viewW / videoW, viewH / videoH) * SITTER.zoom;
  return {
    scale,
    offX: (viewW - videoW * scale) / 2,
    // Floor-anchored by default. A rect scaled below cover and merely centred
    // would end partway up the stage and chop the segmented torso off along a
    // dead straight horizontal line.
    offY: viewH - videoH * scale - lift,
    viewW,
    viewH,
  };
}

export interface Pt {
  x: number;
  y: number;
}

// Landmarks are normalized [0..1] in video space; the video is drawn mirrored.
export function videoToScreen(lm: Pt, videoW: number, videoH: number, t: CoverTransform): Pt {
  const sx = t.offX + lm.x * videoW * t.scale;
  const sy = t.offY + lm.y * videoH * t.scale;
  return {x: t.viewW - sx, y: sy};
}

export interface FaceBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface FaceAnchors {
  box: FaceBox;
  eye: Anchor; // the screen-right eye (single right-eye sprites, per spec)
  nose: Anchor;
  mouth: Anchor;
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt): Pt => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});

// Sprite aspect ratios (native pixel sizes from the asset pack).
export const PART_ASPECT: Record<PartKind, number> = {
  eye: 149 / 341,
  nose: 540 / 310,
  mouth: 188 / 430,
};

// Display size factors relative to the landmark-derived anatomical extent.
const EYE_W_FACTOR = 2.0;
const NOSE_H_FACTOR = 1.5;
const MOUTH_W_FACTOR = 1.6;
// Nose anchor sits well toward the tip so the sprite covers bridge→base
// (gate-02 #6: the gold patch sat high and missed the real nose).
const NOSE_TIP_BIAS = 0.72;

// MediaPipe FaceLandmarker indices.
const IDX = {
  eyeROuter: 33,
  eyeRInner: 133,
  eyeRUpper: 159,
  eyeRLower: 145,
  eyeLInner: 362,
  eyeLOuter: 263,
  eyeLUpper: 386,
  eyeLLower: 374,
  noseBridge: 168,
  noseBottom: 2,
  mouthL: 61,
  mouthR: 291,
  lipTop: 13,
  lipLow: 14,
  faceTop: 10,
  chin: 152,
  faceL: 234,
  faceR: 454,
};

// pts: all 468 landmarks already mapped to screen space.
export function faceAnchors(pts: Pt[]): FaceAnchors {
  const top = pts[IDX.faceTop];
  const chin = pts[IDX.chin];
  const left = pts[IDX.faceL];
  const right = pts[IDX.faceR];
  const box: FaceBox = {
    cx: (left.x + right.x) / 2,
    cy: (top.y + chin.y) / 2,
    w: Math.abs(right.x - left.x),
    h: Math.abs(chin.y - top.y),
  };

  // Two candidate eyes; keep the one on the screen-right side. Horizontal
  // centre from the corners, vertical centre from the lids — the window must
  // sit on the eye slit, not ride up onto the brow (gate-02 #6).
  const eyeA = {
    c: {x: mid(pts[IDX.eyeROuter], pts[IDX.eyeRInner]).x, y: mid(pts[IDX.eyeRUpper], pts[IDX.eyeRLower]).y},
    w: dist(pts[IDX.eyeROuter], pts[IDX.eyeRInner]),
  };
  const eyeB = {
    c: {x: mid(pts[IDX.eyeLOuter], pts[IDX.eyeLInner]).x, y: mid(pts[IDX.eyeLUpper], pts[IDX.eyeLLower]).y},
    w: dist(pts[IDX.eyeLOuter], pts[IDX.eyeLInner]),
  };
  const eye = eyeA.c.x >= eyeB.c.x ? eyeA : eyeB;
  const eyeW = eye.w * EYE_W_FACTOR;

  const bridge = pts[IDX.noseBridge];
  const tip = pts[IDX.noseBottom];
  const noseC = {
    x: bridge.x + (tip.x - bridge.x) * NOSE_TIP_BIAS,
    y: bridge.y + (tip.y - bridge.y) * NOSE_TIP_BIAS,
  };
  const noseH = dist(bridge, tip) * NOSE_H_FACTOR;

  // Mouth window centres on the lip seam (gate-02 #6).
  const mouthC = {
    x: mid(pts[IDX.mouthL], pts[IDX.mouthR]).x,
    y: mid(pts[IDX.lipTop], pts[IDX.lipLow]).y,
  };
  const mouthW = dist(pts[IDX.mouthL], pts[IDX.mouthR]) * MOUTH_W_FACTOR;

  return {
    box,
    eye: {cx: eye.c.x, cy: eye.c.y, w: eyeW, h: eyeW * PART_ASPECT.eye},
    nose: {cx: noseC.x, cy: noseC.y, w: noseH / PART_ASPECT.nose, h: noseH},
    mouth: {cx: mouthC.x, cy: mouthC.y, w: mouthW, h: mouthW * PART_ASPECT.mouth},
  };
}

// Default anchors when no face is available (ready-without-face / fallback):
// an abstract head, sized and placed to match where a real sitter lands under
// SITTER.zoom — low and small, inside the ring stack.
export function defaultAnchors(viewW: number, viewH: number): FaceAnchors {
  const box: FaceBox = {cx: viewW * 0.5, cy: viewH * 0.57, w: viewW * 0.23, h: viewW * 0.3};
  const eyeW = box.w * 0.44;
  const noseH = box.h * 0.4;
  const mouthW = box.w * 0.44;
  return {
    box,
    eye: {cx: box.cx + box.w * 0.23, cy: box.cy - box.h * 0.12, w: eyeW, h: eyeW * PART_ASPECT.eye},
    nose: {cx: box.cx, cy: box.cy + box.h * 0.11, w: noseH / PART_ASPECT.nose, h: noseH},
    mouth: {cx: box.cx, cy: box.cy + box.h * 0.4, w: mouthW, h: mouthW * PART_ASPECT.mouth},
  };
}

// Ring placement, 'gallery' composition (player call 2026-08-10, reference:
// three complete plates stacked down the picture, each one bigger than the
// sitter).
//
// The dials are now FRAME-ANCHORED — their geometry does not track the face at
// all. That is the whole fix. Face-relative placement is what pushed the nose
// and eye rings half off-screen: a ring wide enough to be worth spinning is
// already ~85% of a phone's width, so any `dx` offset from the face threw it
// past an edge, and the tall axis of a portrait stage went unused. Hung off the
// frame opening instead, all three read as complete circles on every phone and
// the sitter simply moves around inside them.
export const RING_COMPOSITION: {mode: 'gallery'} = {mode: 'gallery'};

// Screen reserves the ring geometry must respect (CSS px inside the frame):
// the Waku host nav band plus the gilt rail at the top, the rail at the floor.
// The old top value also reserved the fix-07 tuning pill, which is gone.
export const LAYOUT_RESERVE = {top: 96, bottom: 40};

// Gilt rail as a fraction of stage width — must stay in step with
// --surgery-frame-rail in index.css, or rings will slide under the moulding.
const FRAME_RAIL = 0.087;
// Ring diameter (tube included) against the frame opening. Below 1 on purpose:
// the slack is what buys the lateral stagger that keeps the stack from reading
// like three identical stacked hoops.
const RING_FILL = 0.88;
// Tube half-thickness as a fraction of r (Dial's TUBE_R) — the drawn ring is
// r * (1 + TUBE_R) across, and clamping on r alone slides the glass edge under
// the frame.
const TUBE_OUTSET = 1.125;

// Row positions as fractions of the stage. cx is clamped against the opening,
// so these are intents, not promises.
const GALLERY_ROWS: Record<PartKind, {cx: number; cy: number}> = {
  eye: {cx: 0.455, cy: 0.255},
  nose: {cx: 0.545, cy: 0.5},
  mouth: {cx: 0.472, cy: 0.775},
};

// On-screen half-extents of a ring, tube included and rotation accounted for.
function ringExtent(kind: PartKind, r: number): {hw: number; hh: number} {
  const {theta, squash} = RING_POSE[kind];
  const rx = r * TUBE_OUTSET;
  const ry = r * squash * TUBE_OUTSET;
  const cos = Math.abs(Math.cos(theta));
  const sin = Math.abs(Math.sin(theta));
  return {
    hw: Math.hypot(rx * cos, ry * sin),
    hh: Math.hypot(rx * sin, ry * cos),
  };
}

export function ringSpecs(box: FaceBox, viewW: number, viewH: number): Record<PartKind, RingSpec> {
  void box; // frame-anchored by design — see the note above
  const rail = viewW * FRAME_RAIL;
  const opening = viewW - rail * 2;
  const r = Math.max(48, ((opening / 2) * RING_FILL) / TUBE_OUTSET);
  const out = {} as Record<PartKind, RingSpec>;
  (Object.keys(GALLERY_ROWS) as PartKind[]).forEach((kind) => {
    const row = GALLERY_ROWS[kind];
    const {hw, hh} = ringExtent(kind, r);
    const loX = rail + hw;
    const hiX = viewW - rail - hw;
    const loY = Math.max(LAYOUT_RESERVE.top, rail) + hh;
    const hiY = viewH - Math.max(LAYOUT_RESERVE.bottom, rail) - hh;
    const clamp = (v: number, lo: number, hi: number) =>
      lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
    out[kind] = {
      cx: clamp(viewW * row.cx, loX, hiX),
      cy: clamp(viewH * row.cy, loY, hiY),
      r,
    };
  });
  return out;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
