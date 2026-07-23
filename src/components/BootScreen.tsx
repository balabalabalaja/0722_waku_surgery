import React from 'react';
import {STR} from '../content';

export default function BootScreen() {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#070707] select-none font-mono">
      <div className="relative w-12 h-12 flex items-center justify-center mb-5">
        <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
        <div className="absolute inset-0 border-2 border-t-white border-r-white/30 border-b-white/10 border-l-transparent rounded-full animate-spin" />
      </div>
      <div className="text-[11px] uppercase tracking-[0.35em] text-white/70 font-bold mb-1.5">
        {STR.bootTitle}
      </div>
      <div className="text-[9px] tracking-wider text-white/35 lowercase">{STR.bootLoading}</div>
    </div>
  );
}
