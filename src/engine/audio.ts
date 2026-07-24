// Remote durable audio. BGM stays on an HTMLAudioElement (long-form loop;
// its gesture-retry below unlocks it on iOS). SFX are WebAudio-first as of
// fix-15: dial click/land fire from the rAF loop — outside any user-gesture
// callback — and iOS Safari refuses HTMLAudio.play() for elements that were
// never played inside a gesture (desktop Chrome's page-level activation
// masks this, which is why it never reproduced locally). One shared
// AudioContext, resumed during the first real gesture, plays cues from any
// callsite afterwards; a fresh AudioBufferSourceNode per trigger also
// survives rapid dial retriggering, where iOS currentTime=0 replays are
// unreliable. The asset CDN serves `Access-Control-Allow-Origin: *`
// (curl-verified 2026-07-24 — the earlier CORS note here was stale), so
// fetch+decode is clean. The old HTMLAudio pool remains as fallback for
// fetch/decode failure or missing WebAudio, and is gesture-unlocked too.

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
const SFX_NAMES: SfxName[] = ['click', 'land', 'shutter', 'slide'];

// Forensics probe (no secrets): lets desktop probes and real-device triage
// read which pipeline actually sounded. Window-guarded so node test runners
// importing content helpers never trip on it.
const audioProbe = {
  ctxState: 'none',
  decoded: [] as string[],
  played: {webaudio: 0, htmlaudio: 0},
  rejected: 0,
  unlockedPool: false,
};
if (typeof window !== 'undefined') {
  (window as unknown as {__surgeryAudio?: object}).__surgeryAudio = audioProbe;
}

// ---------- WebAudio primary path ----------

let ctx: AudioContext | null = null;
const buffers = new Map<SfxName, AudioBuffer>();

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC =
    window.AudioContext ??
    (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  audioProbe.ctxState = ctx.state;
  ctx.addEventListener('statechange', () => {
    if (ctx) audioProbe.ctxState = ctx.state;
  });
  return ctx;
}

function decodeAll() {
  const c = ensureCtx();
  if (!c) return;
  for (const name of SFX_NAMES) {
    const src = AUDIO[name];
    if (!src || buffers.has(name)) continue;
    fetch(src, {mode: 'cors'})
      .then((res) => res.arrayBuffer())
      // Callback form: promise-less decodeAudioData still exists on older
      // WebKit; wrapping keeps one code path for both.
      .then(
        (raw) =>
          new Promise<AudioBuffer>((resolve, reject) => {
            c.decodeAudioData(raw, resolve, reject);
          }),
      )
      .then((buf) => {
        buffers.set(name, buf);
        audioProbe.decoded.push(name);
      })
      .catch(() => {
        // This cue stays on the HTMLAudio fallback pool.
      });
  }
}

// Resume the context inside real gestures (iOS requirement); on the first
// gesture also bless the fallback pool elements so even the non-WebAudio
// path survives iOS's per-element unlock rule. Listeners stay attached:
// iOS may re-suspend the context after calls/backgrounding and the next
// tap quietly revives it.
function unlock() {
  const c = ensureCtx();
  if (c && c.state !== 'running') c.resume().catch(() => {});
  if (!audioProbe.unlockedPool) {
    audioProbe.unlockedPool = true;
    for (const p of pools.values()) {
      for (const a of p) {
        a.muted = true;
        const pr = a.play();
        if (pr) {
          pr.then(() => {
            a.pause();
            try {
              a.currentTime = 0;
            } catch {
              // not seekable yet — harmless
            }
            a.muted = false;
          }).catch(() => {
            a.muted = false;
          });
        } else {
          a.muted = false;
        }
      }
    }
  }
}

// ---------- HTMLAudio fallback pool ----------

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

// Kick off eager preloading + decoding for every cue (call once at boot),
// and arm the gesture unlock hooks.
export function primeAudio() {
  SFX_NAMES.forEach(pool);
  decodeAll();
  for (const ev of ['pointerdown', 'touchend', 'keydown']) {
    addEventListener(ev, unlock, {capture: true, passive: true});
  }
}

export function playSfx(name: SfxName, volume = 0.6) {
  // Explicit playback cap (audio-rules): even a mistakenly long file cannot
  // run away — WebAudio caps via start()'s duration arg, fallback via timer.
  const dur = SFX_DURATIONS[name] ?? 0.5;
  const buf = buffers.get(name);
  if (ctx && ctx.state === 'running' && buf) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(0, 0, dur);
    audioProbe.played.webaudio++;
    return;
  }
  const p = pool(name);
  if (p.length === 0) return; // degraded to silence (missing asset)
  const a = p.find((el) => el.paused) ?? p[0];
  try {
    a.currentTime = 0;
  } catch {
    // ignore — element may not be seekable yet
  }
  a.volume = volume;
  a.play()
    .then(() => {
      audioProbe.played.htmlaudio++;
    })
    .catch(() => {
      audioProbe.rejected++;
    });
  setTimeout(() => {
    if (!a.paused) a.pause();
  }, dur * 1000);
}
