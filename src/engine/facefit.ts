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

// THE PICTURE. A gilt-framed rectangle hung in the painted room; the sitter
// lives inside it and nothing else does. This is what finally settled the
// bottom of the stage: the body is cropped by the PICTURE'S OWN EDGE, which is
// what a framed portrait has always done, so nothing has to be invented down
// there. Three earlier attempts — a straight cut, a stretched torso, a torn
// edge — were all trying to answer a question this geometry never asks.
//
// It also un-blocks the dials: the sitter can no longer spill across the stage
// and hide them, because the frame contains them.
export const PICTURE = {w: 0.72, h: 0.52, cx: 0.5, cy: 0.535};

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function pictureRect(viewW: number, viewH: number): Rect {
  const w = viewW * PICTURE.w;
  const h = viewH * PICTURE.h;
  return {x: viewW * PICTURE.cx - w / 2, y: viewH * PICTURE.cy - h / 2, w, h};
}

// The sitter's size comes from the notional portrait crop the camera fills —
// deliberately NOT from the picture's size (player call 2026-08-11). The frame
// is a WINDOW, not a container: widening it must reveal more of the player
// (shoulders, ears, more room), never inflate them. Cover-fitting the camera
// into the frame would do the opposite, and did, until this was split out.
export const SITTER = {
  // 1.5x the first pass (player call: the sitter read too small). Scaling both
  // dimensions together scales the sitter exactly, and at this size the camera
  // rect finally covers the picture vertically too — under the old crop its
  // top edge sat inside the picture, so a head could never reach the upper
  // part of the frame.
  crop: {w: 0.831, h: 0.599},
  // Exponential ease per second on the horizontal centring. The rect must
  // never twitch: the sitter and every landmark ride on it.
  panEase: 5,
};

export function sitterScale(videoW: number, videoH: number, viewW: number, viewH: number): number {
  return Math.max((viewW * SITTER.crop.w) / videoW, (viewH * SITTER.crop.h) / videoH);
}

// Camera rect. Its BOTTOM edge is pinned to the picture's bottom edge, so the
// body is cut by the moulding rather than ending in mid-air; `panX` slides it
// sideways to centre the face. Keep this SEPARATE from coverTransform — they
// were one function once, and sharing it silently shrank the painted backdrop.
export function sitterTransform(
  videoW: number,
  videoH: number,
  viewW: number,
  viewH: number,
  panX = 0,
): CoverTransform {
  const scale = sitterScale(videoW, videoH, viewW, viewH);
  const p = pictureRect(viewW, viewH);
  return {
    scale,
    offX: p.x + p.w / 2 - (videoW * scale) / 2 + panX,
    offY: p.y + p.h - videoH * scale,
    viewW,
    viewH,
  };
}

// Horizontal pan that parks a face at normalized video x `fx` on the picture's
// centre line, clamped so the camera rect never stops covering the picture —
// past that a bare edge would slide in through the frame.
export function sitterPanX(
  fx: number,
  videoW: number,
  videoH: number,
  viewW: number,
  viewH: number,
): number {
  const scale = sitterScale(videoW, videoH, viewW, viewH);
  const p = pictureRect(viewW, viewH);
  const base = p.x + p.w / 2 - (videoW * scale) / 2;
  // The video is drawn mirrored: screenX = viewW - (offX + fx*videoW*scale).
  const want = viewW - (p.x + p.w / 2) - fx * videoW * scale;
  const slack = Math.max(0, (videoW * scale - p.w) / 2);
  return Math.min(slack, Math.max(-slack, want - base));
}

export interface Pt {
  x: number;
  y: number;
}

// Which slice of the camera frame a screen rectangle corresponds to, in
// normalized video coordinates, mirroring included. Used to hand the segmenter
// only the region that can actually be seen — its mask is 256x256 whatever it
// is given, so shrinking the region is the only way to buy edge resolution.
export function videoRegionFor(
  rect: Rect,
  videoW: number,
  videoH: number,
  t: CoverTransform,
  pad = 0,
): Rect {
  const sw = videoW * t.scale;
  const sh = videoH * t.scale;
  // screenX = viewW - (offX + fx*sw), so the rect's right edge is the region's
  // LEFT edge — the mirror flips the order.
  const fx0 = (t.viewW - (rect.x + rect.w) - t.offX) / sw;
  const fx1 = (t.viewW - rect.x - t.offX) / sw;
  const fy0 = (rect.y - t.offY) / sh;
  const fy1 = (rect.y + rect.h - t.offY) / sh;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const x = clamp(fx0 - pad);
  const y = clamp(fy0 - pad);
  return {x, y, w: clamp(fx1 + pad) - x, h: clamp(fy1 + pad) - y};
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
// an abstract head sized and placed like a real sitter — inside the picture,
// a little above its centre.
export function defaultAnchors(viewW: number, viewH: number): FaceAnchors {
  const p = pictureRect(viewW, viewH);
  const box: FaceBox = {
    cx: p.x + p.w / 2,
    cy: p.y + p.h * 0.46,
    w: viewW * 0.4,
    h: viewW * 0.52,
  };
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

// Ring placement, 'gallery' composition. The dials are FRAME-ANCHORED — their
// geometry does not track the face at all, which is what stopped two of the
// three from hanging off a portrait stage.
//
// Since 2026-08-11 they orbit OUTSIDE the picture rather than behind a sitter
// who could cover them. Two consequences:
//   - they may bleed past the stage edges. That is now allowed, and reads as
//     "the collage continues past the page". What must never happen is a
//     dial's sprites disappearing behind the picture;
//   - so the clamp is on the SPRITES, not the ring: the parts sit at cx ± r,
//     and those two columns have to clear the picture's left and right edges.
export const RING_COMPOSITION: {mode: 'gallery'} = {mode: 'gallery'};

// Top reserve: the Waku host nav band plus a breath. There is no outer gilt
// frame any more, so nothing else eats the edges.
export const LAYOUT_RESERVE = {top: 70, bottom: 24};

// Ring radius as a fraction of stage width. Big enough that the sprite columns
// at cx ± r fall outside the picture — that is the whole constraint.
const RING_R = 0.436;
const TUBE_OUTSET = 1.125; // drawn ring is r * this across (Dial's TUBE_R)

const GALLERY_ROWS: Record<PartKind, {cx: number; cy: number}> = {
  eye: {cx: 0.454, cy: 0.26},
  nose: {cx: 0.526, cy: 0.5},
  mouth: {cx: 0.477, cy: 0.8},
};

// On-screen half-extents of a drawn ring, tube included and rotation applied.
function ringExtent(kind: PartKind, r: number): {hw: number; hh: number} {
  const {theta, squash} = RING_POSE[kind];
  const rx = r * TUBE_OUTSET;
  const ry = r * squash * TUBE_OUTSET;
  const cos = Math.abs(Math.cos(theta));
  const sin = Math.abs(Math.sin(theta));
  return {hw: Math.hypot(rx * cos, ry * sin), hh: Math.hypot(rx * sin, ry * cos)};
}

export function ringSpecs(box: FaceBox, viewW: number, viewH: number): Record<PartKind, RingSpec> {
  void box; // frame-anchored by design — see the note above
  const r = Math.max(48, viewW * RING_R);
  const pic = pictureRect(viewW, viewH);
  const out = {} as Record<PartKind, RingSpec>;
  (Object.keys(GALLERY_ROWS) as PartKind[]).forEach((kind) => {
    const row = GALLERY_ROWS[kind];
    const {hh} = ringExtent(kind, r);
    // Keep BOTH sprite columns clear of the picture. Left column at cx - r
    // must finish left of the picture; right column at cx + r must start right
    // of it. A sprite is about half its own width past that, but the columns
    // are what读 as the dial, so clamping the centres is enough.
    const loX = pic.x + pic.w - r;
    const hiX = pic.x + r;
    const clamp = (v: number, lo: number, hi: number) =>
      lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
    const cy = clamp(
      viewH * row.cy,
      Math.max(LAYOUT_RESERVE.top + hh, hh * 0.35),
      viewH - LAYOUT_RESERVE.bottom - hh * 0.35,
    );
    out[kind] = {cx: clamp(viewW * row.cx, loX, hiX), cy, r};
  });
  return out;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
