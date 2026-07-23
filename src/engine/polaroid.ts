// Polaroid snapshot card compositor. Draws only same-origin rasters (camera
// frame + local sprites) plus code decoration, so toDataURL stays untainted.

import {CARD_FONT, CREDIT_SEP, CREDITS, STR} from '../content';
import type {Selection} from '../types';
import type {FaceBox} from './facefit';

export const CARD_W = 1000;
export const CARD_H = 1300;
const PHOTO = {x: 45, y: 45, w: 910, h: 940};

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

export function composeCard(
  scene: HTMLCanvasElement,
  faceBox: FaceBox,
  scale: number,
  applied: Selection,
): HTMLCanvasElement {
  const card = document.createElement('canvas');
  card.width = CARD_W;
  card.height = CARD_H;
  const ctx = card.getContext('2d')!;

  // Warm polaroid stock with a faint edge shade.
  ctx.fillStyle = '#f7f5f0';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const edge = ctx.createLinearGradient(0, 0, 0, CARD_H);
  edge.addColorStop(0, 'rgba(0,0,0,0.05)');
  edge.addColorStop(0.06, 'rgba(0,0,0,0)');
  edge.addColorStop(0.94, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.07)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Photo crop: centered on the face, cover-fit into the photo window.
  const fb = {
    cx: faceBox.cx * scale,
    cy: faceBox.cy * scale,
    w: Math.max(60, faceBox.w * scale),
    h: Math.max(60, faceBox.h * scale),
  };
  let cw = fb.w * 2.6;
  let ch = (cw * PHOTO.h) / PHOTO.w;
  if (ch < fb.h * 1.9) {
    ch = fb.h * 1.9;
    cw = (ch * PHOTO.w) / PHOTO.h;
  }
  cw = Math.min(cw, scene.width);
  ch = Math.min(ch, scene.height);
  // Keep the aspect after clamping.
  if (cw / ch > PHOTO.w / PHOTO.h) cw = (ch * PHOTO.w) / PHOTO.h;
  else ch = (cw * PHOTO.h) / PHOTO.w;
  let sx = fb.cx - cw / 2;
  let sy = fb.cy - ch * 0.46; // face slightly above centre of the frame
  sx = Math.min(scene.width - cw, Math.max(0, sx));
  sy = Math.min(scene.height - ch, Math.max(0, sy));

  ctx.save();
  ctx.beginPath();
  ctx.rect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  ctx.clip();
  ctx.drawImage(scene, sx, sy, cw, ch, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  // Slight vignette for the print feel.
  const vg = ctx.createRadialGradient(
    PHOTO.x + PHOTO.w / 2,
    PHOTO.y + PHOTO.h / 2,
    PHOTO.w * 0.35,
    PHOTO.x + PHOTO.w / 2,
    PHOTO.y + PHOTO.h / 2,
    PHOTO.w * 0.85,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(20,15,5,0.18)');
  ctx.fillStyle = vg;
  ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  ctx.restore();
  // Photo inset line.
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(PHOTO.x + 1, PHOTO.y + 1, PHOTO.w - 2, PHOTO.h - 2);

  // Credits — museum-label register.
  const lines = creditLines(applied);
  ctx.fillStyle = '#3a372f';
  ctx.font = CARD_FONT.credit(27);
  ctx.textBaseline = 'top';
  let y = PHOTO.y + PHOTO.h + 52;
  for (const line of lines) {
    ctx.fillText(fitLine(ctx, line, PHOTO.w), PHOTO.x + 4, y);
    y += 44;
  }

  // Small monospace wordmark (signature only).
  ctx.font = CARD_FONT.logo(24);
  ctx.fillStyle = '#8a857a';
  const logo = STR.cardLogo.split('').join(' ');
  const lw = ctx.measureText(logo).width;
  ctx.fillText(logo, (CARD_W - lw) / 2, CARD_H - 62);

  return card;
}

function fitLine(ctx: CanvasRenderingContext2D, line: string, maxW: number): string {
  if (ctx.measureText(line).width <= maxW) return line;
  let s = line;
  while (s.length > 4 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  return `${s}…`;
}
