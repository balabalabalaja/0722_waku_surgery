# fix-20 — the face is parked on the stage anchor

Player round, 2026-08-10. Direct edit, no pipeline.

> 我觉得人脸应该居中 这样眼睛鼻子嘴的环还能大概在对的位置（对应眼睛鼻子嘴）

This supersedes fix-19's bounded float. The float gave the face *freedom*; what
the composition actually needed was the opposite — the face **parked**, so the
three dials keep a fixed anatomical relationship to it. Left free, the sitter
drifted to the bottom of the stage (see the player's screenshot: face at ~82%
of stage height, half out of frame) and the eye/nose/mouth correspondence read
as noise.

## What changed

`SITTER.anchorX/anchorY = 0.5, 0.5` — the camera rect is panned every frame so
the **face box centre lands on the stage anchor**, which is also the middle
dial's own centre. Result: eyes above, nose around, mouth below, every time,
regardless of how the player holds the phone.

`sitterLift` is replaced by `sitterPan(fx, fy, …) -> {dx, dy}`, clamped twice:

- **x** — never past the point where the camera rect would stop covering the
  stage, so no bare rect edge can slide into frame. Slack is about ±0.28 of
  the video width; beyond that the face parks as close as it can.
- **y** — never lifts more than `SITTER.maxLift = 230` off the floor. Sinking
  *below* the floor is unbounded and free: it uncovers nothing.

`maxLift` is really a stretch budget, not a distance. Every pixel of lift is a
pixel of torso `extendTorso` has to invent. 230 parks any face framed down to
~0.61 of the video height exactly and holds the worst normal-case stretch near
2x; past that the face sits a little low, which also nudges the player to raise
the phone.

`defaultAnchors` moved to the same anchor, so the no-camera fallback composes
like the live one instead of disagreeing with it.

## The bug this would have shipped with

`extendTorso` sizes its source band off the gap. Parking a low-framed face
lifts the rect far enough that a gap-proportional band reaches **up past the
chin** — stamping a second jaw down the player's chest. The band is now capped
at the chin (`rectBottom - chin - 8`), so it can only ever be torso.

## The limits, stated

Exact anatomical alignment is impossible at this sitter size and is not what
this does. The dials sit ~207 and ~232 px apart; a parked face's eye-to-mouth
span is ~35–70 px. The face would have to be about 3x bigger — i.e. full-bleed,
the layout fix-17 replaced — for the features to actually line up with the
rings. What the anchor buys is **correct ordering with the face in the middle
dial**, which is what "大概在对的位置" can mean here.

## Verification

- `npm run lint` clean, `npm test` 28/28, `npm run build` clean.
- New tests pin: exact parking across normal framing (fy 0.25–0.58, fx
  0.3–0.7); the lift cap binding cleanly with a bounded, below-anchor residual
  for chin-up framing; and that no pan at any face position exposes a bare rect
  edge.
- **Not verified against a real person.** The headless fake camera has no face,
  so the pan never leaves zero — the parking, the torso stretch at a real 230px
  lift, and whether the ease (`panEase = 5`) feels stable rather than swimmy
  when the player moves, are all first-look-on-device items.
