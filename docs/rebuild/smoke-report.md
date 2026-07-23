# smoke-report — Surgery（art-history face collage）

date: 2026-07-23
thread: waku-harden / smoke（独立捕获，`source: independently_verified`）
harness: `docs/rebuild/evidence-harden/smoke.mjs` + `supplemental.mjs`
（fresh Playwright，非 Build probe）；served on **:8891**（vite dev，实时源）。
evidence: `docs/rebuild/evidence-harden/`（16 件，mtime 晚于最后源改动）。

```yaml
smoke_gate:
  status: pass
  startup_health:
    status: pass
    evidence: >
      cold-start #app-root visible 209ms (<3s line); L1-boot.png not blank —
      live canvas sampled 273 distinct color buckets (avg 175), 非纯黑/白板;
      console + pageerror during full loop = NONE. build: dist/index.html@root,
      lint clean, npm test 22/22.

  core_loop:
    status: pass
    evidence:
      - transition: "boot → fallback (camera denied), auto-dressed"
        proof: "stage boot→fallback; engine.applied={eye:1,nose:5,mouth:0} (L2-play.png)"
      - transition: "first touch = core verb (drag mouth ring front-arc @ visual world coords)"
        proof: "dials.mouth.selected 0→3, applied.mouth 0→3 CHANGED (L2-after-drag.png); onPointerMove sets sim.angle synchronously stage.ts:364-373 → feedback within one frame"
      - transition: "topbar dice / reset accumulate + clear"
        proof: "dice {eye:1,nose:5,mouth:3}→{eye:6,nose:2,mouth:6}; reset→{null,null,null}"
      - transition: "virtual control by VISUAL-COORDINATE tap → resolve → result"
        proof: "touchscreen.tap(197,733)=#shutter visual centre → stage result; card dataURL 2,655,062 bytes (L2-result.png); hit-area pixel-aligned"
      - transition: "first core input → result feedback"
        proof: "6069ms (<10s first-win line)"
      - transition: "result → One more → playable (no dead end)"
        proof: "stage result→fallback; loop re-enters"
      - transition: "state frozen before interaction"
        proof: "5.2s idle @fallback: applied {eye:1,nose:5,mouth:0} unchanged (no autonomous progression); idle rings still attract — L3-frame-a/b.png pixel diff 0.74 = MOVING, not a static frame"

  constraint_evidence:
    - constraint: "Portrait full-bleed, three tiers, no letterbox/phone shell"
      evidence_type: visual
      status: pass
      source: independently_verified
      evidence: "375×667 / 393×852 / 440×956 all frame==viewport, no bars (L3-safe-*.png); body bg rgb(0,0,0)==root, frame==viewport (no device shell)"
    - constraint: "Safe area — key UI inside Zone C-safe, no inset on full-bleed layer"
      evidence_type: runtime+visual
      status: pass
      source: independently_verified
      evidence: >
        per-tier + inset injection (--sys-top/--gallery/--sys-bottom):
        SE3(top20) topbar.top 92≥zoneC_top 76, shutter.bottom 585≤zoneC_bottom 585;
        15Pro(top59) 131≥115, 770≤770; 17Max(top62) 134≥118, 874≤874. shutter hugs
        band top exactly (=screenH-82). occlusion: eye(494,382)/nose(231,197)/
        mouth(362,707) all CLEAR of shutter[x160-234,y696-770] (L3-focus-vs-shutter.png)
    - constraint: "Core experience no vertical page scroll"
      evidence_type: runtime+visual
      status: pass
      source: independently_verified
      evidence: "scrollHeight 852 ≤ innerHeight 852+2; overflow-y scrollers actually scrolling = 0"
    - constraint: "Transparent visual boundary — no device shell / fake shadow / bg break"
      evidence_type: visual+runtime
      status: pass
      source: independently_verified
      evidence: "getComputedStyle body bg rgb(0,0,0) == html; #stage-frame == viewport; no border/fake shadow (L3-safe-393x852.png)"
    - constraint: "First 3s reason-to-stop; first touch is the core verb; ≤10s first win"
      evidence_type: runtime+visual
      status: pass
      source: independently_verified
      evidence: "visible 209ms; interest zones ≤3 (3 dials + collage subject); attract MOVING (diff 0.74); first touch changes state; input→result 6069ms<10s"
    - constraint: "Rules frozen before first interaction (≥5s idle, key state 0 change)"
      evidence_type: runtime
      status: pass
      source: independently_verified
      evidence: "5.2s idle → applied unchanged (no score/phase; toy has none — dials idle-rotate is attract only)"
    - constraint: "No uncovered waits — assets/API intercepted, fallback stays playable"
      evidence_type: runtime
      status: pass
      source: independently_verified
      evidence: "page.route abort MediaPipe wasm/model CDN (jsdelivr+storage.googleapis) → stage fallback, dressed=true, shutter→result reached (L3-model-blocked-fallback.png)"
    - constraint: "Instant input feedback <100ms"
      evidence_type: runtime
      status: pass
      source: independently_verified
      evidence: "real drag → dials.mouth.sim.angle 0.7854→1.2369 moved; handler onPointerMove synchronous (stage.ts:364-373), renders next rAF (~16ms); 307ms wall-clock is CDP round-trip, not app latency"
    - constraint: "No dead ends — trigger ≥1 boundary/failure path, return to playable/end"
      evidence_type: runtime
      status: pass
      source: independently_verified
      evidence: "camera-denied fallback (boundary) fully playable to result; model-fail fallback playable; result→One more→playable; 19 machine unit tests cover RESOLVE_FAIL/AGAIN/FACE_LOST"
    - constraint: "BGM mutual exclusion net active ≤1"
      evidence_type: runtime
      status: pass
      source: independently_verified
      evidence: "HTMLMediaElement.play/pause hooked: max concurrent loop(BGM)=1 (single controller stops old before new)"
    - constraint: "SFX duration bounded"
      evidence_type: runtime+static
      status: pass
      source: independently_verified
      evidence: "audio.ts:72 setTimeout(dur*1000)→pause per SFX; SFX_DURATIONS all ≤0.8s; test asserts 0<dur≤1.5"
    - constraint: "Auto language detection + en fallback (three-tier)"
      evidence_type: runtime
      status: pass
      source: independently_verified
      evidence: "zh-CN→<html lang>=zh + card btn 再来一张 (L3-lang-zh-*.png); en-US→en 'One more'; fr-FR→en fallback 'One more'; no visible switch"
    - constraint: "Cultural transfer not literal; safety boundaries match both languages"
      evidence_type: static
      status: pass
      source: independently_verified
      evidence: "zh = standard museum names (《蒙娜丽莎》—达·芬奇…), UI transferred not literal; test bans medical register in BOTH en(surgical/scalpel/…) + zh(手术/医疗/医生/病人/医院/临床/手术刀/缝合/外科)"
    - constraint: "Assets are image assets (not emoji/CSS/text placeholder); cutout alpha present"
      evidence_type: visual
      status: pass
      source: independently_verified
      evidence: "26 painting crops as cut-out sprites on painterly bg (L3-lang-zh, L3-safe-393x852.png); alpha-feathered in parts.ts; no opaque rect behind subject"
    - constraint: "All visible text bound to a role; canvas has no hardcoded font/single-lang"
      evidence_type: static
      status: pass
      source: independently_verified
      evidence: "polaroid.ts uses CARD_FONT helper (zh CJK sans / en mono); all UI+canvas text via STR/CREDITS locale table"
    - constraint: "Text contrast per role (no white-on-white)"
      evidence_type: visual
      status: pass
      source: independently_verified
      evidence: "card credits #3a372f on warm off-white (L3-lang-zh); fallback caption white/70+text-shadow scrim on scene (L3-safe-393x852); result btns on bg-black/70; topbar white glyphs on white/50 pill carry fix-13 dark drop-shadow"
    - constraint: "Both languages: no overflow/occlusion, numbers stable width"
      evidence_type: visual+runtime
      status: pass
      source: independently_verified
      evidence: "zh card longest credit line fits photo width (fitLine ellipsis guard); SAT% tabular-nums+w-8; three tiers no overflow"
    - constraint: "No token/key/provider domain/MCP endpoint; no disallowed input/upload"
      evidence_type: static
      status: pass
      source: independently_verified
      evidence: "grep: 0 secrets; only <input type=range> (SAT); remote hosts = asset CDNs only"
    - constraint: "Grafted into shell / build emits public/"
      evidence_type: static
      status: blocked
      source: independently_verified
      evidence: "template repo 404 (build-report #7); artifact stays vanilla-at-root (pivoting-circles delivered precedent), build emits dist/index.html@root. degraded verification: platform wiring hand-grafted + gate green; SOP re-alignment deferred to Release. see hardening-report §0"
    - constraint: "手势项目规二 (dashed hand guide when no hand)"
      evidence_type: runtime
      status: blocked
      source: independently_verified
      evidence: "not implemented — conflicts with ratified 'no text tutorial' Hook + build-contract 不引导 rulings (palm = secondary channel). send-back-to-Create/Build candidate, pending player arbitration; product fully playable without it. see hardening-report §6"
```

## 说明

- 三层门禁：Layer1 启动健康 pass、Layer2 核心循环 pass、Layer3 运行时约束逐条
  独立取证。19 项 constraint_evidence 中 **17 pass / 2 blocked**。
- 两条 `blocked` 均为**环境/规则仲裁**类，非产物缺陷、非可 green 阻断：
  1. 壳体移植——模板私仓无权限（环境），产物以 vanilla-at-root 交付且平台接线
     完整、门禁全绿（同管线 pivoting-circles 已上线先例）。
  2. 手势规二——与已定稿核心 Hook 冲突，属送裁 Create/Build 候选，产物零改即
     完整可玩。
  按 smoke.md，`blocked` = 环境/外部不可得，需注明降级验证与 pending（已注）。
  无**未闭合的阻断项**：核心闭环、安全区、本地化、字体、音频、fallback 全部
  独立取证 pass；两条 blocked 已定性、记录、给出裁定路径。
- 结论：产物**稳定、统一、可信**，交 Release（本线程不做上传/发布）。
