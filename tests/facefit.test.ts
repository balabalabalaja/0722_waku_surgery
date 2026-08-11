import {strict as assert} from 'node:assert';
import test from 'node:test';
import {
  LAYOUT_RESERVE,
  PICTURE,
  coverTransform,
  defaultAnchors,
  faceAnchors,
  pictureRect,
  ringSpecs,
  sitterPanX,
  sitterScale,
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

test('a pan translates the camera rect and nothing else, mirroring intact', () => {
  const t = sitterTransform(1280, 720, 390, 844);
  const panned = sitterTransform(1280, 720, 390, 844, -12);
  assert.equal(panned.scale, t.scale);
  assert.equal(panned.offY, t.offY, 'vertical placement is not pannable');
  assert.ok(Math.abs(panned.offX - (t.offX - 12)) < 1e-6);
  // Mirroring stays symmetric about the picture's centre line.
  const p = pictureRect(390, 844);
  const c = videoToScreen({x: 0.5, y: 0.5}, 1280, 720, t);
  assert.ok(Math.abs(c.x - (p.x + p.w / 2)) < 1e-6);
  // A landmark on the video's left lands on the screen's right (mirror).
  const l = videoToScreen({x: 0.1, y: 0.5}, 1280, 720, t);
  assert.ok(l.x > p.x + p.w / 2);
});

// Where a face at normalized (fx, fy) actually lands, once the camera has been
// panned. Mirrored on x, same as videoToScreen.
function placed(fx: number, fy: number, vw = 1280, vh = 720, W = 390, H = 844) {
  const panX = sitterPanX(fx, vw, vh, W, H);
  const t = sitterTransform(vw, vh, W, H, panX);
  return {x: W - (t.offX + fx * vw * t.scale), y: t.offY + fy * vh * t.scale, t};
}

test('the camera rect is a window on the picture, not a container for it', () => {
  // The whole point of 2026-08-11: widening the picture must reveal MORE of the
  // player, never inflate them. So the sitter's scale must not depend on
  // PICTURE.w/h at all.
  const wide = sitterScale(1280, 720, 390, 844);
  const saved = {w: PICTURE.w, h: PICTURE.h};
  try {
    PICTURE.w = 0.95;
    PICTURE.h = 0.8;
    assert.equal(sitterScale(1280, 720, 390, 844), wide, 'sitter scale must ignore the picture');
  } finally {
    PICTURE.w = saved.w;
    PICTURE.h = saved.h;
  }
});

test("the camera's bottom edge sits exactly on the picture's bottom edge", () => {
  // This is what crops the body — the moulding, not a straight line in mid-air.
  // Three earlier attempts to fake a continuation below the cut were rejected.
  const p = pictureRect(390, 844);
  for (const fx of [0, 0.5, 1]) {
    const {t} = placed(fx, 0.5);
    assert.ok(Math.abs(t.offY + 720 * t.scale - (p.y + p.h)) < 1e-6, 'bottom pinned to the picture');
  }
});

test('panning centres the face on the picture and never exposes a bare edge', () => {
  const p = pictureRect(390, 844);
  for (let fx = 0; fx <= 1.0001; fx += 0.05) {
    const {x, t} = placed(fx, 0.5);
    // The rect must still span the picture horizontally at every extreme.
    assert.ok(t.offX <= p.x + 1e-9, `left edge exposed at fx=${fx.toFixed(2)}`);
    assert.ok(t.offX + 1280 * t.scale >= p.x + p.w - 1e-9, `right edge exposed at fx=${fx.toFixed(2)}`);
    // Within the slack the face parks dead on the picture's centre line.
    if (fx >= 0.3 && fx <= 0.7) {
      assert.ok(Math.abs(x - (p.x + p.w / 2)) < 0.5, `x off at fx=${fx.toFixed(2)}: ${x}`);
    }
  }
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

// The regression this layout exists to prevent, restated for the picture
// composition: a dial whose sprites vanish behind the picture. The sprites sit
// in two columns at cx ± r, and those columns must clear the picture's sides.
for (const [w, h] of [
  [390, 844],
  [360, 780],
  [430, 932],
  [412, 883],
]) {
  test(`every dial keeps both sprite columns clear of the picture at ${w}x${h}`, () => {
    const rings = ringSpecs(defaultAnchors(w, h).box, w, h);
    const p = pictureRect(w, h);
    assert.equal(Object.keys(rings).length, 3);
    for (const [kind, s] of Object.entries(rings)) {
      assert.ok(s.cx - s.r <= p.x + 0.5, `${kind} left column is behind the picture`);
      assert.ok(s.cx + s.r >= p.x + p.w - 0.5, `${kind} right column is behind the picture`);
      assert.ok(s.cy > LAYOUT_RESERVE.top - 0.5, `${kind} is under the host chrome`);
      assert.ok(s.cy < h - LAYOUT_RESERVE.bottom + 0.5, `${kind} is off the floor`);
      assert.ok(s.r > 40, `${kind} stays big enough to grab`);
    }
  });
}

test('the dials are frame-anchored — the face box cannot move them', () => {
  const near = ringSpecs({cx: 40, cy: 700, w: 320, h: 420}, 390, 844);
  const far = ringSpecs({cx: 340, cy: 90, w: 60, h: 80}, 390, 844);
  assert.deepEqual(near, far, 'ring geometry is independent of the sitter');
  assert.ok(near.eye.cy < near.nose.cy && near.nose.cy < near.mouth.cy);
});

test('default anchors put the faceless sitter inside the picture', () => {
  const a = defaultAnchors(390, 844);
  const p = pictureRect(390, 844);
  // The no-camera fallback must compose like the live one, or the two disagree.
  assert.equal(a.box.cx, p.x + p.w / 2);
  assert.ok(a.box.cy > p.y && a.box.cy < p.y + p.h, 'head sits inside the picture');
  assert.ok(a.box.w < p.w, 'head fits the picture');
});
