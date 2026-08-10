# fix-16 — frame the picture, strip the operator chrome, kill the cheap blur

Player round, 2026-08-10. Direct edit (no pipeline thread), per the standing
post-Stage rule: edit source → build → push → `waku stage`.

## 1. The top tuning bar is gone

`src/components/TopBar.tsx` deleted. The glass pill carried HUD toggle,
overlay toggle, dice-randomize, reset-to-bare and a SAT slider — operator
chrome that added nothing to the picture and read as a debug panel sitting on
a painting. The shutter is now the only control drawn over the canvas.

Fallout cleaned rather than left dangling:

- `App.tsx` drops `hudOn` / `overlayOn` / `saturation` state and the whole
  handler block; the no-camera note moves up into the vacated inset.
- `CollageEngine.toggleHud()` / `toggleOverlay()` / `setSaturation()` deleted —
  nothing could reach them any more. `HudConfig.saturation` and the
  `applySaturation` pixel loop went with them; `showHud` survives because
  `capture()` still switches it off for the polaroid pass.
- `dressRandom()` stays: it is the auto-dress path, not a button.

## 2. A carved gilt frame around the whole mirror

`public/frame/gilt-frame.webp` (512×510, 84 KB, alpha) — a generated Rococo
moulding, chroma-keyed and despilled off a flat green plate, trimmed to its
outer silhouette. Rail thickness in the source is 195/941 of the frame.

Rendered as **CSS 9-slice**, not a stretched image: `border-image-slice: 136`
(= where the corner ornament ends, 136/512), `border-image-repeat: round`.
Corners hold their aspect at any stage size and the straight rails tile, so no
part of the carving is ever squashed. The stage is only 9:16 on wide
viewports — a phone taller than 9:16 gets a narrower stage — so the rail is
derived from the stage's own width expression, never from `vw`:

    --surgery-stage-w:    min(100vw, calc(100dvh * 9 / 16));
    --surgery-frame-rail: clamp(20px, calc(var(--surgery-stage-w) * .087), 52px);

**Backing board.** The moulding fills 106.1 of the 136 source px in a slice;
the remainder is transparent rebate, and the outer edge is scalloped. Without
a backing, ring sprites orbiting near the edge showed through the pierced
scrollwork — verified on a 390×844 capture. `#picture-frame-back` paints an
opaque `#12100c` band exactly `0.78 × rail` wide (= 106.1/136) behind the
frame. Wider reads as a black liner, narrower and the leak returns.

The frame is **screen chrome only** — a DOM overlay at z-24/25, above the
canvas, below the result overlay (z-30) and boot screen (z-40),
`pointer-events: none`. It is never drawn into the canvas, so `capture()`
cannot pick up a random slice of moulding, and the polaroid card is unchanged.

## 3. The dial melt-smears are deleted

Player call on the "cheap blur": the culprit was `Dial.drawSmears` — four
pre-blurred copies of each sprite drawn between every pair of slots at
`globalAlpha 0.32`. Read as haze floating over the backdrop, not as paint.

Gone, with `preblur()`, the `blurred` sprite array and `tangentAngle()`.
The per-part "embedded-in-glass" sheen ellipse went too, for the same reason.
The glass tube itself stays (player kept it over the stone / bronze
alternatives); its edges were tightened to carry the read on their own:
outer 0.55/1.4 → 0.6/1.6, inner 0.35/1.0 → 0.38/1.2, specular ridge 2.0 → 2.4,
veil 0.08 → 0.10, tube sheen 0.20/0.10 → 0.22/0.12.

## 4. English only, no locale layer

Standing player rule, applied retroactively here. `src/i18n.ts` deleted
(device-locale detection + `<html lang>` sync), `STR_ZH` and `CREDITS_ZH`
deleted, `CREDIT_SEP` is a plain `': '`, `CARD_FONT.credit` is Latin monospace
in all cases, and the `html[lang="zh"]` CJK font-stack block is out of
`index.css`. `tests/content.test.ts` now fails the build on any non-Latin
character in player-visible copy, so the layer cannot creep back.

## Verification

- `npm run lint` clean, `npm test` 21/21, `npm run build` clean.
- Headless capture at 390×844 @3x with a fake camera: no `#topbar` in the DOM,
  rail computes to 33px, frame asset 200, every other runtime asset 200
  (`favicon.ico` 404 is pre-existing and unrelated).
- **Not verified on a real device.** iOS Safari behaviour of
  `border-image-repeat: round` with a WebP alpha source is untested here.
