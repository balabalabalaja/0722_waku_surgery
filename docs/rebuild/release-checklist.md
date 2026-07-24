# Release Checklist — Surgery

date: 2026-07-23 ｜ thread: waku-release ｜ CLI waku 0.4.5 ｜ 环境: 生产

> 全部勾选，无未勾项。证据落 `docs/rebuild/evidence-release/` 与 `release-report.md`。

## Preflight — 上游报告核验

- [x] `review-report.md` `review_status: pass`
- [x] `smoke-report.md` `smoke_gate.status: pass`（17 pass / 2 blocked，均环境/规则仲裁）
- [x] 亲玩证据复核通过（smoke L1/L2/L3 + Build probe C 生产 dist）；无 Harden 环境降级 → 不重跑第三遍浏览器
- [x] hardening 未修项判级：影响可玩性/安全/稳定 0 条；余为 accept-with-record gap（已入 report §5）

## Preflight — 构建产物

- [x] `npm run lint` exit 0（零错误）
- [x] `npm test` 22 pass / 0 fail
- [x] `rm -rf dist && npm run build` 出 `dist/index.html`@root
- [x] 入口 `index.html` 在静态目录根 + 内联 polyverse-manifest + vendor runtime 先加载
- [x] 凭据扫描 dist：token/key/Authorization/provider 域/MCP 端点 0 命中
- [x] 资产可达（本地 8891）：全 200，durable 音频 206 audio/mpeg，无 404
- [x] 远端引用仅 durable GCS + 标识符 URL + 有 fallback 的 CDN（fonts/jsdelivr）
- [x] 目录无 node_modules/.git/构建缓存混入上传物（dist 为纯构建输出）

## Preflight — 打包修订（publish-layer）

- [x] 根级 `metadata.json`（相机 `requestFramePermissions`）随构建进入 `dist/`
- [x] 未改任何产物代码（仅打包路径 public/ → dist/）

## Preflight — CLI 环境

- [x] `waku --version` = 0.4.5
- [x] `waku whoami` 已登录（`hanzhang`）；无需 `waku login`
- [x] 生产环境（未带 `--api-base`/`--web-base`）
- [x] `waku push` 前置：`--source-dir .` 解析到 GitHub origin + named branch（main）+ 非 detached

## git 授权（玩家第 41 轮裁定 · 选项 1）

- [x] 项目文件夹内 `git init -b main` + 精简 `.gitignore`（含 node_modules/dist）+ 首提 `1e3485f`
- [x] `gh` 在玩家账号 `balabalabalaja` 下建私仓 `0722_waku_surgery`，设 origin 并 push main
- [x] Muse Library 仓一字节未动（核验：非 git 仓、库内无 surgery 条目）

## Publish — Playground 上传

- [x] `waku push ./dist --source-dir . --name "SURGERY"` exit 0、stderr 空
- [x] 回执 `kind: review` = Playground review artifact（**非 Feed**）
- [x] 取得 launch_url + review_item_id + artifact_id + sha256（见 report 交付坐标）
- [x] 第 41 轮止于 Playground（Feed 硬边界当时未解除；`waku publish` 未跑）

## Publish — 发布后核验

- [x] 线上 launch_url 33 文件全 200，无 404
- [x] 线上 `index.html`/`metadata.json` 与本地 dist sha256 逐位全等
- [x] 线上 `metadata.json` 含 `requestFramePermissions:["camera"]`
- [x] 线上 `index.html` 全相对引用，可在 GCS base 解析
- [x] `file_count` 33 == 本地 dist 文件数

## Publish — Feed 发布（玩家第 42 轮末端确认解除硬边界）

- [x] 玩家第 42 轮真机试玩通过 + 亲口"发一下 feed" → Feed 硬边界解除
- [x] 打包 meta：`public/polyverse-meta.json`（title+description）随 build 进入 `dist/`（与 index.html 同级、valid JSON、dist 34 文件）
- [x] `waku publish --name "SURGERY" --site-dir dist --source-dir . --description "<metadata.json 原文>"` exit 0、stderr 空
- [x] 前台首跑被 2min 工具超时 SIGTERM → `waku ls` 核验无残留/无空卡后改后台重跑（未盲目重试、未产生重复卡）
- [x] 回执：content_id `cnt_59ff337c…` + deployment_id `dep_816fe28d…` + title `SURGERY`（非 UUID）+ description 逐字节=源
- [x] 封面：`sips` 压缩玩家批准素材 ui-previews/01 → 720×1558 jpeg；`waku cover set "SURGERY" --file <jpg>` exit 0；durable `uas_c7635a2f…`；`needs_promote:false`/`not_needed`（prod 生效）
- [x] `waku ls` → `publication_status: published`
- [x] `waku versions "SURGERY"` → `dep_816fe28d…` kind=publish、status=succeeded、is_current、has_source_zip、feed_sequence=2
- [x] 线上 Feed 9 文件 + 封面全 200，无 404；封面 200 image/jpeg 267KB
- [x] 线上 Feed `index.html`/`polyverse-meta.json`/`metadata.json` 与本地 dist sha256 逐位全等
- [x] 未重跑第三遍浏览器（玩家真机已确认 + 字节全等，playability 双重坐实）

## 维护重传 — fix-14（壳内快门 tainted-canvas 修复，Build 修订后 Release 重传）

- [x] 核验 fix-14 改动范围 = 仅 `parts.ts`+`stage.ts` 各加 `crossOrigin='anonymous'`（11 行，无 fix-01..13 视觉/机制改动）；本线程产物代码零改
- [x] 发布前重验：`lint` 0 / `test` 22-22 / 确定性重建复现入口 bundle `index-CMZR0o1x.js`（dist 34 文件）；bundle 含 `anonymous`×4；新 dist 凭据 0 命中
- [x] git commit `8b34d5f`（信息注明 fix-14 壳内快门修复）+ `git push origin main`（授权沿玩家第 41 轮）
- [x] `waku push ./dist --source-dir . --name "SURGERY"` exit 0 → 新 Playground URL（rva_52d84b63…, src_rev 8b34d5f, 34 文件）
- [x] `waku publish --project-id b085697a-… --name "SURGERY" --site-dir dist --source-dir . --description "<源>"` exit 0 → 刷新 Feed 版本
- [x] content_id 不变（`cnt_59ff337c…`）= 同项目新版本、非重复/空卡；title `SURGERY` 非 UUID；description 逐字节=源
- [x] `waku versions`：新 `dep_8d6a0fbc…`（feed_seq3, succeeded, is_current）+ 旧 `dep_816fe28d…` 保留可回滚
- [x] 线上新 Feed：index.html 引用 `index-CMZR0o1x.js`；旧 `index-DYT-riUH.js`→404（干净替换）；bundle 含 `anonymous`×4（修复上线）
- [x] 线上资产全 200；`index.html`/`index-CMZR0o1x.js`/`polyverse-meta.json`/`metadata.json` sha256 与本地 dist 逐位全等
- [x] 封面不动：cover `uas_c7635a2f…` 仍 200 image/jpeg，content 级绑定（content_id 不变），未 re-set
- [x] Muse Library 仍一字节未动；产物代码不再改

## Archive（Muse Library）

- [x] 按派工书 Archive 专项 + 玩家第 41 轮：跳过 Muse Library git push
- [x] release-report 入库记录段注明「项目位于玩家指定路径、归档由玩家自理」
- [x] 未对 Muse Library 执行任何 git 写操作

## Record + 凭据纪律

- [x] `release-report.md` 落盘（含 Playground URL + Feed URL/ID + 上传实证 + 入库记录段 + 追加「Feed 发布」段）
- [x] `release-checklist.md` 落盘（本文件，无未勾项）
- [x] `brief-release.md` 落盘（状态行含 Feed）
- [x] `handback.md` 归档改名为 `handback-1-release-player.md`
- [x] 任何 token/key 未进页面/仓库/日志/报告；stdout/stderr 未 `2>&1` 混流；未对 waku 子命令跑 `--help`
