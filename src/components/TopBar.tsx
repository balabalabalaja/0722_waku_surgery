import React from 'react';
import {Dices, Eye, EyeOff, Layers, Triangle} from 'lucide-react';

interface TopBarProps {
  hudOn: boolean;
  overlayOn: boolean;
  saturation: number;
  onToggleHud: () => void;
  onToggleOverlay: () => void;
  onRandomize: () => void;
  onReset: () => void;
  onSaturation: (v: number) => void;
}

// fix-07: horizontal glass pill at the top of the frame, placed below the
// Waku host chrome via --surgery-topbar-inset (structure here, numbers are
// Harden's). SAT becomes a horizontal drag. All handlers stopPropagation so
// the stage never sees these touches.
// fix-12 (player round 37): every element on the bar is WHITE — icons, SAT
// label, track, thumb, percent. Readability rides on a SUBTLE soft dark
// drop shadow (a hint, not the old heavy halo). Active state = brighter
// white chip + full opacity vs transparent + dimmed.
export default function TopBar(props: TopBarProps) {
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  const glyphShadow = 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]';
  // fix-13: TEXT readability only — one notch deeper shadow than the icon
  // glyphs; icons and the white look stay as fix-12 set them.
  const textShadow = '[text-shadow:0_1px_3px_rgba(0,0,0,0.45)]';
  const btn = `flex items-center justify-center w-9 h-9 rounded-full border border-white/40 text-white ${glyphShadow} active:scale-90 transition-all cursor-pointer`;
  return (
    <div
      id="topbar"
      onPointerDown={stop}
      className="pointer-events-auto flex flex-row items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-md border border-white/70 rounded-full shadow-[0_8px_22px_rgba(0,0,0,0.18)] select-none max-w-[94%]"
    >
      <button
        type="button"
        aria-label="Toggle HUD wireframes"
        className={`${btn} ${props.hudOn ? 'bg-white/35' : 'bg-transparent opacity-55'}`}
        onClick={props.onToggleHud}
      >
        <Layers className="w-4.5 h-4.5" strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Toggle masterpiece overlay"
        className={`${btn} ${props.overlayOn ? 'bg-white/35' : 'bg-transparent opacity-55'}`}
        onClick={props.onToggleOverlay}
      >
        {props.overlayOn ? (
          <Eye className="w-4.5 h-4.5" strokeWidth={1.8} />
        ) : (
          <EyeOff className="w-4.5 h-4.5" strokeWidth={1.8} />
        )}
      </button>
      <button type="button" aria-label="Random full set" className={btn} onClick={props.onRandomize}>
        <Dices className="w-4.5 h-4.5" strokeWidth={1.8} />
      </button>
      <button type="button" aria-label="Reset to bare face" className={btn} onClick={props.onReset}>
        <Triangle className="w-4 h-4" strokeWidth={1.8} />
      </button>

      <div className="flex flex-row items-center gap-1.5 border border-white/40 rounded-full pl-2.5 pr-2 py-1">
        <span className={`text-[8px] font-mono font-bold text-white uppercase tracking-[0.15em] select-none ${textShadow}`}>
          SAT
        </span>
        <input
          id="saturation-slider"
          type="range"
          min="0"
          max="200"
          value={props.saturation}
          onChange={(e) => props.onSaturation(parseInt(e.target.value, 10))}
          className={`accent-white w-20 h-1 rounded-full cursor-pointer bg-white/40 ${glyphShadow}`}
        />
        <span className={`text-[10px] font-mono font-semibold text-white w-8 text-right tabular-nums ${textShadow}`}>{props.saturation}%</span>
      </div>
    </div>
  );
}
