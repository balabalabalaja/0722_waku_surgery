# Release Report — Surgery（art-history face collage）

date: 2026-07-23 ｜ thread: waku-release（无人模式；player 第 41 轮裁定后续跑）
｜ CLI: waku **0.4.5** ｜ waku 账号: `hanzhang`（`usr_ec6440c6398747e8a60e4a162e44412f`）
｜ GitHub 账号: `balabalabalaja` ｜ 环境: 生产（未带 `--api-base`/`--web-base`）
｜ 本管线端口: 8891

**一句话结论：Preflight 零产物阻断（gates 全绿、凭据零命中、资产全 200）。上传路径
阻断由玩家第 41 轮裁定选项 1 解锁——授权 git + `waku push`。本轮：把根级
`metadata.json`（相机权限）打进 `dist/`（33 文件），在玩家账号 `balabalabalaja` 下
新建私仓 `0722_waku_surgery`（origin + main + 首提 `1e3485f`），`waku push ./dist
--source-dir . --name "SURGERY"` 一次成功，产出 Playground review artifact（`kind:
review`，非 Feed）。launch_url 线上 33 文件全 200，`index.html`/`metadata.json` 与本地
`dist` sha256 逐位全等，相对引用可在 GCS base 解析，相机权限声明线上在位。
Muse Library 一个字节未动（玩家自理归档）。**

> **更新（player 第 42 轮末端确认后）**：玩家真机试玩通过、亲口"发一下 feed"——
> Feed 硬边界解除，已执行 `waku publish` 正式发布 + `waku cover set` 封面，一次成型、
> `publication_status: published`、版本 succeeded/is_current。详见下方「Feed 发布」段。
> **Playground 与 Feed 双通道均在线**。

---

## 交付坐标（Playground）

| 项 | 值 |
|---|---|
| **launch_url（Playground 稳定链接）** | `https://storage.googleapis.com/waku-core-aicap-dev/content-reviews/rvi_9e4226b9c1c5485f86dda7c245a86fd0/main/bbdc3591-5208efe478ff/index.html` |
| kind | `review`（Playground review artifact — **非 Feed**） |
| review_item_id | `rvi_9e4226b9c1c5485f86dda7c245a86fd0` |
| artifact_id | `rva_99813e37ea3c4884890701d79a13dd49` |
| artifact.sha256 | `5208efe478ffb3049e7bde050931d5e1fb7f4b011fc3efa34fc764b1c22f1d09` |
| entrypoint | `index.html` |
| file_count | `33`（= 本地 dist 文件数） |
| storage_uri | `…/content-reviews/rvi_9e4226…/main/bbdc3591-5208efe478ff` |
| source_uri（source.zip） | `…/main/bbdc3591-5208efe478ff/source.zip` |
| source_repo_url | `https://github.com/balabalabalaja/0722_waku_surgery.git`（private） |
| source_branch / source_revision | `main` / `1e3485fd672e2a500b54414ab9bafda0935defdd` |
| created_by_user_id | `usr_ec6440c6398747e8a60e4a162e44412f`（waku=`hanzhang`） |
| 产物路径（本地） | `/Users/balaja/waku-projects/0722_waku_surgery/dist`（33 文件） |

回执原文：`docs/rebuild/evidence-release/push-stdout.json`（stderr 空：
`push-stderr.txt`）。凭据类字段全程 0 命中、未落任何文件/日志/报告。

---

## Feed 发布（player 第 42 轮确认后追加 · 2026-07-23）

玩家第 42 轮末端确认（「手机上试完没问题的话 发一下 feed 吧」）解除 Feed 硬边界，
本段执行正式发布。**产物代码零改**；仅新增打包 `polyverse-meta.json`（title/description）
+ 封面素材压缩（均 publish-layer）。

### 交付坐标（Feed）

| 项 | 值 |
|---|---|
| **launch_url / preview_url（Feed 稳定链接）** | `https://storage.googleapis.com/waku-core-aicap-dev/sites/b085697a-e5c1-5277-a6f0-63f4931ef930/20260723T073842219277/index.html` |
| **content_id** | `cnt_59ff337c85c24d4a92f3b29344cb7a98` |
| project_id | `b085697a-e5c1-5277-a6f0-63f4931ef930` |
| **deployment_id（回滚坐标）** | `dep_816fe28d912b4a67939bda5b05ad34ca` |
| current_version_id（发布态 → 封面后） | `cnv_112239ad3bfc4f9487cce4772bc64b56` → `cnv_5fcf72cca1054b5d91252dd835271eb0` |
| title | `SURGERY`（**非 UUID**） |
| content_type / visibility | `website` / `public` |
| published_at | `2026-07-23T07:38:49.296220+00:00` |
| feed_sequence / has_source_zip | `2` / `true` |
| cover_asset | `uas_c7635a2f40f04d2baf232457412f8787`（durable，prod 在位） |

回执：`evidence-release/publish-stdout.json`（stderr 空）/ `cover-set-stdout.json` /
`versions-stdout.json` / `feed-verify.txt`。Token 类字段全程 0 落地。

### 发布命令与回执

本线程亲跑（stdout 纯 JSON、stderr 单独重定向，**未 `2>&1` 混流**；**后台跑避开 2min
工具超时**——该 backend 上传 >2min）：

```bash
waku publish --name "SURGERY" --site-dir dist --source-dir . --description "<metadata.json desc 原文>"
```

- description 未手打，`python3` 从 `metadata.json` 提字段（190 字节），回执 `description`
  与源**逐字节相等**（含 em-dash）。**exit 0，stderr 空**。
- **操作留痕（非事故）**：首跑在前台被工具 2min 超时 SIGTERM（exit 143，stdout 空）；
  先 `waku ls` 核验 SURGERY **未创建、无残留**（Feed 无空卡、无重复），确认状态干净后
  才改后台重跑一次成功——**未盲目重试、未产生重复/空卡**（守 0.4.5 探测纪律）。
- `kind: publish` → Feed 正式版本链（`/sites/<project_id>/` 前缀，区别于 Playground 的
  `/content-reviews/`）。

### 封面（`waku cover set`）

素材 = 玩家批准的 `ui-previews/01-opening-dressed.png`（开屏换脸态：三窗名画五官 +
胸口嘴环 + 玻璃顶栏 + 快门，representative 首屏），`sips` 压为 **720×1558 jpeg**
（267KB，`evidence-release/cover-surgery.jpg`；产物代码未改）。

```bash
waku cover set "SURGERY" --file docs/rebuild/evidence-release/cover-surgery.jpg
```

- **exit 0，stderr 空**。durable 资产 `uas_c7635a2f40f04d2baf232457412f8787`，线上
  **200 image/jpeg 266957B**。
- **`needs_promote: false` / `cover_promotion: not_needed`**——无需 `--promote`，prod
  直接生效。设封面把内容版本 `cnv_112239ad…` → `cnv_5fcf72cca…`（版本指针变更，不新增
  站点 deployment，故 `waku versions` 仍 1 条 deployment）。

### 发布后核验（命令输出为据）

| 核验项 | 方法 | 结果 |
|---|---|---|
| Feed 卡标题非 UUID | publish 回执 + `waku ls` | 均 `SURGERY` ✓ |
| 发布状态 | `waku ls` | `publication_status: published` ✓ |
| 版本链 | `waku versions "SURGERY" --json` | `dep_816fe28d…` kind=publish、**status=succeeded**、is_current=true、has_source_zip=true、feed_sequence=2 ✓ |
| 描述在位且=源 | publish 回执 `description` | 与 `metadata.json` 逐字节相等 ✓ |
| 封面在位（prod） | cover-set 回执 + curl | `needs_promote:false`；cover asset 200 image/jpeg 267KB ✓ |
| 线上产物全 200 | curl 9 文件 + 封面 | index/polyverse-meta/metadata/vendor/2 js/css/vision_bundle/bg/part/cover **全 200**，无 404 ✓ |
| **线上字节=验讫 dist** | 线上 vs 本地 dist sha256 | `index.html`/`polyverse-meta.json`/`metadata.json` **逐位全等**（index `74771271…` = 与 Playground 同一份 index 字节）✓ |

**未重跑第三遍浏览器**：Feed 上传的 dist 与 Playground/验讫构建 index 字节逐位同一、
9 文件全 200、全相对引用；且玩家第 42 轮已在**真机**试玩确认（"手机上试完没问题"）。
playability 双重坐实（真机 + 字节全等），按 preflight「No third browser run」不复跑。

### 元信息（Feed） + Feed 回滚

- `public/polyverse-meta.json` → `dist/polyverse-meta.json`（与 index.html 同级、线上
  200、与本地 sha256 全等）：`schema_version:1` / `title:"SURGERY"` /
  `description`（=metadata.json）。**注记**：首发的 packaged `polyverse-meta.json` 携
  title+description，封面未内嵌 field（封面经 `waku cover set` 直上 Feed 卡，durable
  `uas_c7635a2f…`）——按 meta-file.md「封面缺 field 可留痕不阻断」，Feed 卡封面实测在位。
- 回滚（本段起适用）：`waku rollback "SURGERY" --to dep_816fe28d912b4a67939bda5b05ad34ca
  --note "<原因>" --yes`（无 TTY 必带 `--yes`）。当前唯一 Feed 版本 = 该 deployment
  （is_current）。Playground review artifact（`rvi_9e4226b9…`）不在 Feed 版本链内、
  `rollback` 不切到它，其 GCS URL 仍 200 可作历史预览。republish 必带全量
  `--name`/`--description`（Known Trap：裸 `--project-id` 会把卡标题写成 UUID）。

---

## 1. Preflight（发布前重验，非信任上游自陈）

| 检查 | 命令 / 方法 | 结果 |
|---|---|---|
| review_status | `review-report.md` `## review_status` | `pass` |
| smoke_gate | `smoke-report.md` `smoke_gate.status` | `pass`（17 pass / 2 blocked，均环境/规则仲裁，非产物缺陷） |
| 亲玩证据复核 | smoke L1/L2/L3 独立取证（live :8891）+ Build probe C（生产 dist@8891 preview：fallback→result，0 个 ≥400） | 通过；**未重跑第三遍浏览器**（Harden 无环境降级阻碍真玩取证；上传字节与验讫构建逐位全等，playability 继承） |
| hardening 未修项判级 | 逐条 | 影响可玩性/安全/稳定 **0 条**；余为 accept-with-record gap（见 §5） |
| `npm run lint` | tsc --noEmit | exit 0，零错误 |
| `npm test` | tsx --test | tests **22 / pass 22 / fail 0** |
| `rm -rf dist && npm run build` | vite | `✓ built`，出 `dist/index.html`@root（唯一告警=vendor 经典脚本非 module，故意，非错误） |
| 入口 | — | `dist/index.html` 在根，内联 `application/polyverse-manifest`（capabilities ×4）+ vendor runtime 先于 module 加载 |
| 凭据扫描 | grep dist（token/key/`Authorization`/provider 域/MCP 端点） | **0 命中**（唯一 grep 命中为 Vite modulepreload polyfill 的 `credentials:` 字段，非真凭据） |
| 资产可达（本地 8891） | `python3 -m http.server 8891 --directory dist` + curl | 入口/vendor/2 js/css/vision_bundle/bg.webp/parts ×4 **全 200**；durable 音频抽样 `206 audio/mpeg`；**无 404** |
| 远端引用 | grep dist | 仅 `storage.googleapis.com`（durable 音频/资产）、`w3.org`/`react.dev`/`tailwindcss.com`（标识符/注释）、`fonts.googleapis.com`+`cdn.jsdelivr.net`（有 fallback，accept-with-record） |
| CLI 环境 | `waku --version` / `waku whoami` | 0.4.5 / 已登录 `hanzhang`；生产环境 |

---

## 2. 打包修订（publish-layer，本线程职权）

- **根级 `metadata.json`（`requestFramePermissions:["camera"]`）未随 vite build 进入
  `dist/`**（原在项目根、不在 `public/`）——handback 已留痕。本轮修：
  `cp metadata.json public/metadata.json` → `rm -rf dist && npm run build` →
  `dist/metadata.json` 产出。**未改任何产物代码**（仅打包路径）。
- 验证：push 回执 `file_count: 33`（= 前 32 + metadata.json）；线上
  `metadata.json` 200 且内容含 `requestFramePermissions:["camera"]`，与本地 dist
  sha256 逐位全等。相机权限声明确已随站点上传。

---

## 3. git 授权与 Playground 上传（本轮核心）

### 3.1 git 授权范围（玩家第 41 轮裁定 · 选项 1）

玩家亲口授权：仅为满足 `waku push` 的 git-origin 前置，在**项目文件夹内**建 git 仓、
在**玩家自己账号**下建 GitHub 私仓并 push；Muse Library 仓一字节不动。执行：

```bash
git init -b main                       # 项目文件夹内
git config user.name/email             # 本地作用域
git add -A && git commit               # 首提 1e3485f（.gitignore 见下）
gh repo create 0722_waku_surgery --private --source=. --remote=origin --push
```

- 新仓：`https://github.com/balabalabalaja/0722_waku_surgery`（**private**），
  origin 就位、`main` 已 push、HEAD `1e3485fd672e…`。
- `.gitignore`（按 waku push 要求处理，保持精简 + 保留报告）：忽略
  `node_modules/`、`dist/`、`coverage/`、`.env*`；额外忽略可再生的流水线证据与原始设计
  素材（`docs/rebuild/evidence-build|evidence-harden|ui-previews/`、`docs/rebuild/*.png`、
  `assets/`——`public/` 已含运行时素材，`assets/` 非构建输入，实测 `src` 零引用），
  以使 source.zip 精简。**保留** `docs/rebuild/*.md` 全部握手报告。tracked 98 文件、
  ~5.5M。
- `waku push` 前置全部满足：`git remote -v` = origin GitHub、`git branch --show-current`
  = main（非 detached）。

### 3.2 `waku push`（Playground，非 Feed）

本线程亲跑（stdout 纯 JSON、stderr 单独重定向，**未 `2>&1` 混流**）：

```bash
waku push ./dist --source-dir . --name "SURGERY"
```

- **exit 0，stderr 空**。回执 `kind: review` → **Playground review artifact**，不进 Feed
  版本链（同 pivoting-circles 前四轮 `waku push` 口径）。launch_url 前缀
  `/content-reviews/rvi_…/`（≠ Feed 的 `/sites/<project_id>/`）。
- 未做 Feed publish（`waku publish` 全程未跑）；无 cover（review artifact 无需）。

### 3.3 发布后核验（逐条命令输出为据）

证据：`docs/rebuild/evidence-release/live-verify.txt`。

| 核验项 | 方法 | 结果 |
|---|---|---|
| 线上入口 + 全资产可达 | curl 10 条 | index.html/metadata.json/vendor/2 js/css/vision_bundle/bg.webp/parts ×3 **全 200**，content-type 正确，**无 404** |
| **上传字节 = 验讫 dist** | 线上 vs 本地 dist sha256 | `index.html` **MATCH** `74771271…`；`metadata.json` **MATCH** `1cbeb6f5…`（逐位全等） |
| 相机权限线上在位 | curl 线上 `metadata.json` | `requestFramePermissions:["camera"]` ✓ |
| 新 base 可解析 | 读线上 `index.html` | 全相对引用（`./vendor/…`、`./assets/…`）+ 内联 manifest，`/content-reviews/…/` 前缀下正常 |
| 文件数一致 | 回执 `file_count` vs 本地 | 33 == 33 ✓ |

**为何不重跑第三遍浏览器**：上传的 `dist` 与本轮确定性重建（lint/test 全绿）逐位
同一，且线上 index/meta sha256 与本地 dist 全等、10 条资产全 200、入口全相对引用；
Harden smoke 已在 live :8891 独立真玩走通核心闭环（L1/L2/L3），Build probe C 亦在
生产 dist 上真玩到出卡。同一份字节在新 GCS 路径渲染行为一致 → playability 继承。
按 preflight「No third browser run（除非 Harden 环境降级致缺真玩证据）」，本轮不复跑。

---

## 4. 入库记录（Muse Library）

**状态：不入库、Muse Library 一字节未动**（派工书 Archive 专项指令 + 玩家第 41 轮
再次确认「Muse Library 仓照旧一个字节不动」）。

- 本项目按玩家显式指定位于 `~/waku-projects/0722_waku_surgery`（**不在 Muse Library
  库根内**）；玩家习惯自行批量提交 git、**归档由玩家自理**。
- 核验：`/Users/balaja/Muse_Library-main` **非 git 仓**（无 `.git`）、库内无任何
  `*surgery*` 条目——未搬运、未 `git init`、未 add/commit/push，Muse Library 未受任何写。
- **澄清边界**：§3 对**本项目自身**的 git init + GitHub 私仓 push，是玩家第 41 轮
  为解锁 `waku push` 的 git-origin 前置**专项授权**的动作，与「Muse Library 归档 git
  写」是两回事——后者本轮**零执行**。

---

## 5. 缺口清单（accept-with-record，非阻断，留痕）

1. **MediaPipe wasm/models CDN**（jsdelivr + storage.googleapis）+ **Google Fonts CDN**
   （Inter/JetBrains）：失败路径已证兜底可玩（smoke L3 model-CDN-blocked→fallback→出卡；
   字体 swap + 系统栈）。自托管为可选优化，成本高、失败已覆盖 → 按派工书**不强求**，
   留后续。
2. **zh 画作译名**：26 条为美术馆标准/高置信译名（`CREDITS_ZH`）；玩家如有权威清单
   可直接改。按派工书**保持现状**。
3. **手势规二（无手时虚线手形引导）**：与已定稿核心 Hook「不出现任何文字教学」冲突，
   **手势零提示为玩家仲裁定案**（派工书），**不加提示**，保持现状。
4. **标准模板仓（polyverse-session-template-dev）SOP 对齐**：玩家已知悉，记为**后续
   优化项**，本轮不做（coordinator 指令）。产物为 vanilla-at-root，平台接线完整、
   门禁全绿、`waku push` 已成功。
5. **真机 iOS WKWebView**：`env()`/getUserMedia/GPU delegate 帧率 + 真手掌拨转手感仅
   headless 测（内置 `engine.renderFps`/`frameMs`/`vision.trackFps` 计数器）→ 归设备 QA。

上述均不影响本轮 Playground 交付的可玩性/安全/稳定。

---

## 6. 元信息

- **manifest**（内联于 `index.html` `application/polyverse-manifest`）：`name:"SURGERY"`、
  `runtime:@polyverse/content-runtime@1`、capabilities `app.comment.compose` /
  `assets.write` / `assets.read.own` / `media.image.open`——与代码调用一一对应。
- **`metadata.json`**（本轮打进 dist@root）：`name`/`description`/
  `requestFramePermissions:["camera"]`。线上 200、与本地 sha256 全等。
- 无 `polyverse-meta.json`（那是 Feed 卡元信息；本轮不发 Feed，不需要，也未做 cover）。

---

## 7. 后续维护 / 回滚

- **Playground review artifact 不在 Feed 版本链内**，`waku rollback` 不适用（那是
  Feed publish 的坐标）。要更新 Playground：改 `src/` → `npm run build` → commit + push
  到 `balabalabalaja/0722_waku_surgery` → 重跑 `waku push ./dist --source-dir . --name
  "SURGERY"`，得新 review artifact URL；旧 URL 的 GCS 对象仍在、仍可回看。
- **Feed 正式发布（待玩家末端确认后另行执行，本轮硬边界禁止）**：
  `waku publish --name "SURGERY" --site-dir dist --source-dir . --description "<meta 原文>"`
  （首发建议带 `--source-dir .`；republish 必带全量 `--name`/`--description`，见 Known Traps）。
- **退回上游**：改玩法/实现 → Build；重验证/补取证 → Harden。Release 到此收口。
- 查参数只读 `~/.claude/skills/waku/references/cli.md`，全程未对 `waku` 子命令跑
  `--help`（0.4.5 Known Trap：`--help` 会被当「忽略未知 flag + 直接执行」）。

---

## 8. 取证件清单（`docs/rebuild/evidence-release/`）

| 文件 | 内容 |
|---|---|
| `push-stdout.json` | `waku push` 回执原文（review artifact 全字段） |
| `push-stderr.txt` | 空（exit 0，无告警） |
| `live-verify.txt` | 线上 10 资产 200 + sha256 逐位全等 + 相机权限 + 相对引用核验 |

历史握手物：`create-brief.md` / `build-report.md` / `hardening-report.md` /
`review-report.md` / `smoke-report.md` / `handback-1-release-player.md`（第 41 轮前的
阻断留痕，已归档改名）。

**本轮无操作事故；凭据纪律：任何 token/key 未进页面、仓库、日志、报告。**
