// Single source of all user-visible copy. Canvas-drawn text reads from here
// too.
//
// ENGLISH ONLY — standing player rule. There is no locale layer, no zh table
// and no language switch: every string a player can ever see is written here
// in English and shipped verbatim. The former `zh` tables, the device-locale
// detector (src/i18n.ts) and the CJK font fallbacks were removed wholesale;
// do not reintroduce them. tests/content.test.ts fails the build on any
// non-Latin character that creeps back into this file.

const STR_EN = {
  bootTitle: 'SURGERY',
  bootLoading: 'hanging the collection…',
  bootCamera: 'the mirror needs your camera',
  fallbackNote: 'no camera — painting on a blank canvas',
  cardLogo: 'SURGERY',
  labelEye: 'Eye',
  labelNose: 'Nose',
  labelMouth: 'Mouth',
  bareCanvas: 'Bare canvas — you',
  btnSave: 'Save',
  btnShare: 'Share',
  btnAgain: 'One more',
  shareCaption: 'my face, remixed by art history',
  viewerUnavailable: 'This gallery cannot open the viewer here.',
  shareFailed: 'The comment composer did not open.',
  saved: 'Saved.',
} as const;

export {STR_EN};
export const STR: Record<keyof typeof STR_EN, string> = STR_EN;

export interface Credit {
  title: string;
  artist: string;
}

// Best-effort museum labels for the 26 crops (attribution confidence recorded
// in build-report; witty-label register per brief).
export const CREDITS_EN: Record<'eye' | 'nose' | 'mouth', Credit[]> = {
  eye: [
    {title: 'Portrait of a Young Man', artist: 'Bronzino'},
    {title: 'Man in a Red Turban', artist: 'Jan van Eyck'},
    {title: 'Self-Portrait', artist: 'Vincent van Gogh'},
    {title: 'Self-Portrait with Two Circles', artist: 'Rembrandt'},
    {title: 'Madonna and Child', artist: 'Duccio'},
    {title: 'Girl with a Pearl Earring', artist: 'Johannes Vermeer'},
    {title: 'Self-Portrait', artist: 'Albrecht Dürer'},
    {title: 'American Gothic', artist: 'Grant Wood'},
    {title: 'Mona Lisa', artist: 'Leonardo da Vinci'},
    {title: 'The Birth of Venus', artist: 'Sandro Botticelli'},
  ],
  nose: [
    {title: 'David with the Head of Goliath', artist: 'Caravaggio'},
    {title: 'Self-Portrait, Saint-Rémy', artist: 'Vincent van Gogh'},
    {title: 'Pastel study', artist: 'Edgar Degas'},
    {title: 'Baldassare Castiglione', artist: 'Raphael'},
    {title: 'Self-Portrait with Spectacles', artist: 'Chardin'},
    {title: 'The Milkmaid', artist: 'Johannes Vermeer'},
    {title: 'Mona Lisa', artist: 'Leonardo da Vinci'},
    {title: 'Portrait of a Lady', artist: 'Rogier van der Weyden'},
  ],
  mouth: [
    {title: 'Self-Portrait', artist: 'Rembrandt van Rijn'},
    {title: 'Medusa', artist: 'Caravaggio'},
    {title: 'The Birth of Venus', artist: 'Sandro Botticelli'},
    {title: 'American Gothic', artist: 'Grant Wood'},
    {title: 'Portrait of Dora Maar', artist: 'Pablo Picasso'},
    {title: 'Girl with a Pearl Earring', artist: 'Johannes Vermeer'},
    {title: 'The Green Stripe', artist: 'Henri Matisse'},
    {title: 'Self-Portrait', artist: 'Albrecht Dürer'},
  ],
};

export const CREDITS: Record<'eye' | 'nose' | 'mouth', Credit[]> = CREDITS_EN;

export const CREDIT_SEP = ': ';

// One shared helper for canvas font strings (typography rule: no scattered
// per-call hardcoded font). Latin monospace throughout — the card never
// carries a non-Latin glyph.
export const CARD_FONT = {
  credit: (px: number): string => `500 ${px}px "JetBrains Mono", ui-monospace, monospace`,
  logo: (px: number): string => `700 ${px}px "JetBrains Mono", ui-monospace, monospace`,
};

// Remote durable audio URLs (Polyverse GCS; '' = degrade to silence for that
// cue, recorded in build-report).
export const AUDIO = {
  // fix-02 #5: quieter, sparser gallery bed (previous take was too busy).
  bgm: 'https://storage.googleapis.com/waku-core-aicap-dev/aicap/io/acj_16baa1c155ff40ab9044d58c45ebaee2/00-f09259b4-c8a9-41c5-96ac-9a2246b202dc-u2_6f2292bd-ac11-4df1-a053-b54dcc537906.mp3',
  click: 'https://storage.googleapis.com/waku-core-aicap-dev/aicap/io/acj_9ba8dc1e118a41fb9f8fe4c1078d6230/asset-0.mp3',
  land: 'https://storage.googleapis.com/waku-core-aicap-dev/aicap/io/acj_4be07ea25e36470fb0f31c6607c211a7/asset-0.mp3',
  shutter: 'https://storage.googleapis.com/waku-core-aicap-dev/aicap/io/acj_df455dceb1f14734ab782883327d6d57/asset-0.mp3',
  slide: 'https://storage.googleapis.com/waku-core-aicap-dev/aicap/io/acj_63565eef347840c08aba48e7beac070d/asset-0.mp3',
};

// Explicit playback caps in seconds (audio-rules: every SFX path passes one).
export const SFX_DURATIONS: Record<string, number> = {
  click: 0.5,
  land: 0.5,
  shutter: 0.6,
  slide: 0.8,
};
