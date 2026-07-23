# handback — Surgery / Release 线程

date: 2026-07-23 ｜ thread: waku-release（无人模式）｜ CLI: waku 0.4.5 ｜
账号: waku=`hanzhang`（已登录，session 有效）/ GitHub=`balabalabalaja`（已登录，scope `repo`）

## target

**conductor / player**（**非产物层退回**）。产物已通过全部 Preflight 门禁、确认
ship-ready；本阻断不是 create/refit/build/harden 能修的实现或验证问题，而是
**上传路径的授权/环境冲突**，只有 conductor/玩家能裁定。故不退 Build/Harden
（它们无从下手，退过去也改不了产物）。

## reason（一句话）

产物已 ship-ready，但**唯一合规的 Playground 上传通道缺失**——派工书指定的
`waku push ./dist` 路线在 CLI 0.4.5 下强制要求 git + GitHub origin，而本项目是
**非 git 仓**；同时硬边界**禁止 Feed publish**、Archive 专项**禁止 git 写操作**，
三条约束在"非 git 项目"这一环境下互相打架，需 conductor/玩家二选一裁定上传路径。

## evidence（命令输出为据）

**产物侧（全绿，非阻断，仅证明上传物已就绪）：**

- `npm run lint` → exit 0，零错误。
- `npm test` → tests 22 / pass 22 / fail 0。
- `rm -rf dist && npm run build` → `✓ built`，产出 `dist/index.html`（根级入口）+
  `assets/`（index js/css、vision_bundle）+ `vendor/polyverse-content-runtime.min.js`
  + `bg/background.webp` + `parts/*.png ×26`。
- 入口：`dist/index.html` 在根，内联 `application/polyverse-manifest`
  （capabilities: `app.comment.compose` / `assets.write` / `assets.read.own` /
  `media.image.open`）+ vendor runtime 经典脚本先于 module 加载。
- 凭据扫描：`dist` 全量扫 token/key/`Authorization`/provider 域/MCP 端点 → **0 命中**
  （grep 命中项仅 Vite modulepreload polyfill 的 `credentials:` 字段，非真凭据）。
- 资产可达（本地 `python3 -m http.server 8891 --directory dist` 实测）：
  index.html / vendor / 两个 assets js / css / vision_bundle / bg.webp /
  parts eye_03·nose_07·mouth_02·eye_10 **全 200**；durable 音频抽样
  `storage.googleapis.com/...acj_16baa1....mp3` → `206 audio/mpeg`；**无 404**。
- 远端引用仅：`storage.googleapis.com`（durable 音频/资产）、`w3.org`/`react.dev`/
  `tailwindcss.com`（命名空间/注释标识符）、`fonts.googleapis.com` +
  `cdn.jsdelivr.net`（Google Fonts / MediaPipe CDN，均有系统栈 / fallback 兜底，
  属 accept-with-record gap，非阻断）。
- 上游门禁复核：`review-report.md` `review_status: pass`、`smoke-report.md`
  `smoke_gate.status: pass`（17 pass / 2 blocked，两条 blocked 均为环境/规则仲裁，
  已按 dispatch 裁定：壳体 vanilla-at-root 接受、手势规二保持现状不加提示）。
  hardening pending 项判级：影响可玩性/安全/稳定的 **0 条**；均为改善/待决 gap。

**上传路径侧（阻断）：**

- `git -C /Users/balaja/waku-projects/0722_waku_surgery rev-parse --is-inside-work-tree`
  → `fatal: not a git repository`。本项目**无 git 仓、无 GitHub origin**。
- CLI 0.4.5 `waku push`（`waku --help` 原文）："Deliver local content to cloud
  storage: GitHub repo + branch + source folder → ... **Non-git input is rejected.**"
  Playground 上传（`waku playground` 已退役）唯一入口即 `waku push`，它**强制**
  git 三元组。→ 非 git 的 `dist` 无法 `waku push`。
- 派工书硬边界：**"只做 Playground 上传，不做 Feed publish"**。→ 排除 `waku publish`
  （即 Color Bloom 走过的非 git zip 路径，但那是 Feed 发布，本次禁止）。
- MCP `waku_site_upload_initiate` + `waku_source_push_done`：这是**唯一**"非 git +
  Playground（preview_ready）+ 不进 Feed"的通道，但**强制要求已存在的 `project_id`**。
  `waku ls` 中**无 SURGERY 项**；项目内 grep 无任何 `project_id`/`.waku`。→ 无可用
  project_id，且无合规方式为手搓本地产物凭空铸一个（`waku create` 是 prompt 生 AI 内容，
  非上传现有 dist；不采用）。
- 授权冲突：用 git 补齐（`git init` + 建 GitHub 仓 `balabalabalaja/surgery` + push +
  `waku push`）本可跑通（GitHub 凭据实测可用，scope `repo`），但这是**不可逆的 git 写
  + 在玩家账号下新建仓**，与 (a) 派工书 Archive 专项"玩家习惯自行批量提交 git /
  不执行任何 git 写操作"、(b) waku-release skill "don't create a repo to force it；
  非 git → blocker" 直接冲突。无人模式下不擅自做此不可逆外部副作用。

## 需要 conductor/玩家裁定（三选一，任一即可解锁，产物零改、一轮即发）

1. **授权 git + `waku push`（最贴近派工书 `waku push ./dist` 路线，同 pivoting-circles
   先例）**：授权我 `git init` 本项目、在 `balabalabalaja` 下建私仓（如
   `surgery`）、push，再 `waku push ./dist --source-dir . --name "SURGERY"` →
   得 Playground review-artifact URL（`/content-reviews/rvi_.../` 前缀，**不进 Feed**）。
   注意：这需要放宽 Archive 专项的"不执行任何 git 写操作"到"仅 Muse Library 归档不写、
   项目自身 GitHub 可写"。
2. **提供 `project_id`（走 MCP，纯 Playground、零 git、不进 Feed）**：若 conductor
   侧已为本作创建过 Waku 项目，给我 `project_id`，我用
   `waku_site_upload_initiate`（site.zip + source.zip）→ `waku_source_push_done`
   → 项目进 `preview_ready` 并返回 preview/launch URL（**不发 Feed**）。
3. **放宽硬边界、授权 Feed publish**（若玩家已愿末端确认）：
   `waku publish --name "SURGERY" --site-dir dist --source-dir . --description "<meta>"`
   （非 git zip 路径，Color Bloom 先例）→ Feed 卡 + `/sites/<project_id>/` launch URL。
   **默认不做**（派工书明禁），仅当玩家改口才走。

**建议**：优先 2（最干净，零副作用、纯 Playground、契合硬边界）；无 project_id 则 1。

## 附：解锁后须一并处理的打包小项（publish-layer，非阻断）

- 根级 `metadata.json`（`requestFramePermissions:["camera"]`）**未随 vite build 进入
  `dist/`**（它在项目根、不在 `public/`）。真实上传前应确保相机权限声明进入上传包
  （移入 `public/metadata.json` 或上传时并带），否则宿主可能不请求摄像头权限。
  这是 packaging 项，Release 可自行处理，但因上传路径未定故先留痕，不预先改动。

## 状态

Preflight 完成、判定 **1 条 blocker（上传路径）+ 若干 gap**。按 skill Preflight
"any blocker → stop and hand over the send-back note" 与派工书"需要退回时写
handback.md 后停"，本线程**停在此**：未执行任何上传/发布、未做 git 写操作、
未写 release-report/release-checklist（避免伪造完成信号）。凭据类字段全程未落任何
文件/日志。
