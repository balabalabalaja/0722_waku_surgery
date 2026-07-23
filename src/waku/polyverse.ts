// Thin wrapper over the Polyverse content-runtime SDK (window.Polyverse).
// Resolves to null when no host bridge is available; the toy is fully
// playable without it — only Save/Share degrade (download / hidden).

export interface SafeAreaInsets {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface PolyverseRuntime {
  app?: {
    composeComment(input: {content: string; kind?: 'text' | 'image'; text?: string}): Promise<unknown>;
  };
  assets?: {
    upload(dataUrl: string): Promise<{public_url: string; id?: string; asset_id?: string; assetId?: string}>;
  };
  media?: {
    openImage(input: {
      source: {kind: 'asset'; assetId: string};
      filename?: string;
    }): Promise<{presented: boolean}>;
  };
  // Host notch / rounded-corner safe area — default capability set (app-host.md).
  host?: {
    safeArea(): Promise<SafeAreaInsets>;
  };
}

declare global {
  interface Window {
    Polyverse?: {ready(): Promise<PolyverseRuntime>};
  }
}

let readyPromise: Promise<PolyverseRuntime | null> | null = null;

export function readyWakuRuntime(): Promise<PolyverseRuntime | null> {
  if (!readyPromise) {
    readyPromise = window.Polyverse?.ready
      ? window.Polyverse.ready().catch(() => null)
      : Promise.resolve(null);
  }
  return readyPromise;
}

// ready() pends forever in a bare browser (SDK present, no host). Race a
// timeout so nothing blocks; a late resolution still lands in readyPromise.
export function getPv(timeoutMs = 4000): Promise<PolyverseRuntime | null> {
  return Promise.race([
    readyWakuRuntime(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// Consume the host safe area into CSS variables. Without the platform shell
// (its template repo is unreachable — build-report note #7) nothing else feeds
// the real notch / home-indicator insets into the layout, so the safe layer
// would otherwise see only env() (which is 0 inside the app WebView / gallery).
// This bridges pv.host.safeArea() → --sys-* vars that index.css already maxes
// over. Fully guarded: no runtime / no host / a rejected call all no-op, and
// the env()-based fallback keeps working.
export async function applyHostSafeArea(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    const pv = await getPv();
    if (!pv?.host?.safeArea) return;
    const s = await pv.host.safeArea();
    const root = document.documentElement;
    root.style.setProperty('--sys-top', `${Math.max(0, s.top)}px`);
    root.style.setProperty('--sys-bottom', `${Math.max(0, s.bottom)}px`);
    root.style.setProperty('--sys-left', `${Math.max(0, s.left)}px`);
    root.style.setProperty('--sys-right', `${Math.max(0, s.right)}px`);
  } catch {
    // Host without safeArea, or a rejected bridge call: env() fallback stands.
  }
}

interface UploadedCard {
  publicUrl: string;
  assetId: string | null;
}

// One upload per card; Save and Share reuse the same platform asset.
const uploadCache = new Map<string, Promise<UploadedCard>>();

async function uploadCard(pv: PolyverseRuntime, jpegDataUrl: string): Promise<UploadedCard> {
  let cached = uploadCache.get(jpegDataUrl);
  if (!cached) {
    cached = (async () => {
      if (!pv.assets?.upload) throw new Error('assets.upload unavailable');
      const res = await pv.assets.upload(jpegDataUrl);
      return {
        publicUrl: res.public_url,
        assetId: res.id ?? res.asset_id ?? res.assetId ?? null,
      };
    })();
    uploadCache.set(jpegDataUrl, cached);
    cached.catch(() => uploadCache.delete(jpegDataUrl));
  }
  return cached;
}

export type ShareOutcome = 'ok' | 'no-runtime' | 'error';

export async function shareCardToComments(jpegDataUrl: string, text: string): Promise<ShareOutcome> {
  const pv = await getPv();
  if (!pv) return 'no-runtime';
  try {
    const up = await uploadCard(pv, jpegDataUrl);
    await pv.app!.composeComment({content: up.publicUrl, kind: 'image', text});
    return 'ok';
  } catch (err) {
    console.error('share failed', err);
    return 'error';
  }
}

export type SaveOutcome = 'viewer' | 'download' | 'unsupported' | 'error';

// In-platform: platform image viewer (system save/share lives there).
// No runtime at all: plain download (standalone web dev path only).
export async function saveCard(
  jpegDataUrl: string,
  pngDataUrl: string,
  filename: string,
): Promise<SaveOutcome> {
  const pv = await getPv();
  if (!pv) {
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = filename;
    a.click();
    return 'download';
  }
  try {
    const up = await uploadCard(pv, jpegDataUrl);
    if (!up.assetId || !pv.media?.openImage) return 'unsupported';
    const res = await pv.media.openImage({
      source: {kind: 'asset', assetId: up.assetId},
      filename,
    });
    return res.presented ? 'viewer' : 'unsupported';
  } catch (err) {
    console.error('save failed', err);
    return 'error';
  }
}
