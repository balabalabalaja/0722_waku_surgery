// Single source of all user-visible copy. Canvas-drawn text reads from here
// too. Build shipped English only; Harden added the `zh` layer + resolution.
//
// Localization model (no shell i18n available — see src/i18n.ts): the active
// locale is resolved ONCE at module load from the device language and there is
// no switch. `STR` / `CREDITS` are exported already resolved, so every call
// site keeps `import {STR, CREDITS}` unchanged; the `_EN` / `_ZH` tables are
// also exported for coverage tests. Cultural transfer, not literal translation:
// museum-label register in both languages, standard Chinese art-historical
// titles/artist names, and the SURGERY wordmark is a brand signature left
// untranslated (it is only a project name — zero medical semantics, per brief).

import {LOCALE} from './i18n';

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

// zh: keeps the same witty museum-gallery register and information density,
// rewritten so a Chinese user reads it naturally — not word-for-word.
const STR_ZH: Record<keyof typeof STR_EN, string> = {
  bootTitle: 'SURGERY', // brand wordmark — untranslated, no medical reading
  bootLoading: '正在布展…',
  bootCamera: '这面镜子需要用到你的摄像头',
  fallbackNote: '没有摄像头 — 就在空白画布上作画',
  cardLogo: 'SURGERY',
  labelEye: '眼',
  labelNose: '鼻',
  labelMouth: '嘴',
  bareCanvas: '素颜画布 — 你自己',
  btnSave: '保存',
  btnShare: '分享',
  btnAgain: '再来一张',
  shareCaption: '我的脸，被艺术史重新拼贴',
  viewerUnavailable: '这里无法打开查看器。',
  shareFailed: '评论编辑器没有打开。',
  saved: '已保存。',
};

export {STR_EN, STR_ZH};
export const STR: Record<keyof typeof STR_EN, string> = LOCALE === 'zh' ? STR_ZH : STR_EN;

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

// zh: standard Chinese art-historical titles and transliterated artist names
// (the names Chinese museum-goers actually use) — same works, same order.
export const CREDITS_ZH: Record<'eye' | 'nose' | 'mouth', Credit[]> = {
  eye: [
    {title: '《年轻男子肖像》', artist: '布龙齐诺'},
    {title: '《戴红头巾的男子》', artist: '扬·凡·艾克'},
    {title: '《自画像》', artist: '文森特·梵高'},
    {title: '《两个圆圈前的自画像》', artist: '伦勃朗'},
    {title: '《圣母子》', artist: '杜乔'},
    {title: '《戴珍珠耳环的少女》', artist: '约翰内斯·维米尔'},
    {title: '《自画像》', artist: '阿尔布雷希特·丢勒'},
    {title: '《美国哥特式》', artist: '格兰特·伍德'},
    {title: '《蒙娜丽莎》', artist: '列奥纳多·达·芬奇'},
    {title: '《维纳斯的诞生》', artist: '桑德罗·波提切利'},
  ],
  nose: [
    {title: '《手提歌利亚头颅的大卫》', artist: '卡拉瓦乔'},
    {title: '《自画像（圣雷米）》', artist: '文森特·梵高'},
    {title: '《色粉习作》', artist: '埃德加·德加'},
    {title: '《巴尔达萨雷·卡斯蒂利奥内像》', artist: '拉斐尔'},
    {title: '《戴眼镜的自画像》', artist: '夏尔丹'},
    {title: '《倒牛奶的女仆》', artist: '约翰内斯·维米尔'},
    {title: '《蒙娜丽莎》', artist: '列奥纳多·达·芬奇'},
    {title: '《女子肖像》', artist: '罗希尔·凡·德尔·维登'},
  ],
  mouth: [
    {title: '《自画像》', artist: '伦勃朗·凡·莱因'},
    {title: '《美杜莎》', artist: '卡拉瓦乔'},
    {title: '《维纳斯的诞生》', artist: '桑德罗·波提切利'},
    {title: '《美国哥特式》', artist: '格兰特·伍德'},
    {title: '《朵拉·玛尔肖像》', artist: '巴勃罗·毕加索'},
    {title: '《戴珍珠耳环的少女》', artist: '约翰内斯·维米尔'},
    {title: '《绿色条纹（马蒂斯夫人）》', artist: '亨利·马蒂斯'},
    {title: '《自画像》', artist: '阿尔布雷希特·丢勒'},
  ],
};

export const CREDITS: Record<'eye' | 'nose' | 'mouth', Credit[]> =
  LOCALE === 'zh' ? CREDITS_ZH : CREDITS_EN;

// Locale-aware label separator: half-width ": " for en, full-width "：" for zh.
export const CREDIT_SEP: string = LOCALE === 'zh' ? '：' : ': ';

// One shared helper for canvas font strings (typography rule: no scattered
// per-call hardcoded font). Credits switch to a CJK sans stack under zh because
// monospace faces carry no usable CJK glyphs; the SURGERY wordmark stays Latin
// monospace in both locales.
export const CARD_FONT = {
  credit: (px: number): string =>
    LOCALE === 'zh'
      ? `500 ${px}px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`
      : `500 ${px}px "JetBrains Mono", ui-monospace, monospace`,
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
