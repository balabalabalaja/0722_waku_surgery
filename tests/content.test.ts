import {strict as assert} from 'node:assert';
import test from 'node:test';
import {
  AUDIO,
  CREDITS,
  CREDITS_EN,
  CREDITS_ZH,
  SFX_DURATIONS,
  STR,
  STR_EN,
  STR_ZH,
} from '../src/content.ts';

const CREDIT_TABLES = {en: CREDITS_EN, zh: CREDITS_ZH};

for (const [loc, table] of Object.entries(CREDIT_TABLES)) {
  test(`[${loc}] credits cover every sprite slot (10 eyes, 8 noses, 8 mouths)`, () => {
    assert.equal(table.eye.length, 10);
    assert.equal(table.nose.length, 8);
    assert.equal(table.mouth.length, 8);
    for (const list of Object.values(table)) {
      for (const c of list) {
        assert.ok(c.title.length > 0 && c.artist.length > 0);
      }
    }
  });
}

test('resolved CREDITS / STR match one locale table consistently', () => {
  assert.equal(CREDITS.eye.length, 10);
  // Whichever locale the runner env resolves to, STR is that table verbatim.
  const isZh = STR.btnSave === STR_ZH.btnSave;
  assert.equal(STR.btnSave, isZh ? STR_ZH.btnSave : STR_EN.btnSave);
  assert.equal(CREDITS.eye[8].title, isZh ? CREDITS_ZH.eye[8].title : CREDITS_EN.eye[8].title);
});

test('zh copy covers every en key (no missing localization keys)', () => {
  for (const k of Object.keys(STR_EN)) {
    assert.ok((STR_ZH as Record<string, string>)[k]?.length > 0, `zh missing key: ${k}`);
  }
});

test('no medical register anywhere in user-facing copy or credits (en + zh)', () => {
  const en = ['surgical', 'operation', 'scalpel', 'clinic', 'doctor', 'patient', 'hospital'];
  // 'SURGERY' the wordmark is a brand signature and stays; the ban is on
  // medical *register* leaking into copy — including Chinese medical words.
  const zh = ['手术', '医疗', '医生', '病人', '医院', '临床', '手术刀', '缝合', '外科'];
  const collect = (
    str: Record<string, string>,
    credits: Record<string, {title: string; artist: string}[]>,
  ) =>
    [
      ...Object.values(str),
      ...Object.values(credits).flatMap((l) => l.flatMap((c) => [c.title, c.artist])),
    ].join(' ');
  const enText = collect(STR_EN, CREDITS_EN).toLowerCase();
  for (const w of en) assert.ok(!enText.includes(w), `en medical word leaked: ${w}`);
  const zhText = collect(STR_ZH, CREDITS_ZH);
  for (const w of zh) assert.ok(!zhText.includes(w), `zh medical word leaked: ${w}`);
});

test('audio URLs are https-or-empty and every sfx has an explicit duration cap', () => {
  for (const [name, url] of Object.entries(AUDIO)) {
    assert.ok(url === '' || url.startsWith('https://'), `${name} must be durable https`);
    if (name !== 'bgm') {
      assert.ok(SFX_DURATIONS[name] > 0 && SFX_DURATIONS[name] <= 1.5, `${name} duration bounded`);
    }
  }
});
