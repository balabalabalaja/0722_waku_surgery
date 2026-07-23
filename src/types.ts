export type PartKind = 'eye' | 'nose' | 'mouth';

export interface PartDef {
  id: string;
  kind: PartKind;
  src: string;
  // Native sprite pixel size (all parts of one kind share it).
  w: number;
  h: number;
}

// Per-kind user adjustment from the white bracket handles.
export interface PartFit {
  scale: number; // multiplier over the landmark-derived base size
  dx: number;    // screen-px offset from the landmark anchor
  dy: number;
}

// Which sprite index is applied per kind; null = bare.
export type Selection = Record<PartKind, number | null>;

export interface HudConfig {
  showHud: boolean;      // mesh dots + brackets + hand wireframe
  showOverlay: boolean;  // masterpiece parts on the face (off = bare-face compare)
  saturation: number;    // 0..200, percent
}

export interface Anchor {
  cx: number;
  cy: number;
  w: number; // base display width for the part at this anchor
  h: number;
}

export interface RingSpec {
  cx: number;
  cy: number;
  r: number;
}
