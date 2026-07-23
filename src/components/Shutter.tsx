import React from 'react';

// Bottom-centre white circular shutter — universal camera affordance.
export default function Shutter({onSnap}: {onSnap: () => void}) {
  return (
    <button
      id="shutter"
      type="button"
      aria-label="Snap a polaroid"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onSnap}
      className="relative flex items-center justify-center w-[74px] h-[74px] rounded-full cursor-pointer active:scale-90 transition-transform"
    >
      <span className="absolute inset-0 rounded-full border-[3px] border-white/90 shadow-[0_2px_14px_rgba(0,0,0,0.5)]" />
      <span className="absolute inset-[7px] rounded-full bg-white shadow-[0_2px_16px_rgba(0,0,0,0.45)]" />
    </button>
  );
}
