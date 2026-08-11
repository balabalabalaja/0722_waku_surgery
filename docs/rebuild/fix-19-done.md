# fix-19 — palm steering deleted, camera rect gets a bounded float

Player round, 2026-08-10. Direct edit, no pipeline.

Two player reports, one root cause: with the sitter shrunk to `SITTER.zoom`
and the camera rect pinned to the stage floor, the rect only covers the bottom
58% of the stage. Everything that lives in camera space is trapped in that
band.

## 1. "我现在没有办法控制眼睛的那个环"

Verified before changing anything, because two input paths could have been at
fault and only one was.

**Touch drag is fine on all three dials** — driven headless against the live
engine:

    eye:   grab (51,215)   angle 0.628 -> 0.033   SPUN
    nose:  grab (87,422)  angle -0.785 -> -1.595  SPUN
    mouth: grab (58,654)   angle 3.142 -> 2.547   SPUN

**Palm steering could never reach the eye dial.** Hand landmarks ride the same
transform as the sitter, so a hand can only ever land in `y ∈ [354, 844]`,
while the eye ring's lowest point is `y ≈ 293`. Zero overlap — unreachable by
construction, not by tuning. The nose ring only exposed its lower arc; only
the mouth ring was fully steerable.

There is no fix that keeps both the gesture and the composition. Widening the
hand's transform to cover the stage decouples it from the hand the player can
see in their own cutout, so the spin would happen somewhere they are not
pointing. Making the rect cover the stage means a full-bleed sitter, which is
the layout we just replaced.

**So palm steering is gone**, and `HandLandmarker` with it: `steerWithPalms`,
`drawHands`, `HAND_CONNECTIONS`, `handPts`, `palmPrev`, the four `TUNING.palm*`
values, `VisionResult.hands`, `dialmath.palmAngularVelocity` and its test. A
channel that worked on one dial of three was actively misleading — the player
hit exactly that. Side benefits: one less MediaPipe model to download and
initialise, no second inference every other frame, and the white hand skeleton
stops fighting the painting.

## 2. "人脸只能在屏幕的下半部分"

Correct, and the same geometry. `rect height = viewH × zoom`, floor-pinned, so
the face ceiling sat at `844 × (1 − 0.58) = 354` — 42% of the screen.

The obvious lever is wrong: reaching the top 20% needs `zoom ≥ 0.8`, and at
the distance in the player's screenshot their head already spans about half
the stage width, so 0.8 would bury the dials behind their shoulders and undo
fix-17.

**Bounded float instead.** The rect may lift off the floor by up to
`SITTER.floatMax = 120`, ramping in only as the player raises their head
(`sitterLift`, zero at or below `liftFrom = 0.45` of frame height, full at the
top), eased at `liftEase` so the rect never twitches — the whole sitter and
every landmark ride on it. Reachable band becomes roughly the top 72%.

Two properties the tests pin down, because both are easy to break:

- **Monotonic.** The lift adds gain in the upper half; if it ever overtook the
  rect's own mapping, raising your head would push the face back *down*.
- **The lift is resolved before landmarks are mapped**, so the sitter and every
  anchor use the same rect within a frame.

**The torso continuation is what makes the float legal.** A lifted rect ends
above the floor and the segmented body would stop dead on that straight edge.
`extendTorso` takes the band of person just above the rect bottom and stretches
it to the floor, with the source band sized proportionally to the gap so the
stretch factor stays near 1.4 — a thin strip hauled over 120px is exactly the
vertical smear this whole round has been deleting. The silhouette edges run
near-vertical down there, so stretching continues the outline rather than
inventing one. If the body does not reach the rect bottom the band is
transparent and nothing is drawn, which is correct.

Sanity check on the stretch: the player's own torso band from their screenshot,
stretched 1.4x, keeps its shoulder line, shirt edge and arm intact with no
visible smear.

## Verification

- `npm run lint` clean, `npm test` 26/26, `npm run build` clean.
- Touch-drag spin verified on all three dials against the live engine.
- **The float itself is NOT verified against a real person.** The headless fake
  camera has no face, so `sitterLift` never leaves 0; forcing it proved the
  path renders without error but showed no body. The torso continuation at a
  real 120px lift, and whether 120 is the right bound, are the first things to
  look at on device.
