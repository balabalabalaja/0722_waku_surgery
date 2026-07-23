import type {PartDef, PartKind} from '../types';

export const PART_COUNTS: Record<PartKind, number> = {eye: 10, nose: 8, mouth: 8};

export const PART_SIZES: Record<PartKind, {w: number; h: number}> = {
  eye: {w: 341, h: 149},
  nose: {w: 310, h: 540},
  mouth: {w: 430, h: 188},
};

export function partDefs(): PartDef[] {
  const defs: PartDef[] = [];
  (Object.keys(PART_COUNTS) as PartKind[]).forEach((kind) => {
    for (let i = 1; i <= PART_COUNTS[kind]; i++) {
      const id = `${kind}_${String(i).padStart(2, '0')}`;
      defs.push({
        id,
        kind,
        src: `${import.meta.env.BASE_URL}parts/${id}.png`,
        ...PART_SIZES[kind],
      });
    }
  });
  return defs;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    // fix-14: the platform shell proxies the playable but injects
    // <base href="https://storage.googleapis.com/...">, so this relative src
    // resolves cross-origin there. Loaded no-cors it would taint every canvas
    // it touches and composeCard's toDataURL throws SecurityError (no snapshot
    // card in-shell). GCS serves ACAO:*, and in every same-origin context
    // (local dev, raw GCS, simulator proxy rewrite) the attribute is a no-op.
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`failed to load ${src}`));
    im.src = src;
  });
}

// Feathered elliptical crop, baked once at native sprite size.
export function softMask(im: HTMLImageElement, w: number, h: number, feather = 0.97): HTMLCanvasElement {
  const o = document.createElement('canvas');
  o.width = w;
  o.height = h;
  const c = o.getContext('2d')!;
  c.drawImage(im, 0, 0, w, h);
  const m = document.createElement('canvas');
  m.width = w;
  m.height = h;
  const mc = m.getContext('2d')!;
  mc.filter = `blur(${Math.max(4, Math.min(w, h) * 0.07)}px)`;
  mc.fillStyle = '#fff';
  mc.beginPath();
  mc.ellipse(w / 2, h / 2, (w / 2) * feather, (h / 2) * feather, 0, 0, Math.PI * 2);
  mc.fill();
  c.globalCompositeOperation = 'destination-in';
  c.drawImage(m, 0, 0);
  return o;
}

export interface PartBank {
  defs: PartDef[];
  sprites: Map<string, HTMLCanvasElement>; // soft-masked, native size
  byKind(kind: PartKind): HTMLCanvasElement[];
}

// Eager-loads all 26 sprites (asset loading rule: no lazy paths). Masks are
// baked at each file's NATIVE resolution, so higher-res re-exports (the
// pending 4x set) upgrade fidelity with zero code changes; PART_SIZES only
// pins the aspect ratios used by layout math.
export async function loadParts(): Promise<PartBank> {
  const defs = partDefs();
  const sprites = new Map<string, HTMLCanvasElement>();
  await Promise.all(
    defs.map(async (d) => {
      const im = await loadImage(d.src);
      sprites.set(d.id, softMask(im, im.naturalWidth || d.w, im.naturalHeight || d.h));
    }),
  );
  return {
    defs,
    sprites,
    byKind(kind: PartKind) {
      return defs.filter((d) => d.kind === kind).map((d) => sprites.get(d.id)!);
    },
  };
}
