# fix-17 — gallery composition: small sitter, three complete dials, sharp cutout, upright framed card

Player round, 2026-08-10 (same session as fix-16). Direct edit, no pipeline.

Player's read: "嘴巴的环显示的很完整，但是鼻子和眼睛由于竖屏构图只能显示一点点"
plus "抠图的人感觉边缘还是很虚，一虚就显得模糊，一模糊就显得廉价" and
"拍出来的照片要正着放，同时加上相框，像一幅名画… 人可以小一点".
Layout candidates A (vertical rings) / B (stacked plates) were rendered against
the real backdrop and sprites; **the player picked B**.

## 1. Why two of three dials could never fit

Measured, not guessed. On a 390x844 stage the old `rMax` capped `r` at
`0.42 x viewW ≈ 164`, so one ring was already **328px of a 390px stage** wide,
and `RING_LAYOUT.large` then pushed it out by `dx = ±0.85–0.95 x faceWidth`.
Half of it hung off the edge by construction. Meanwhile the ellipses are
squashed (0.46–0.58), so a ring stood only ~170px tall — **the 844px vertical
axis was almost entirely unused**.

Rotating the rings upright (candidate A) only half-fixes it: nose and eye are
drawn *behind* the person, and a full-bleed camera made the sitter's silhouette
~2/3 of the stage width, so the inner arc stays hidden either way.

The ratio is the real variable. In the player's reference the plates are about
**1.7x the sitter's width**; ours were **0.95x**. No pose can rescue that.

## 2. The sitter is now small — one knob, one transform

`SITTER.zoom = 0.58` (facefit.ts). Safe range ~0.45–0.80; it is a single number
because everything that places the sitter — video draw, segmentation mask, all
468 landmarks and therefore the part windows — runs through one transform.

Two traps, both hit and fixed here:

- **`coverTransform` was shared with the painted backdrop.** Adding the zoom to
  it shrank the room as well as the sitter (caught on the first render). Split
  into `coverTransform` (plain cover, backdrop) and `sitterTransform`
  (cover x zoom, camera). Guarded by a test.
- **The camera rect is bottom-anchored, not centred.** A rect scaled below
  cover and centred ends partway up the stage and chops the torso along a dead
  straight horizontal line. `offY = viewH - videoH * scale`.

## 3. Dials are frame-anchored now, not face-anchored

`RING_COMPOSITION.mode = 'gallery'`; `RING_LAYOUT`, the `closeUp` growth term
and `focusOffset` are deleted. Ring geometry no longer reads the face box at
all — `r` comes off the **frame opening**:

    r = (viewW - 2*rail)/2 * RING_FILL / TUBE_OUTSET     // rail .087, fill .88

`TUBE_OUTSET = 1.125` matters: the drawn ring is `r * (1 + TUBE_R)` across, and
clamping on `r` alone slides the glass edge under the moulding. Rows sit at
0.255 / 0.500 / 0.775 of stage height with a slight lateral stagger, each
clamped by its true rotated on-screen extent. `RING_POSE` squash loosened to
~0.62 (rounder plates) with small opposing thetas so the stack does not read as
three identical hoops.

Measured result at 390x844: `eye (177, 215) nose (213, 422) mouth (184, 654)`,
all `r = 126`, all three complete and inside the opening. Tests assert this at
four phone sizes.

`TUNING.handleHitPx` became adaptive (`face.w * 0.24`, floor 14) — at a 90px
face a flat 26px grab radius fused the three part windows into one dead zone
that also ate grabs meant for the dials.

## 4. The cutout edge

Two causes, both addressed; the first turned out to dominate.

- **Camera was 640x480.** The confidence mask returns at *camera* resolution
  (verified: 1280x720 in, 1280x720 mask), so a low-res frame blurred the person
  and the edge cutting them out. On a 3x phone the old magnification was ~5.3x;
  720p plus the sitter zoom brings it to ~1.8x.
- **Residual bilinear ramp**, removed by re-steepening alpha after the upscale
  with composite ops only (no `getImageData` on the hot path):
  `A = a²` (two draws, second `destination-in`), `B = 1-(1-A)³` (three
  `source-over` draws of A). Net S-curve `.1→.03 .3→.25 .5→.58 .7→.87 .9→.99`.
  Run at half canvas resolution; the residual 2x upscale is the antialiasing
  that keeps the edge from going jagged.

## 5. The snapshot is a painting, not a polaroid

- Tilt gone: `-rotate-1` off the result image, rotation out of `card-slide`.
- No more face-centred crop (`faceW * 2.6`). The card carries the **whole
  stage** — the three dials *are* the composition — so `composeCard(scene,
  applied)` lost its `faceBox`/`scale` arguments and the painting simply
  inherits the stage aspect.
- Same gilt moulding, 9-sliced onto the canvas (`nineSlice`, slice 136, rails
  tiled a whole number of times) around a 720px-wide painting, on a warm
  gallery wall, with the credits set as a museum label beneath.
- ⚠ The frame raster is loaded `crossOrigin='anonymous'` and warmed at boot.
  Without that, the shell's injected `<base href>` resolves it to GCS, taints
  the card canvas, and `toDataURL` throws `SecurityError` — no card at all
  (fix-14). If it never loads, the card falls back to a plain reveal.
- **No backing board on the card**, unlike the screen: the painting already
  fills the rect so nothing can leak through the pierced carving, and a plain
  backing rectangle pokes past the moulding's scalloped outer edge mid-rail and
  reads as a dark rim on a light wall (invisible on the black stage).
- `LABEL_H` 224 → 258: at 224 the wordmark collided with the third credit line.

## Verification

- `npm run lint` clean, `npm test` 26/26 (5 new layout/transform guards),
  `npm run build` clean.
- Headless 390x844 @3x with a fake camera: three complete dials measured in the
  live engine, backdrop full-bleed, card renders upright and framed with no
  `SecurityError`, 58 fps render loop.
- **Not verified on a real device, and two things are unverifiable here:** the
  fake camera has no face, so the sharpened cutout edge and the on-face collage
  at `SITTER.zoom = 0.58` have never been seen against a real person. Expect to
  tune that one number.
- Real-device performance of the extra mask blits is untested; `frameMs` only
  measures command submission, not GPU time.
