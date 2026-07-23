# hardening-report — Surgery（art-history face collage）

date: 2026-07-23
thread: waku-harden（无人模式，dispatch-harden.md 派工）
本管线端口：**8891**
artifact directory: **项目根**（`/Users/balaja/waku-projects/0722_waku_surgery`）——
见「Graft and gate」为何没有 `shell/`。

## 完成状态

硬化完成，三层烟测全绿（详见 smoke-report.md）。工具链门禁在硬化改动后仍
green（`npm run lint` clean / `npm run test` 22 pass / `npm run build` 出
`dist/index.html`）。所有改动限于**贴合层**（compliance / safe-area /
localization / fonts / device-fit / style / evidence），未触碰状态机语义、
玩法参数或核心循环；fix-01…fix-13 已定稿视觉零回退。

## 0. Shell graft + gate

### 壳体移植：环境阻断，产物留在 vanilla-at-root（非退回项）

标准壳体移植的第一步是 `waku initial_repo pull <root>/shell`。该命令在本机
**仍然 404**（与 build-report 注记 #7 一致）：

```
Initial repo clone failed: remote: Repository not found.
fatal: repository 'https://github.com/polyverse-ai/polyverse-session-template-dev.git/' not found
```

本账号对私有模板仓无读取权限（重试确认；`waku 0.4.5`）。据 transplant.md，
壳体本应提供 `safe-area.tsx` / `lib/i18n.ts` / `lifecycle.ts` /
`audio-lifecycle.ts` / `runtime-contract-check` / `auto-smoke.mjs` 等预制件——
这些在本机**不可得**。全机搜索无任何已克隆壳体。

**处置（非退回）**：这是权限/环境阻断，不是 Build 缺陷（vanilla 交接是正常
态），也不是可退回 Create/Build 的结构/方向问题（产物不需重构即可 green）。
按 template-compliance.md「Failure」条款，环境阻断**记为 blocker 并继续**。
决定性旁证：同管线已交付项目 `0722_waku_pivoting-circles`（memory 记为
"refit pipeline's first full delivery, live on Playground"）用的正是**同一
vanilla-at-root 结构**（根级 `index.html` + `metadata.json` + `src/waku/` 手接
wrapper + `dist/` 产物，无 `shell/`），经 `waku push ./dist` 成功上线。故本线程
把**根目录视作 artifact 目录**，在其上完成移植该做的接线（见下），门禁与后续
阶段都在根目录 build（`dist/`）。

- **平台调用 wrapper**：唯一 wrapper `src/waku/polyverse.ts`（`readyWakuRuntime()`
  + composeComment / assets.upload / media.openImage），Build 已接好，Harden
  仅**新增 host 安全区消费**（见 §1）。无第二个手写 wrapper。
- **manifest / vendor runtime / metadata**：Build 已接（`index.html`
  polyverse-manifest + `public/vendor/polyverse-content-runtime.min.js` +
  `metadata.json requestFramePermissions:["camera"]`）；Harden 未改，capabilities
  仍与代码调用一一对应（新增的 `pv.host.safeArea()` 属默认能力集，无需新声明——
  runtime/app-host.md「三法都在默认集」）。

### 门禁（gate）

| 阶段 | 到达基线（改动前） | 硬化后（最终） |
|---|---|---|
| `npm run lint`（tsc --noEmit） | clean | clean |
| `npm run test`（node:test） | 19 pass / 0 fail | **22 pass / 0 fail** |
| `npm run build`（vite） | 出 `dist/index.html` @root | 出 `dist/index.html` @root |

- 到达基线即全绿（vanilla 产物本身可过门禁），无需修红。
- build 唯一告警是 `vendor script can't be bundled without type=module`——那是
  故意的经典脚本标签（vendor runtime 须在 module 前 patch `window.Polyverse`），
  **非错误**，`dist/index.html` 正常产出。
- **`public/` vs `dist/`**：模板要求 build 出 `public/`；vanilla vite 里
  `public/` 是静态输入目录、`dist/` 是产物目录。无壳体故沿用 vanilla 约定
  （`dist/`），与 pivoting-circles 交付一致（`waku push ./dist`）。非阻断，记此。

## Change list（file / what / why）

| # | file | what | why |
|---|---|---|---|
| 1 | `src/i18n.ts`（新） | locale 检测（navigator.languages→zh/en，其它→en）+ 载入即定 `LOCALE` + 同步 `<html lang>` | 壳体 `lib/i18n.ts` 不可得，在**文本层**补最小自足 i18n（无切换 UI，符合 brief + localization.md） |
| 2 | `src/content.ts` | 拆 `STR_EN/STR_ZH`、`CREDITS_EN/CREDITS_ZH`，按 `LOCALE` 解析导出 `STR/CREDITS`（call site 零改）；加 `CREDIT_SEP`（zh 全角「：」）、`CARD_FONT`（canvas 字体 token） | 填 zh 层 + 文化迁移；canvas 文字与 UI 同源一张表 |
| 3 | `src/engine/polaroid.ts` | 信用行改用 `CREDIT_SEP`；canvas 字体改 `CARD_FONT.credit/logo`（zh 走 CJK sans，字标留 Latin mono） | canvas 文字读同一 locale 表（localization.md）；无散落硬编码字体（typography.md） |
| 4 | `src/index.css` | `html[lang="zh"]` CJK 字体栈；安全区 `:root` 变量重构（top/bottom 均按 `--waku-*`/`--sys-*` 参数化，含 16px Zone C-safe 呼吸边） | zh 字体矩阵；安全区数值按平台壳校准（dispatch 要点） |
| 5 | `src/App.tsx` | boot 调 `applyHostSafeArea()`；快门 `bottom` 改 `var(--surgery-shutter-inset)`；fallback 提示移到顶栏下方 + 加深对比（white/45→/70 + text-shadow） | 消费 host 安全区；快门避开底部宿主导航带；提示脱离宿主顶栏 chrome + 修白字低对比 |
| 6 | `src/waku/polyverse.ts` | `PolyverseRuntime.host.safeArea` 类型 + `applyHostSafeArea()`（`pv.host.safeArea()`→`--sys-*`，全 guard 降级） | 无壳体时消费真机刘海/Home 条安全区（app-host.md「安全区必须消费」） |
| 7 | `src/components/TopBar.tsx` | SAT 百分比加 `tabular-nums` | number 角色等宽，数字变化不推挤布局（typography.md） |
| 8 | `tests/content.test.ts` | 加：en+zh 双语槽位覆盖、zh 缺键校验、locale 解析一致、**中英双语医疗词禁用** | 锁双语覆盖 + brief 硬规「零手术/医疗语义」在 zh 侧同样成立 |

## 1. Safe-area implementation

- **变量组成**（`src/index.css` `:root`，与 safe-area.md 公式对齐）：
  - `--surgery-safe-top = max(env(safe-area-inset-top), --sys-top, --gallery-safe-area-top)`
  - `--surgery-top-chrome = var(--waku-top-nav-band, 56px)`（WAKU 顶栏带）
  - `--surgery-topbar-inset = safe-top + top-chrome(56) + 16(呼吸)`
  - `--surgery-bottom-nav = var(--waku-bottom-nav, 60px)`；
    `--surgery-bottom-margin = var(--waku-bottom-margin, 22px)`
  - `--surgery-shutter-inset = bottom-nav(60) + bottom-margin(22) = 82`（**平摊**，
    「no extra safeAreaBottom」——宿主底部导航已含 Home 条，不重复叠加）
  - 每个带都是 `var(--waku-*, <参考默认>)`：gallery/裸浏览器用参考常数；宿主壳
    注入真实 `--waku-*` / `pv.host.safeArea()`→`--sys-*` 时自动接管。
- **安全层容器**：顶栏 `#topbar`（`top: var(--surgery-topbar-inset)`）、快门
  `#shutter`（`bottom: var(--surgery-shutter-inset)`）、结果层 `#result-overlay`；
  full-bleed 层 = `#stage-frame` 内 engine canvas。几何全部走 CSS 变量，无逐机型硬编码。
- **host 消费**：`applyHostSafeArea()` 在 boot 读 `pv.host.safeArea()` 写四个
  `--sys-*`；裸浏览器/无 host/调用 reject 全 no-op，env() 兜底。
- **快门位移**：Build 无壳体时把快门钉在 `env+26px`（会被宿主 60px 底部导航吃掉）。
  校准后升到 82px 带上沿——属**安全区数值校准**（dispatch 明列要点），非底部圆形
  快门视觉设计的回退。三档实测快门 `bottom` 恰 = `screenH-82`（585/770/874），
  贴带上沿。三环 selection-focus 实测均**不被快门遮挡**（eye 494,382 / nose
  231,197 / mouth 362,707 vs 快门 x160-234 y696-770，全 CLEAR），故 engine
  `LAYOUT_RESERVE` 无需改。
- **禁用清单逐条**：无 `aspect-ratio` 硬锁、无 `max-width` 手机壳、无 letterbox/
  黑边、无假阴影/卡壳；无逐机型硬编码；chrome 全走 flex+百分比+CSS 变量；
  full-bleed 层无 inset。三档实测 full-bleed（frame==viewport，见 smoke L3）。

## 2. Localization coverage

- **locale 表位置**：`src/content.ts`（`STR_EN/STR_ZH` 16 键 ×2 + `CREDITS_EN/ZH`
  三类 26 槽 ×2）；检测机制 `src/i18n.ts`。canvas 文字（polaroid 信用/字标）读
  同一表（`CARD_FONT` + `CREDIT_SEP`）。
- **键覆盖**：STR 16/16 双语齐（test 校验缺键=0）；CREDITS eye10/nose8/mouth8
  双语齐（test 校验）。**无散落单语硬编码**（grep：所有 UI/canvas 文字过 `STR`/
  `CREDITS`）。缺键回退 en（i18n 规则）。
- **文化迁移策略（记录哪些直译/哪些转写）**：
  - `SURGERY` 字标（bootTitle/cardLogo）**双语不译**——它只是项目名/署名，
    译成「手术」会引入 brief 明禁的医疗语义。
  - UI 文案**转写非直译**，保美术馆机智语气 + 信息密度：`hanging the
    collection…→正在布展…`、`the mirror needs your camera→这面镜子需要用到你的
    摄像头`、`my face, remixed by art history→我的脸，被艺术史重新拼贴` 等。
  - 画作信用**用中文美术史标准名 + 译名**（观众实际用的名）：`Mona Lisa—
    Leonardo da Vinci→《蒙娜丽莎》—列奥纳多·达·芬奇`、`Girl with a Pearl
    Earring—Vermeer→《戴珍珠耳环的少女》—约翰内斯·维米尔` 等 26 条。分隔符
    zh 用全角「：」。
  - 安全边界双语一致：`no medical register` 测试同时禁英文（surgical/scalpel/…）
    与中文（手术/医疗/医生/病人/医院/临床/手术刀/缝合/外科）词表。
- **三档语言实测**（smoke L3）：zh-CN→`<html lang>=zh` + 卡片「再来一张」/信用中文；
  en-US→en；fr-FR→en 回退。无可见语言切换入口。

## 3. Font system（按角色）

| role | 绑定 | 处置 |
|---|---|---|
| display | SURGERY 字标（boot 标题 / 卡片字标） | mono、大字距；双语留 Latin mono |
| ui | 顶栏图标钮 / 结果页 Save·Share·One more / SAT 标签 | `--font-sans`；zh 下 CJK 栈接管 CJK 字形 |
| body | 无长文 | N/A |
| number | SAT 百分比 | 加 `tabular-nums`，`w-8 text-right` 定宽，数字不推挤 |
| feedback | 无 combo/命中反馈 | N/A |
| caption | fallback 提示 / boot 加载语 / 结果状态行 | 小字；提示在场景上加 text-shadow scrim（见对比处置） |

- **locale 字体矩阵**：`en` = `Inter, ui-sans-serif, system-ui, …`；`zh`
  （`html[lang="zh"]`）= `Inter, -apple-system, "PingFang SC", "Microsoft
  YaHei", "Noto Sans CJK SC", …`（Latin/数字留 Inter，CJK 逐字回退系统中文
  字面）。canvas 走 `CARD_FONT` 单一 helper：zh 信用改 CJK sans（mono 无 CJK
  字形），字标恒 Latin mono。无捆绑 CJK 包。
- **对比处置（白底白字防线）**：fallback 提示由 `white/45`→`white/70` +
  `text-shadow 0 1px 3px rgba(0,0,0,.55)`（原直压场景，亮背景会白字白底）。
  顶栏白图标/白字在 white/50 磨砂药丸上靠 fix-12/13 已定稿的深色 drop-shadow
  兜底（玩家亲选全白观感，dispatch 禁回退，保留原样、仅复验 token 在位）。
  结果层文字在 `bg-black/70` 上、boot 文字在 `#070707` 上——高对比。
- **CDN 字体**：Inter/JetBrains 走 fonts.googleapis（`&display=swap`）。加载失败
  = swap + 系统 fallback（token 已含 `ui-sans-serif`/`ui-monospace`/CJK 系统栈），
  **不空屏、不透明字**（满足 typography.md 硬线）。自托管为可选，见 pending。

## 4. Device-fit conclusion（三档竖屏，独立实测 smoke L3）

| 档 | viewport | full-bleed | 顶栏在 Zone C 内 | 快门在底带上沿 | 结论 |
|---|---|---|---|---|---|
| iPhone SE 3 | 375×667（top20/bot0） | frame 375×667=viewport ✓ | top 92 ≥ zoneC_top 76 ✓ | bottom 585 ≤ zoneC_bottom 585 ✓ | PASS |
| iPhone 15/17 Pro | 393×852（top59/bot34） | 393×852=viewport ✓ | 131 ≥ 115 ✓ | 770 ≤ 770 ✓ | PASS |
| iPhone 17 Pro Max | 440×956（top62/bot34） | 440×956=viewport ✓ | 134 ≥ 118 ✓ | 874 ≤ 874 ✓ | PASS |

三档均无 letterbox、无 inset 溢出、双语文案不溢出（zh 卡片信用最长行实测入框，
`fitLine` 省略兜底）、SAT 数字 `tabular-nums` 稳定不跳。

## 5. Style alignment（before / after）

- 硬化前后**视觉主体零回退**（fix-01…fix-13 定稿：白细线 HUD、窗口取景框
  frame.svg 样式、玻璃环、暖色油画背景、白磨砂顶栏、拍立得暖白卡 + mono 信用）。
- caption 对比：fallback 提示白字低对比 → 加 scrim（唯一 style/对比修正）。
- 骨架期通用占位美学核查：grep 无 `[TRACKING]`/lorem/placeholder/TODO；素材为
  真实名画裁切（非 emoji/CSS 几何/文字占位），alpha 抠像在 `parts.ts` 羽化。
  图内无文字（信用/字标均代码文本层）。
- 结论：风格统一，与素材（欧洲经典绘画 + 美术馆语汇）一致，无需再对齐。

## 6. 手势项目两规（玩家 2026-07-22 普世要求）

产物含摄像头手部交互（HandLandmarker 掌拨转盘，与触屏拖转双通道同权）。

- **规一（上半为手舞台、主体中下、手区无死白）**：**满足**。全屏 full-bleed
  场景（油画背景 + 三环 + 名画裁切 + 顶栏），无任何死白区；核心主体（换脸拼贴）
  居中偏下。实测 smoke L3 截图逐帧确认。
- **规二（未检测到手时虚线手形引导 + 文字提示，检测到即淡出、会话不再现）**：
  **未补齐，记 pending / 送裁候选**（非阻断）。原因：规二要求的「文字提示」与
  create-brief 硬定的核心 Hook「**不出现任何文字教学**」+「开局就变脸、触屏自明
  affordance」直接冲突；build-contract 已把 7 条手势逐条裁为「不引导」（掌拨为
  触屏之外的**次要等价**通道，非必需主输入）。按 harden 边界（不改核心 Hook）
  与规二自身条款（触碰玩法语义/方向→记退回候选），本线程**不擅自加与已定稿
  Hook 相悖的文字教学**，也不擅自加可能误导（让人以为必须举手）的手形引导。
  产物零改即可玩、Hook 完整，属需玩家仲裁的「规则 vs brief」冲突，无人模式记
  pending。建议裁定：(a) 保持现状（Hook 优先），或 (b) 授权 Create/Build 加一个
  **纯视觉、无文字**的掌拨手形微提示（仅暗示第二通道）。

## Unfixed items and reasons（pending / send-back candidates）

1. **[环境阻断] 壳体移植**：模板私仓 404，产物留 vanilla-at-root（同
   pivoting-circles 已交付先例）。门禁全绿、平台接线到位。→ Release 若获仓库权限
   需与最新模板 SOP 对齐；否则按 `waku push ./dist` 交付。**非退回**。
2. **[送裁候选] 手势规二**：见 §6，规则 vs 已定稿 Hook 冲突，待玩家仲裁。非阻断。
3. **[accept-with-record] MediaPipe wasm/models 走 CDN**（jsdelivr +
   storage.googleapis）：失败路径已证兜底可玩（smoke L3 model-CDN-blocked→
   fallback→出卡 PASS）。本地化打包为可选，成本高、失败已覆盖 → 留 Release 决策。
4. **[accept-with-record] Google Fonts CDN**（Inter/JetBrains）：swap + 系统栈
   兜底，不空屏/不透明字。自托管为可选优化，留 Release。
5. **[pending] 真机 iOS WKWebView**：`env()`/getUserMedia/GPU delegate 帧率仅
   headless 测（headless 无 GPU，推理占 CPU）。真机数值（`engine.renderFps`/
   `frameMs` 计数器内置）+ 真手掌拨转手感（`stage.ts TUNING`）归 Release/设备 QA。
6. **[pending] zh 画作译名**：26 条为美术馆标准/高置信译名；玩家如有权威清单可
   直接改 `CREDITS_ZH`（与 `CREDITS_EN` 同为最佳努力辨认，build-report 注记 #4）。

移植与门禁完成后进入 review（review-report.md）与 smoke（smoke-report.md）。
