import {strict as assert} from 'node:assert';
import test from 'node:test';
import {
  coverTransform,
  defaultAnchors,
  faceAnchors,
  ringSpecs,
  videoToScreen,
  type Pt,
} from '../src/engine/facefit.ts';

test('cover transform fills the viewport and mirrors x', () => {
  // 640x480 video into a 390x844 portrait view: height-limited.
  const t = coverTransform(640, 480, 390, 844);
  assert.ok(Math.abs(480 * t.scale - 844) < 1e-6);
  assert.ok(t.offX < 0, 'sides crop off-screen');
  // A landmark at video center maps to view center x (mirroring is symmetric).
  const c = videoToScreen({x: 0.5, y: 0.5}, 640, 480, t);
  assert.ok(Math.abs(c.x - 195) < 1e-6);
  assert.ok(Math.abs(c.y - 422) < 1e-6);
  // A landmark on the video's left lands on the screen's right (mirror).
  const l = videoToScreen({x: 0.1, y: 0.5}, 640, 480, t);
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

test('ring specs follow the layout sides and stay reachable on screen', () => {
  const a = faceAnchors(syntheticFace());
  const rings = ringSpecs(a.box, 390, 844);
  assert.ok(rings.nose.cx < a.box.cx, 'nose dial upper-left');
  assert.ok(rings.nose.cy < a.box.cy);
  assert.ok(rings.eye.cx > a.box.cx, 'eye dial right side');
  assert.ok(rings.mouth.cy > a.box.cy, 'mouth dial at the chin (fix-04b foreground ring)');
  for (const r of Object.values(rings)) {
    assert.ok(r.cy > 0 && r.cy < 844);
  }
});

test('default anchors exist without a face and rings stay on screen', () => {
  const a = defaultAnchors(390, 844);
  const rings = ringSpecs(a.box, 390, 844);
  for (const r of Object.values(rings)) {
    assert.ok(r.cx > -r.r && r.cx < 390 + r.r);
    assert.ok(r.cy > 0 && r.cy < 844);
  }
});
