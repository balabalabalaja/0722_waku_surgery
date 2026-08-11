import React, {useState} from 'react';
import {STR} from '../content';

interface ResultCardProps {
  pngUrl: string;
  altText: string;
  pvAvailable: boolean;
  onSave: () => Promise<'viewer' | 'download' | 'unsupported' | 'error'>;
  onShare: () => Promise<'ok' | 'no-runtime' | 'error'>;
  onAgain: () => void;
}

// Full-screen result: the polaroid IS the hero, buttons stay small below.
export default function ResultCard(props: ResultCardProps) {
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [status, setStatus] = useState('');

  const save = async () => {
    if (busy) return;
    setBusy('save');
    setStatus('');
    const out = await props.onSave();
    if (out === 'unsupported') setStatus(STR.viewerUnavailable);
    if (out === 'error') setStatus(STR.viewerUnavailable);
    if (out === 'download') setStatus(STR.saved);
    setBusy(null);
  };

  const share = async () => {
    if (busy) return;
    setBusy('share');
    setStatus('');
    const out = await props.onShare();
    if (out !== 'ok') setStatus(STR.shareFailed);
    setBusy(null);
  };

  const ghost =
    'px-5 py-2.5 rounded-full border border-white/25 text-white/90 text-sm font-medium active:scale-95 transition-all cursor-pointer disabled:opacity-40 bg-white/5 backdrop-blur';

  return (
    <div
      id="result-overlay"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <img
        src={props.pngUrl}
        alt={props.altText}
        className="max-h-[68%] max-w-[86%] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.6)] animate-card-slide rounded-[3px]"
      />
      <div className="flex items-center gap-3 mt-7">
        <button
          type="button"
          className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold active:scale-95 transition-all cursor-pointer"
          onClick={props.onAgain}
        >
          {STR.btnAgain}
        </button>
        <button type="button" className={ghost} disabled={busy !== null} onClick={save}>
          {busy === 'save' ? '…' : STR.btnSave}
        </button>
        {props.pvAvailable && (
          <button type="button" className={ghost} disabled={busy !== null} onClick={share}>
            {busy === 'share' ? '…' : STR.btnShare}
          </button>
        )}
      </div>
      <div className="h-5 mt-3 text-[11px] font-mono text-white/50">{status}</div>
    </div>
  );
}
