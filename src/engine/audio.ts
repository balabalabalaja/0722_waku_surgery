// Remote durable audio, played through HTMLAudioElement (WebAudio decode is
// blocked by CORS on the asset CDN). One BGM controller, bounded SFX.

import {AUDIO, SFX_DURATIONS} from '../content';

export const bgm = {
  current: null as HTMLAudioElement | null,
  play(src: string) {
    if (!src) return;
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
    const a = new Audio(src);
    a.loop = true;
    // gate-02 #5: the bed should be barely noticeable.
    a.volume = 0.18;
    this.current = a;
    a.play().catch(() => {
      addEventListener('pointerdown', () => a.play().catch(() => {}), {once: true});
    });
  },
  stop() {
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
  },
};

type SfxName = 'click' | 'land' | 'shutter' | 'slide';

// Small element pools so rapid dial clicks can overlap.
const pools = new Map<SfxName, HTMLAudioElement[]>();
const POOL = 3;

function pool(name: SfxName): HTMLAudioElement[] {
  let p = pools.get(name);
  if (!p) {
    p = [];
    const src = AUDIO[name];
    if (src) {
      for (let i = 0; i < POOL; i++) {
        const a = new Audio(src);
        a.preload = 'auto';
        p.push(a);
      }
    }
    pools.set(name, p);
  }
  return p;
}

// Kick off eager preloading for every cue (call once at boot).
export function primeAudio() {
  (['click', 'land', 'shutter', 'slide'] as SfxName[]).forEach(pool);
}

export function playSfx(name: SfxName, volume = 0.6) {
  const p = pool(name);
  if (p.length === 0) return; // degraded to silence (missing asset)
  const a = p.find((el) => el.paused) ?? p[0];
  const dur = SFX_DURATIONS[name] ?? 0.5;
  try {
    a.currentTime = 0;
  } catch {
    // ignore — element may not be seekable yet
  }
  a.volume = volume;
  a.play().catch(() => {});
  // Explicit duration cap: even a mistakenly long file cannot run away.
  setTimeout(() => {
    if (!a.paused) a.pause();
  }, dur * 1000);
}
