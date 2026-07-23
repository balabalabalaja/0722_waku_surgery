// Minimal self-contained locale layer.
//
// The platform shell normally supplies this (lib/i18n.ts) and bridges it at the
// graft, but its private template repo is unreachable on this account
// (`waku initial_repo pull` 404s — build-report note #7), so Harden fills the
// same role at the TEXT LAYER ONLY: device detection, active locale, and
// <html lang> sync. There is deliberately NO switch UI (create-brief + the
// localization rules forbid a visible toggle). Locale affects text / fonts
// only — never the state machine, gameplay parameters, or the core loop.

export type Locale = 'en' | 'zh';

// Detection spec (localization.md): navigator.languages → navigator.language →
// zh* → 'zh', en* → 'en', anything else / empty / abnormal → 'en' (source).
export function detectLocale(): Locale {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const tags: string[] = nav?.languages?.length
    ? [...nav.languages]
    : nav?.language
      ? [nav.language]
      : [];
  for (const tag of tags) {
    const t = String(tag).toLowerCase();
    if (t.startsWith('zh')) return 'zh';
    if (t.startsWith('en')) return 'en';
  }
  return 'en';
}

export const LOCALE: Locale = detectLocale();

// Keep <html lang> in sync (index.html ships lang="en"; overridden here at
// runtime). Guarded so the module also loads under the node test runner.
if (typeof document !== 'undefined') {
  document.documentElement.lang = LOCALE;
}
