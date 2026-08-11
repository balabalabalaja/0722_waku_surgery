// The gilt moulding, shared by the live stage and the snapshot card.
//
// It used to be a CSS border-image around the whole screen. Since 2026-08-11
// it frames only the PICTURE the sitter lives in, which means it has to be
// drawn on the canvas (between the sitter and everything else) rather than in
// the DOM — and drawn identically in both places, hence this module.

const SLICE = 136; // gilt-frame.webp 9-slice, in source pixels
export const FRAME_RAIL = 0.115; // rail thickness as a fraction of picture width
// The carving fills 106.1 of the 136 source px in a slice; the rest of the
// rail is transparent rebate, and the outer silhouette is scalloped. Content
// must be clipped to where the carving actually ends or it shows through the
// pierced scrollwork — invisible with a segmented sitter (transparent there),
// obvious the moment the picture is filled edge to edge.
export const FRAME_INSET = 0.76;

let img: HTMLImageElement | null = null;
let pending: Promise<boolean> | null = null;

export function frameImage(): HTMLImageElement | null {
  return img;
}

// Warm the raster at boot so neither the first frame nor the shutter waits on
// a network round trip. Resolves false if it never arrives; both call sites
// fall back to a plain reveal rather than failing outright.
export function loadFrame(): Promise<boolean> {
  if (pending) return pending;
  pending = new Promise((resolve) => {
    const im = new Image();
    // Same cross-origin story as parts.ts: in the platform shell the injected
    // <base href> resolves this to GCS, and a no-cors raster would taint the
    // card canvas so toDataURL throws SecurityError with no snapshot at all
    // (fix-14). GCS serves ACAO:*, and same-origin contexts ignore this.
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      img = im;
      resolve(true);
    };
    im.onerror = () => resolve(false);
    im.src = `${import.meta.env.BASE_URL}frame/gilt-frame.webp`;
  });
  return pending;
}

// Canvas 9-slice. Corners keep their aspect; the straight rails tile a whole
// number of times — the same contract CSS border-image-repeat: round gave the
// old full-screen frame, so the moulding never stretches at any picture size.
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rail: number,
) {
  const src = img;
  if (!src) {
    ctx.save();
    ctx.strokeStyle = 'rgba(120,96,48,0.9)';
    ctx.lineWidth = Math.max(2, rail * 0.3);
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.restore();
    return;
  }
  const iw = src.naturalWidth;
  const ih = src.naturalHeight;
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
  ) => ctx.drawImage(src, sx, sy, sw, sh, dx, dy, ddw, ddh);

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
