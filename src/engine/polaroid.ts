// Snapshot card compositor. Draws only same-origin rasters (camera frame +
// local sprites + the frame moulding) plus code decoration, so toDataURL
// stays untainted.
//
// 2026-08-10 player call: the card is no longer a tilted polaroid. It hangs
// STRAIGHT on a gallery wall with a museum label under it, and carries the
// WHOLE stage, because the three dials around the sitter ARE the composition.
//
// 2026-08-11: the moulding moved INTO the scene (it frames the sitter's
// picture now, not the screen), so the card must not add a second one — two
// nested gilt frames on one card read as a mistake. The card is the wall.

import {CARD_FONT, CREDIT_SEP, CREDITS, STR} from '../content';
import type {Selection} from '../types';

const WALL = 60; // gallery wall margin left/right/top of the scene
const PAINT_W = 720; // scene width on the card; height follows the stage aspect
const LABEL_H = 258; // wall strip under the scene carrying the label

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

  // The scene casts onto the wall.
  ctx.save();
  ctx.shadowColor = 'rgba(48,36,20,0.34)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#12100c';
  ctx.fillRect(px, py, PAINT_W, paintH);
  ctx.restore();

  ctx.drawImage(scene, 0, 0, scene.width, scene.height, px, py, PAINT_W, paintH);

  // A hairline so the scene reads as mounted rather than bleeding into the
  // wall. The gilt moulding is already inside the scene.
  ctx.strokeStyle = 'rgba(70,58,40,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, PAINT_W - 2, paintH - 2);

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
