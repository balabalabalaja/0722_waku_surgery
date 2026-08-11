// Snapshot card compositor. Draws only same-origin rasters (camera frame +
// local sprites + the frame moulding) plus code decoration, so toDataURL
// stays untainted.
//
// 2026-08-10 player call: the card is no longer a tilted polaroid. The live
// mirror hangs in a gilt frame, so the snapshot is that same painting — hung
// STRAIGHT on a gallery wall, in the same moulding, with a museum label under
// it. And no face-centred crop any more: the card carries the WHOLE stage,
// because the three dials around the sitter ARE the composition.

import {CARD_FONT, CREDIT_SEP, CREDITS, STR} from '../content';
import type {Selection} from '../types';

const WALL = 60; // gallery wall margin left/right/top of the painting
const PAINT_W = 720; // painting width; height follows the stage aspect
const LABEL_H = 258; // wall strip under the frame carrying the label
const RAIL = 0.087; // frame rail vs painting width — same ratio as the screen
const SLICE = 136; // gilt-frame.webp 9-slice, in source pixels

let frameImg: HTMLImageElement | null = null;
let framePromise: Promise<boolean> | null = null;

// Warm the moulding at boot so the shutter never waits on a network round
// trip. Resolves false if it never arrives — the card then falls back to a
// plain dark reveal rather than failing outright.
export function loadCardFrame(): Promise<boolean> {
  if (framePromise) return framePromise;
  framePromise = new Promise((resolve) => {
    const im = new Image();
    // Same cross-origin story as parts.ts: in the platform shell the injected
    // <base href> resolves this to GCS, and a no-cors raster would taint the
    // card canvas so toDataURL throws SecurityError with no snapshot at all
    // (fix-14). GCS serves ACAO:*, and same-origin contexts ignore this.
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      frameImg = im;
      resolve(true);
    };
    im.onerror = () => resolve(false);
    im.src = `${import.meta.env.BASE_URL}frame/gilt-frame.webp`;
  });
  return framePromise;
}

export function creditLines(applied: Selection): string[] {
  const lines: string[] = [];
  if (applied.eye !== null) {
    const c = CREDITS.eye[applied.eye];
    lines.push(`${STR.labelEye}${CREDIT_SEP}${c.title} — ${c.artist}`);
  }
  if (applied.nose !== null) {
    const c = CREDITS.nose[applied.nose];
    lines.push(`${STR.labelNose}${CREDIT_SEP}${c.title} — ${c.artist}`);
  }
  if (applied.mouth !== null) {
    const c = CREDITS.mouth[applied.mouth];
    lines.push(`${STR.labelMouth}${CREDIT_SEP}${c.title} — ${c.artist}`);
  }
  if (lines.length === 0) lines.push(STR.bareCanvas);
  return lines;
}

// Canvas 9-slice. Corners keep their aspect; the straight rails tile a whole
// number of times, the same contract as border-image-repeat: round on screen.
function nineSlice(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  rail: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const mw = iw - SLICE * 2; // source middle spans
  const mh = ih - SLICE * 2;
  const dw = w - rail * 2; // destination middle spans
  const dh = h - rail * 2;
  const px = rail / SLICE; // source px -> destination px
  const d = (
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    ddw: number,
    ddh: number,
  ) => ctx.drawImage(img, sx, sy, sw, sh, dx, dy, ddw, ddh);

  d(0, 0, SLICE, SLICE, x, y, rail, rail);
  d(iw - SLICE, 0, SLICE, SLICE, x + w - rail, y, rail, rail);
  d(0, ih - SLICE, SLICE, SLICE, x, y + h - rail, rail, rail);
  d(iw - SLICE, ih - SLICE, SLICE, SLICE, x + w - rail, y + h - rail, rail, rail);

  const nx = Math.max(1, Math.round(dw / (mw * px)));
  const tw = dw / nx;
  for (let i = 0; i < nx; i++) {
    d(SLICE, 0, mw, SLICE, x + rail + i * tw, y, tw, rail);
    d(SLICE, ih - SLICE, mw, SLICE, x + rail + i * tw, y + h - rail, tw, rail);
  }
  const ny = Math.max(1, Math.round(dh / (mh * px)));
  const th = dh / ny;
  for (let i = 0; i < ny; i++) {
    d(0, SLICE, SLICE, mh, x, y + rail + i * th, rail, th);
    d(iw - SLICE, SLICE, SLICE, mh, x + w - rail, y + rail + i * th, rail, th);
  }
}

export function composeCard(scene: HTMLCanvasElement, applied: Selection): HTMLCanvasElement {
  // The painting keeps the stage's own aspect — cropping it to a fixed shape
  // would cut the top and bottom dials straight off.
  const paintH = Math.round((PAINT_W * scene.height) / scene.width);
  const cardW = PAINT_W + WALL * 2;
  const cardH = WALL + paintH + LABEL_H;
  const px = WALL;
  const py = WALL;

  const card = document.createElement('canvas');
  card.width = cardW;
  card.height = cardH;
  const ctx = card.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Gallery wall.
  const wall = ctx.createLinearGradient(0, 0, cardW * 0.6, cardH);
  wall.addColorStop(0, '#f4efe5');
  wall.addColorStop(0.55, '#eae3d6');
  wall.addColorStop(1, '#ded5c5');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, cardW, cardH);
  const vg = ctx.createRadialGradient(
    cardW / 2,
    cardH * 0.42,
    cardW * 0.3,
    cardW / 2,
    cardH * 0.42,
    cardH * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(60,48,32,0.16)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, cardW, cardH);

  // The painting casts onto the wall.
  ctx.save();
  ctx.shadowColor = 'rgba(48,36,20,0.34)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#12100c';
  ctx.fillRect(px, py, PAINT_W, paintH);
  ctx.restore();

  ctx.drawImage(scene, 0, 0, scene.width, scene.height, px, py, PAINT_W, paintH);

  // No backing board here, unlike the screen. The screen needs one because
  // dial sprites orbit under the pierced outer scrollwork; on the card the
  // painting already fills the rect, so there is nothing to leak — and a
  // plain backing rectangle would poke past the moulding's scalloped outer
  // edge along the middle of each rail and read as a dark rim on the wall
  // (invisible on the black stage, obvious here).
  const rail = Math.round(PAINT_W * RAIL);
  if (frameImg) {
    nineSlice(ctx, frameImg, px, py, PAINT_W, paintH, rail);
  } else {
    // Moulding never arrived — a plain reveal still reads as framed.
    ctx.strokeStyle = 'rgba(120,96,48,0.9)';
    ctx.lineWidth = 6;
    ctx.strokeRect(px + 3, py + 3, PAINT_W - 6, paintH - 6);
  }

  // Museum label on the wall below.
  // Museum label. The wordmark is pinned to the card floor while the credits
  // grow downward from the frame, so LABEL_H has to clear three credit lines
  // plus the wordmark — at 224 they collided.
  const lines = creditLines(applied);
  let y = py + paintH + 56;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#40392c';
  ctx.font = CARD_FONT.credit(23);
  for (const line of lines) {
    ctx.fillText(fitLine(ctx, line, PAINT_W - 40), cardW / 2, y);
    y += 36;
  }
  ctx.font = CARD_FONT.logo(20);
  ctx.fillStyle = '#8d8471';
  ctx.fillText(STR.cardLogo.split('').join(' '), cardW / 2, cardH - 56);
  ctx.textAlign = 'left';

  return card;
}

function fitLine(ctx: CanvasRenderingContext2D, line: string, maxW: number): string {
  if (ctx.measureText(line).width <= maxW) return line;
  let s = line;
  while (s.length > 4 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  return `${s}…`;
}
