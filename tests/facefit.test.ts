import {strict as assert} from 'node:assert';
import test from 'node:test';
import {
  LAYOUT_RESERVE,
  SITTER,
  coverTransform,
  defaultAnchors,
  faceAnchors,
  ringSpecs,
  sitterTransform,
  videoToScreen,
  type Pt,
} from '../src/engine/facefit.ts';
import {RING_POSE} from '../src/engine/rings.ts';

test('the painted backdrop keeps a plain full-bleed cover fit', () => {
  // coverTransform and sitterTransform were one function until the sitter
  // zoom landed, and sharing it silently shrank the backdrop off full-bleed.
  const t = coverTransform(900, 1600, 390, 844);
  assert.ok(900 * t.scale >= 390 - 1e-6 && 1600 * t.scale >= 844 - 1e-6, 'fills the stage');
  assert.ok(Math.abs(t.offX * 2 + 900 * t.scale - 390) < 1e-6, 'centred on x');
  assert.ok(Math.abs(t.offY * 2 + 1600 * t.scale - 844) < 1e-6, 'centred on y');
});

test('camera rect is cover x SITTER.zoom, centred on x and pinned to the floor', () => {
  // 1280x720 video into a 390x844 portrait view: height-limited.
  const t = sitterTransform(1280, 720, 390, 844);
  assert.ok(Math.abs(720 * t.scale - 844 * SITTER.zoom) < 1e-6, 'zoomed below cover');
  assert.ok(t.offX < 0, 'sides still crop off-screen');
  // Bottom edge sits exactly on the stage floor — a centred rect would chop
  // the torso along a straight line partway up the screen.
  assert.ok(Math.abs(t.offY + 720 * t.scale - 844) < 1e-6, 'bottom-anchored');
  // Mirroring stays symmetric about the centre.
  const c = videoToScreen({x: 0.5, y: 0.5}, 1280, 720, t);
  assert.ok(Math.abs(c.x - 195) < 1e-6);
  // A landmark on the video's left lands on the screen's right (mirror).
  const l = videoToScreen({x: 0.1, y: 0.5}, 1280, 720, t);
  assert.ok(l.x > 195);
});

// Synthetic landmark cloud: enough indices for faceAnchors.
function syntheticFace(): Pt[] {
  const pts: Pt[] = Array.from({length: 478}, () => ({x: 200, y: 300}));
  pts[10] = {x: 200, y: 150}; // top
  pts[152] = {x: 200, y: 450}; // chin
  pts[234] = {x: 100, y: 300}; // left
  pts[454] = {x: 300, y: 300}; // right
  pts[33] = {x: 130, y: 250}; // subject-right eye outer (screen left here)
  pts[133] = {x: 170, y: 250};
  pts[159] = {x: 150, y: 245}; // its lids
  pts[145] = {x: 150, y: 255};
  pts[362] = {x: 230, y: 250}; // subject-left eye inner
  pts[263] = {x: 270, y: 250};
  pts[386] = {x: 250, y: 244}; // its lids
  pts[374] = {x: 250, y: 256};
  pts[168] = {x: 200, y: 260}; // nose bridge
  pts[2] = {x: 200, y: 340}; // nose bottom
  pts[61] = {x: 160, y: 390}; // mouth corners
  pts[291] = {x: 240, y: 390};
  pts[13] = {x: 200, y: 384}; // lip seam top/bottom
  pts[14] = {x: 200, y: 390};
  pts[17] = {x: 200, y: 398};
  return pts;
}

test('faceAnchors picks the screen-right eye and centers parts on the nose', () => {
  const a = faceAnchors(syntheticFace());
  assert.equal(a.eye.cx, 250, 'right-side eye chosen');
  assert.equal(a.eye.cy, 250, 'eye centred on the lid midpoint (eye slit)');
  assert.equal(a.nose.cx, 200);
  // Nose centre is biased toward the tip (below the bridge/tip midpoint) so
  // the sprite covers bridge→base, not the forehead (gate 12 / gate-02 #6).
  assert.ok(a.nose.cy > 300 && a.nose.cy < 340, `nose sits low, got ${a.nose.cy}`);
  assert.equal(a.mouth.cx, 200);
  assert.equal(a.mouth.cy, 387, 'mouth centred on the lip seam');
  assert.ok(a.mouth.w > 0 && a.eye.w > 0 && a.nose.h > 0);
  assert.equal(a.box.w, 200);
  assert.equal(a.box.h, 300);
});

// On-screen half-extents of a drawn ring: radius + glass tube, rotated by the
// pose. This is what actually has to clear the gilt moulding — clamping on r
// alone slid the tube under the frame.
const TUBE_OUTSET = 1.125;
function extent(kind: 'eye' | 'nose' | 'mouth', r: number) {
  const {theta, squash} = RING_POSE[kind];
  const rx = r * TUBE_OUTSET;
  const ry = r * squash * TUBE_OUTSET;
  return {
    hw: Math.hypot(rx * Math.cos(theta), ry * Math.sin(theta)),
    hh: Math.hypot(rx * Math.sin(theta), ry * Math.cos(theta)),
  };
}

// The regression this whole layout exists to prevent: a ring hanging off the
// side of a portrait stage. Checked on the narrowest and the widest phone
// shapes we ship to, both of which used to clip.
for (const [w, h] of [
  [390, 844],
  [360, 780],
  [430, 932],
  [412, 883],
]) {
  test(`all three dials sit entirely inside the frame opening at ${w}x${h}`, () => {
    const rings = ringSpecs(defaultAnchors(w, h).box, w, h);
    const rail = w * 0.087; // --surgery-frame-rail
    assert.equal(Object.keys(rings).length, 3);
    for (const [kind, s] of Object.entries(rings)) {
      const {hw, hh} = extent(kind as 'eye' | 'nose' | 'mouth', s.r);
      assert.ok(s.cx - hw >= rail - 0.5, `${kind} clears the left rail`);
      assert.ok(s.cx + hw <= w - rail + 0.5, `${kind} clears the right rail`);
      assert.ok(s.cy - hh >= LAYOUT_RESERVE.top - 0.5, `${kind} clears the host chrome`);
      assert.ok(s.cy + hh <= h - LAYOUT_RESERVE.bottom + 0.5, `${kind} clears the floor`);
      assert.ok(s.r > 40, `${kind} stays big enough to grab`);
    }
  });
}

test('the dials are frame-anchored — the face box cannot move them', () => {
  const near = ringSpecs({cx: 40, cy: 700, w: 320, h: 420}, 390, 844);
  const far = ringSpecs({cx: 340, cy: 90, w: 60, h: 80}, 390, 844);
  assert.deepEqual(near, far, 'ring geometry is independent of the sitter');
  // ...and they stack down the picture in reading order.
  assert.ok(near.eye.cy < near.nose.cy && near.nose.cy < near.mouth.cy);
});

test('default anchors put a small sitter low, inside the ring stack', () => {
  const a = defaultAnchors(390, 844);
  const rings = ringSpecs(a.box, 390, 844);
  assert.ok(a.box.w < 390 * 0.3, 'sitter is narrower than the dials');
  assert.ok(a.box.w * 1.6 < rings.nose.r * 2, 'dials read bigger than the sitter');
  assert.ok(a.box.cy > 844 * 0.45, 'sitter sits low, as the bottom-anchored camera puts them');
});
