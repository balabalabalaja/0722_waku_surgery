# review-report — Surgery（art-history face collage）

date: 2026-07-23
thread: waku-harden / review（独立视角：只读 create-brief / build-contract /
build-report / hardening-report / artifact 文件 / waku-Harden reference；
未读工作期对话历史）

## review_status: **pass**

产物在贴合层稳定、统一、可信；无阻断项。两条已知偏离均已定性、可控、记录在案。

## Blocking findings

**无。**

## Constraint deviations（constraints-checklist.md 逐项，仅列偏离/需说明项）

| 约束 | 实现 | 理由是否成立 | 残余风险 | 处置 |
|---|---|---|---|---|
| Grafted into platform shell along seams | 模板私仓 404，无壳体；产物 vanilla-at-root，平台接线（manifest/vendor/wrapper/safe-area/host 消费）在根目录完成 | 成立（环境阻断，非 Build 缺陷；同 pivoting-circles 已交付先例） | 与最新模板 SOP 可能有漂移 | accept-with-record；Release 获仓库权限后对齐 |
| build emits `public/` w/ index.html at root | 出 `dist/index.html`@root（vanilla vite：public/=静态输入、dist/=产物） | 成立（无壳体则沿 vanilla 约定；`waku push ./dist`） | 无 | accept-with-record |
| Restrained guidance / 手势规二虚线手形引导 | 未加（与 brief「不出现任何文字教学」核心 Hook + build-contract「不引导」裁定冲突） | 成立（触碰核心 Hook，属送裁而非硬化擅改） | 玩家或希望第二通道有提示 | **send-back-to-Create/Build candidate**（非阻断，见 hardening §6） |
| Asset refs use durable GCS URLs; no local files/base64 | 音频=绝对 durable GCS；名画裁切/背景=**同源打包**静态文件（`public/parts`、`public/bg`，随站点上传到 durable GCS 子目录，相对 BASE_URL 解析） | 成立（build-contract 明为 CORS 安全：卡面 canvas `toDataURL` 不被跨域污染；非 base64/dev-local） | 无 | accept |
| AI via window.Polyverse；无 token/key/域 | 无内容内 AI（brief）；grep 无任何 token/key/secret/provider 域/MCP 端点 | 成立 | 无 | pass |

其余约束（门禁/循环/主交互/画布视口/首屏节奏/音频/素材本地化/字体/安全）均
**已实现（非仅声明）**，证据见下与 smoke-report.md。

## 1. Code review（vs constraints-checklist，file:line + 判定）

- **单一 runtime wrapper**：`src/waku/polyverse.ts:28` `readyWakuRuntime()` 唯一入口；
  无第二 wrapper（grep 确认）。门禁绿即证。**实现**。
- **安全区非硬编码**：`src/index.css:38-49` `:root` 全 CSS 变量组成，`src/App.tsx:160`
  顶栏 `top:var(--surgery-topbar-inset)`、`:178` 快门 `bottom:var(--surgery-shutter-inset)`；
  无逐机型像素。**实现**。
- **host 安全区消费**：`src/waku/polyverse.ts:73` `applyHostSafeArea()` 读
  `pv.host.safeArea()`→`--sys-*`，全 guard；`src/App.tsx:50` boot 调用。**实现**。
- **locale 机制**：`src/i18n.ts:15` `detectLocale()`（navigator.languages→zh/en，
  其它→en）、`:34` `LOCALE`、`:39` 同步 `<html lang>`；`src/content.ts:65,131`
  按 LOCALE 解析导出。**实现**（非仅声明——smoke L3 三档实测）。
- **canvas 文字读同表 + 无硬编码字体**：`src/engine/polaroid.ts:4` 导入
  `CARD_FONT/CREDIT_SEP`，`:102`/`:111` 用 `CARD_FONT.credit(27)`/`logo(24)`，
  `:16-24` 用 `CREDIT_SEP`；无散落 `NNpx Arial`。**实现**。
- **number 等宽**：`src/components/TopBar.tsx:76` SAT% 加 `tabular-nums`+`w-8`。**实现**。
- **primary interaction 单一 + 命中硬排序**：`src/engine/stage.ts:264` `onPointerDown`
  四角手柄>框体>环带排他排序（fix-07），`:165-168` 仅 canvas 绑 pointer；侧栏/快门
  `stopPropagation`。**实现**（一套横向拨转手势族，双通道=触屏+掌拨）。
- **虚拟控件命中对齐**：smoke L2 快门**视觉坐标** tap (197,733)→result，证像素级对齐。
- **BGM 互斥 ≤1**：`src/engine/audio.ts:6-29` 单 controller（play 前 stop 旧轨）；
  smoke L3 hook 实测 max concurrent loop=1。**实现**。
- **SFX 时长有界**：`src/engine/audio.ts:72-74` 每条 `setTimeout(dur*1000)→pause`，
  `content.ts:77` `SFX_DURATIONS` 全 ≤0.8s；`tests/content.test.ts` 断言 0<dur≤1.5。**实现**。
- **无输入/上传/身份采集**：grep 仅 `TopBar.tsx:67` `<input type="range">`（SAT）；
  无 text/textarea/form/upload/localStorage 身份。**实现**（合 brief）。

## 2. Test validity review

- **命令**：`npm run test`（`tsx --test tests/*.test.ts`）→ **22 pass / 0 fail**
  （exit 0）。tests：`content`（8：双语槽位覆盖、缺键、locale 解析、双语医疗词禁）、
  `dialmath`、`facefit`、`machine`（含 happy-path/fallback/dead-end liveness）。
- **覆盖关键路径**：状态机 happy-path（boot→ready→active→resolve→result→active）、
  相机拒绝 fallback、模型失败 fallback、face-loss 不失败态、dead-end liveness、
  转盘选择跟前弧焦点、掌拨方向、动量吸附——均有断言。
- **断言可失效（mutation testing，仅在 scratchpad 副本，真树未动）**：
  - 突变①：`CREDITS_EN.eye` 删一条（10→9）→ `[en] credits cover every sprite
    slot` **FAIL**（zh 仍 pass，证只 en 被突变）。
  - 突变②：`machine.ts` SHUTTER→resolve 改 no-op → `happy path` + `shutter works
    from ready` **2 test FAIL**。
  - 结论：断言真实咬合，非空快照。
- **零改动复核**：非 git 仓，用内容核验——突变仅作用于
  `scratchpad/mut/` 副本；真树 `src/engine/machine.ts:76` 仍
  `return {...s, stage: 'resolve', prevPlay: s.stage};`（原样），`src/content.ts`
  `CREDITS_EN.eye` 仍 10 条。硬化改动后最终门禁绿（lint/22 test/build）。

## 3. Delivery cross-check（vs create-brief 逐项）

| brief 项 | 交付 | 判定 |
|---|---|---|
| 一句话方向（相机+三名画五官转盘环头→拨转换脸→白框调形→快门 credits 卡） | 全链在（smoke L2 走通；zh/en 卡片实拍） | ✓ delivered |
| Hook（检测到脸 1s 内自动换脸、环已在动、不出现文字教学） | fallback/active 即随机整套飞落；环 idle 缓转（smoke attract MOVING）；零文字教学 | ✓（硬化未加任何教学，见规二 pending） |
| 核心乐趣 D（640 组合搭配装扮） | 26 素材全上环 + 拨转/骰子/重置/白框调形（smoke 实测 dice 改、reset 清、拖环换件） | ✓ |
| 支线 G（镜像名画反差喜剧） | 实时镜像 + 椭圆羽化贴脸（fallback 抽象 sitter 亦成拼贴，卡片可证） | ✓ |
| 核心循环（拨转→咔哒落脸→credits 更新→快门） | 拖环 selected 0→3、applied 0→3、credits 由 applied 定 | ✓（硬化零改语义） |
| 结束点/结果资产（快门→拍立得卡 + 英文/中文 credits + SURGERY 字标 + 保存/分享） | `polaroid.ts` 合成卡（2.65MB dataURL）；Save/Share 按钮 | ✓（字标双语留 Latin） |
| 文化语境（英文起步、zh 仅 credits 需译归 Harden） | Harden 补 zh：credits + UI 全覆盖、无切换、fr→en 回退（smoke L3） | ✓ delivered（超出「仅 credits」——UI 亦译，加分不减分） |
| 明确不做（无医疗语义/无内容内 AI/无计分限时/单只右眼/无第四盘/无 [TRACKING]） | test 断言中英双语零医疗词；无 AI；状态机无计分/计时；grep 无 [TRACKING] | ✓ 全部守住 |

**Build/Harden 有无静默改动**：无。硬化改动全在贴合层（i18n/字体/安全区/对比/
等宽），状态机 `machine.ts`、玩法参数（`stage.ts TUNING`）、核心循环、fix-01…13
视觉零改。

## 4. Safety boundary review

- **采集面**：仅 SAT range 滑杆（`TopBar.tsx:67`）；无文本/上传/身份/自由输入
  （grep `<input|<textarea|<form|FileReader|prompt(|localStorage.setItem` 无命中）。
  合 brief（镜子玩具，无采集）。
- **凭据泄漏**：grep `api_key|secret|token|bearer|authorization|openai|anthropic|
  password|credential|.env` 无真实命中（仅注释「no secrets live here」+ BASE_URL
  资产路径）。远程域仅 asset CDN（jsdelivr / fonts.googleapis / storage.googleapis），
  无 AI provider/MCP 端点。
- **内容内 AI**：不用（brief）；无模型/触发点/离线 fallback 需求。N/A。
- **多人**：track frozen，N/A。

## Non-blocking notes（改进建议，不阻断）

1. Release 可评估把 MediaPipe wasm/models + Google Fonts 自托管打包，去 CDN 弱网
   首载依赖（失败已兜底，非阻断）。
2. 手势规二请玩家仲裁（hardening §6）：保持现状 / 授权加纯视觉掌拨手形微提示。
3. `pv.assets.upload` 前可选 webp 压缩（app-host.md 建议）以稳过 20MiB 限；当前
   卡 jpeg q0.86 ~2.6MB，远低于限，非必需。
4. Share 失败仅状态行（未回退纯文字评论）；app-host.md 有 `composeWakuComment`
   回退范式，可选增强，非阻断（分享为结果页，归 Release 语义）。

## Fix Loop 结论

review 层无 needs_fix；`send-back` 候选仅手势规二（gameplay/方向层，不在硬化层
修，已聚合记录，非阻断，待玩家仲裁）。→ 进入 smoke（smoke-report.md）。
