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
// an abstract head centered slightly above screen middle, mockup proportions.
export function defaultAnchors(viewW: number, viewH: number): FaceAnchors {
  const box: FaceBox = {cx: viewW * 0.5, cy: viewH * 0.4, w: viewW * 0.38, h: viewW * 0.5};
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

// Ring placement relative to the face box. Two compositions, runtime-
// switchable for player adjudication (fix-01 UI hard rule):
// - 'large'  (default): ref-03 look — big discs BEHIND the person, pushed
//   outboard so visible crescents show beside the head/body; partial frame
//   bleed is canonical, but the interactive front-focus point stays on
//   screen above the shutter zone.
// - 'compact': the pre-fix foreground look — smaller dials held almost
//   entirely inside the frame (ref-02 proportions).
export const RING_COMPOSITION: {mode: 'large' | 'compact'} = {mode: 'large'};

// Screen reserves the ring geometry must respect (CSS px inside the frame).
// top: Waku chrome band + the fix-07 top pill bar; bottom: shutter zone.
// Harden calibrates against the platform shell.
export const LAYOUT_RESERVE = {top: 120, bottom: 132};

const RING_LAYOUT: Record<
  'large' | 'compact',
  Record<PartKind, {dx: number; dy: number; r: number}>
> = {
  compact: {
    nose: {dx: -0.58, dy: -0.48, r: 0.52},
    eye: {dx: 0.68, dy: 0.14, r: 0.48},
    mouth: {dx: 0.0, dy: 0.96, r: 0.48},
  },
  large: {
    nose: {dx: -0.85, dy: -0.55, r: 0.85},
    eye: {dx: 0.95, dy: 0.08, r: 0.8},
    // fix-04 #2 player correction: the mouth dial keeps its ref-02 chin
    // position — visibility comes from its LAYER (drawn in front of the
    // person), not from relocation.
    mouth: {dx: 0.0, dy: 0.96, r: 0.8},
  },
};

// Screen offset of a ring's selection-focus point from its centre.
function focusOffset(kind: PartKind, r: number): {ox: number; oy: number} {
  const {theta, squash, focus} = RING_POSE[kind];
  const lx = r * Math.cos(focus);
  const ly = r * Math.sin(focus) * squash;
  return {
    ox: lx * Math.cos(theta) - ly * Math.sin(theta),
    oy: lx * Math.sin(theta) + ly * Math.cos(theta),
  };
}

export function ringSpecs(box: FaceBox, viewW: number, viewH: number): Record<PartKind, RingSpec> {
  const out = {} as Record<PartKind, RingSpec>;
  const mode = RING_COMPOSITION.mode;
  const layout = RING_LAYOUT[mode];
  // Extreme close-ups (face filling the frame) leave no silhouette-free
  // space at normal radii — grow the discs so their arcs still clear the
  // person at the frame corners/edges (fix-04 #2 stable visible arc).
  const closeUp = Math.min(1, Math.max(0, (box.w / viewW - 0.55) / 0.3));
  const rMax = Math.min(viewW, viewH) * (mode === 'large' ? 0.42 + 0.14 * closeUp : 0.28);
  (Object.keys(layout) as PartKind[]).forEach((kind) => {
    // fix-05 #1 (player red-circle spec): the mouth dial is a frame-anchored
    // chest band — centre (50%W, 83%H), horizontal radius 42%W, top arc
    // never above the chin. Foreground layer; its own clamps.
    if (kind === 'mouth' && mode === 'large') {
      const r = viewW * 0.42;
      const sq = RING_POSE.mouth.squash;
      const chinY = box.cy + box.h / 2;
      let cy = Math.max(viewH * 0.83, chinY + r * sq + 8);
      cy = Math.min(cy, viewH - 40);
      out.mouth = {cx: viewW * 0.5, cy, r};
      return;
    }
    const l = layout[kind];
    const r = Math.max(60, Math.min(rMax, l.r * box.h));
    let cx = box.cx + l.dx * box.w;
    let cy = box.cy + l.dy * box.h;
    if (mode === 'compact') {
      // Whole dial essentially inside the frame.
      cx = Math.min(viewW - r * 0.55, Math.max(r * 0.55, cx));
      cy = Math.min(viewH - r * 0.62 - LAYOUT_RESERVE.bottom, Math.max(r * 0.55 + 16, cy));
    } else {
      // Discs may bleed off-frame (ref-03), but each ring's selection-focus
      // point stays between the top bar band and the shutter zone.
      const {ox, oy} = focusOffset(kind, r);
      cx = Math.min(viewW - 56 - ox, Math.max(56 - ox, cx));
      cy = Math.min(viewH - LAYOUT_RESERVE.bottom - oy, Math.max(LAYOUT_RESERVE.top - oy, cy));
    }
    out[kind] = {cx, cy, r};
  });
  return out;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
