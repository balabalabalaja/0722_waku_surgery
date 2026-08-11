# fix-23 — the sitter lives in a picture; the dials orbit outside it

Player round, 2026-08-11. Direct edit, no pipeline. This supersedes the whole
run of bottom-of-the-stage patches (fix-19 stretch, fix-21 tear, fix-22 cover
zoom) by removing the question they were all trying to answer.

## The trap those three were stuck in

Face centred / small sitter / real body reaching the stage floor — pick two.
The camera rect is only `zoom` of the stage tall, so a small sitter always left
a strip at the bottom that the camera could not fill, and every attempt to fill
it was invention: a stretched torso that duplicated a jacket collar, a torn
edge, and finally a cover-sized sitter whose shoulders buried the lower dials.

The player's way out: **shrink the frame instead of the person.** A gilt frame
that holds the sitter and nothing else. Then

- the body is cropped by the picture's own bottom edge, which is what a framed
  portrait has always done, so there is nothing to invent;
- the sitter can no longer spill across the stage and hide the dials, because
  the frame contains them.

## The distinction that makes it work

**The frame is a WINDOW, not a container.** Widening it must reveal more of the
player — shoulders, ears, more room — never inflate them. `SITTER.crop` sets
the sitter's size from a notional portrait crop and is deliberately independent
of `PICTURE.w/h`; cover-fitting the camera into the frame does the opposite,
and did, until the two were split. A test pins it: mutating `PICTURE` must not
change `sitterScale`.

## Geometry

- `PICTURE = {w: .72, h: .52, cx: .5, cy: .535}` of the stage.
- `sitterTransform` pins the camera's **bottom edge to the picture's bottom
  edge**, so the moulding does the cropping. Vertical placement is no longer
  pannable — there is nothing to park.
- `sitterPanX` centres the face horizontally, clamped so the rect never stops
  covering the picture (a bare edge would slide in through the frame).
- Dials: `RING_R = .436` of stage width, rows at .26 / .50 / .80. They may now
  bleed past the stage edges — that is allowed and reads as "the collage
  continues past the page". The clamp moved from the ring to the **sprites**:
  the two sprite columns at `cx ± r` must clear the picture's left and right
  sides, which is the only thing that can actually hide a dial. Asserted at
  four phone sizes.

## Layering

    painted room -> all three dials -> PICTURE { room repainted clean, sitter,
    applied parts, HUD } -> moulding -> parts still in flight

The room is repainted inside the picture so dials never show through it: they
orbit the picture, they are not in it. Everything face-anchored is clipped with
the sitter, or a part window hangs in the room when the player leans out of
frame. Flights draw last and unclipped, so a chosen organ visibly travels from
its dial and lands on the painting instead of blinking out at the frame's edge.

## Fallout cleaned

- The moulding moved from a CSS `border-image` on the whole screen to canvas
  (`src/engine/frameart.ts`, shared by stage and card). `#picture-frame`,
  `#picture-frame-back` and their CSS vars are gone.
- The card must not add a second moulding — the scene already carries one. Two
  nested gilt frames on one card read as a mistake. The card is the wall: gallery
  ground, the scene with a hairline, museum label.
- `defaultAnchors` moved inside the picture so the no-camera fallback composes
  like the live one.

## Verification

- `npm run lint` clean, `npm test` 28/28, `npm run build` clean.
- Headless 390x844 @3x: picture measured at x 54..336, y 232..671; dials
  eye(177,219) nose(205,422) mouth(186,675) r=170, every sprite column clear of
  the picture; card renders with one frame, no `SecurityError`.
- **Not verified against a real person** — the fake camera has no face, so the
  picture renders empty and the horizontal parking never engages. First things
  to judge on device: how much of the sitter the window reveals
  (`SITTER.crop`), and whether the dials bleed too far off the sides
  (`RING_R`). Both are single numbers.
