import React, {useCallback, useEffect, useReducer, useRef, useState} from 'react';
import BootScreen from './components/BootScreen';
import ResultCard from './components/ResultCard';
import Shutter from './components/Shutter';
import {AUDIO, STR} from './content';
import {bgm, playSfx, primeAudio} from './engine/audio';
import {initialMachine, reduce} from './engine/machine';
import {RING_STYLE} from './engine/rings';
import {RING_COMPOSITION} from './engine/facefit';
import {TUNING, WINDOW_STYLE} from './engine/stage';
import {loadParts} from './engine/parts';
import {composeCard, creditLines} from './engine/polaroid';
import {CollageEngine} from './engine/stage';
import {Vision} from './engine/vision';
import {applyHostSafeArea, getPv, saveCard, shareCardToComments} from './waku/polyverse';

interface CardState {
  pngUrl: string;
  jpegUrl: string;
  credits: string[];
}

const PLAY_STAGES = ['ready', 'active', 'fallback'];

export default function App() {
  const [m, dispatch] = useReducer(reduce, initialMachine);
  const [card, setCard] = useState<CardState | null>(null);
  const [flash, setFlash] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [pvAvailable, setPvAvailable] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CollageEngine | null>(null);
  const visionRef = useRef<Vision | null>(null);
  const mRef = useRef(m);
  mRef.current = m;

  // Boot: audio, runtime probe, parts, engine, camera + models (independent).
  useEffect(() => {
    let disposed = false;
    primeAudio();
    bgm.play(AUDIO.bgm);
    getPv().then((pv) => setPvAvailable(pv !== null));
    // Feed the host notch / home-indicator insets into --sys-* (the shell's job
    // when a shell exists; none here). No-op in a bare browser — env() stands.
    applyHostSafeArea();

    const vision = new Vision();
    visionRef.current = vision;
    vision.startCamera().then((ok) => dispatch({type: ok ? 'CAMERA_OK' : 'CAMERA_FAIL'}));
    // Hard cap on model loading: a stalled CDN must land in the playable
    // fallback, never a frozen boot screen (fix-03 forensics finding).
    Promise.race([
      vision.loadModels(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 25000)),
    ]).then((ok) => dispatch({type: ok ? 'MODELS_OK' : 'MODELS_FAIL'}));

    loadParts()
      .then((bank) => {
        if (disposed || !stageRef.current) return;
        const engine = new CollageEngine(stageRef.current, vision, bank, {
          onFaceChange: (visible) => dispatch({type: visible ? 'FACE_FOUND' : 'FACE_LOST'}),
        });
        engine.setInputEnabled(() => PLAY_STAGES.includes(mRef.current.stage));
        engineRef.current = engine;
        // Probe handle for tests/forensics (no secrets live here).
        (window as unknown as {__surgery?: object}).__surgery = {
          engine,
          vision,
          RING_STYLE,
          RING_COMPOSITION,
          WINDOW_STYLE,
          TUNING,
        };
        setEngineReady(true);
      })
      .catch((err) => {
        // Sprites are same-origin static files; if even they fail there is no
        // playable content — surface a hard console error, keep boot screen.
        console.error('part sprites failed to load', err);
      });

    return () => {
      disposed = true;
      engineRef.current?.destroy();
      visionRef.current?.stop();
      bgm.stop();
    };
  }, []);

  // Auto-dress once the machine says so (first face / fallback / timeout).
  const dressedHandled = useRef(false);
  useEffect(() => {
    if (!m.dressed || !engineReady || dressedHandled.current) return;
    dressedHandled.current = true;
    engineRef.current!.setDressed(true);
    engineRef.current!.dressRandom();
  }, [m.dressed, engineReady]);

  // Ready >6s with no face: dress the default anchors anyway (first-screen
  // promise still lands without a detected face).
  useEffect(() => {
    if (m.stage !== 'ready' || m.dressed) return;
    const t = setTimeout(() => dispatch({type: 'DRESS_TIMEOUT'}), 6000);
    return () => clearTimeout(t);
  }, [m.stage, m.dressed]);

  const snap = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || !PLAY_STAGES.includes(mRef.current.stage)) return;
    dispatch({type: 'SHUTTER'});
    playSfx('shutter', 0.7);
    setFlash(true);
    setTimeout(() => setFlash(false), 280);
    try {
      await document.fonts.ready; // card text uses the mono webfont
      const {canvas, faceBox, scale} = engine.capture();
      const cardCanvas = composeCard(canvas, faceBox, scale, engine.applied);
      const pngUrl = cardCanvas.toDataURL('image/png');
      const jpegUrl = cardCanvas.toDataURL('image/jpeg', 0.86);
      setCard({pngUrl, jpegUrl, credits: creditLines(engine.applied)});
      playSfx('slide', 0.6);
      dispatch({type: 'CARD_READY'});
    } catch (err) {
      console.error('card compose failed', err);
      dispatch({type: 'RESOLVE_FAIL'});
    }
  }, []);

  const again = useCallback(() => {
    setCard(null);
    dispatch({type: 'AGAIN'});
  }, []);

  const isPlaying = PLAY_STAGES.includes(m.stage);

  return (
    <div
      id="app-root"
      data-stage={m.stage}
      className="fixed inset-0 w-full h-[100dvh] bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center"
    >
      {/* 9:16 stage frame (gate item 5): wide viewports get a centered
          pillarbox; portrait phones (narrower than 9:16) keep full-bleed.
          Everything — canvas, sidebar, shutter, overlays — lives inside. */}
      <div
        id="stage-frame"
        className="relative overflow-hidden bg-black"
        style={{width: 'min(100vw, calc(100dvh * 9 / 16))', height: '100dvh'}}
      >
        {/* Full-bleed stage layer (camera + collage + dials, canvas-owned) */}
        <div ref={stageRef} className="absolute inset-0" />

        {/* The whole mirror hangs in a carved gilt frame, so the live selfie
            reads as an oil painting on a gallery wall. Screen chrome only: it
            sits above the canvas but is NOT drawn into it, so the polaroid
            capture never picks up a random slice of moulding. Under the
            result overlay (z-30) and the boot screen (z-40) by design. */}
        <div id="picture-frame-back" aria-hidden="true" className="absolute inset-0 z-[24] pointer-events-none" />
        <div
          id="picture-frame"
          aria-hidden="true"
          className="absolute inset-0 z-[25] pointer-events-none"
          style={{borderImageSource: `url(${import.meta.env.BASE_URL}frame/gilt-frame.webp)`}}
        />

        {/* Safe layer: chrome in flex/percentage terms, never device-hardcoded.
            The tuning bar (HUD / overlay / dice / reset / SAT) is gone — it was
            operator chrome that added nothing to the picture. The shutter is the
            only control left on the canvas. */}
        {isPlaying && (
          <>
            <div
              className="absolute inset-x-0 z-20 flex justify-center pointer-events-none"
              style={{bottom: 'var(--surgery-shutter-inset)'}}
            >
              <span className="pointer-events-auto">
                <Shutter onSnap={snap} />
              </span>
            </div>
            {m.stage === 'fallback' && m.cameraOk === false && (
              <div
                className="absolute inset-x-0 z-20 flex justify-center pointer-events-none"
                style={{top: 'var(--surgery-topbar-inset)'}}
              >
                <span className="text-[10px] font-mono tracking-wider text-white/70 lowercase [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                  {STR.fallbackNote}
                </span>
              </div>
            )}
          </>
        )}

        {/* Shutter flash */}
        <div
          className="absolute inset-0 z-40 bg-white pointer-events-none transition-opacity duration-200"
          style={{opacity: flash ? 1 : 0}}
        />

        {m.stage === 'result' && card && (
          <ResultCard
            pngUrl={card.pngUrl}
            altText={card.credits.join(' / ')}
            pvAvailable={pvAvailable}
            onSave={() => saveCard(card.jpegUrl, card.pngUrl, 'surgery-card.png')}
            onShare={() => shareCardToComments(card.jpegUrl, STR.shareCaption)}
            onAgain={again}
          />
        )}

        {m.stage === 'boot' && <BootScreen />}
      </div>
    </div>
  );
}
