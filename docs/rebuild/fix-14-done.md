# fix-14-done — 壳内快门不出快照卡（post-release 维护轮，2026-07-23）

## 根因（一句话）

平台壳（Playground/feed web 壳）通过同源代理加载 playable 时注入
`<base href="https://storage.googleapis.com/…/">`，App 运行时相对路径加载的
部件贴图与油画背景因此全部解析为**跨域 GCS 直连**，以 no-cors 方式画入
canvas 后污染画布，`composeCard` 的 `toDataURL()` 抛
`SecurityError: Tainted canvases may not be exported` → 状态机 `RESOLVE_FAIL`
退回游玩态——快门流程静默中断，永不出卡。

## 为什么本地/raw GCS 正常、simulator 也测不出来

- 本地 8891 与 raw GCS 直开：文档与素材同源，无污染（`probe-raw-log.txt`
  实测出卡）。
- `waku simulator`（CLI 自带）：同样注入 GCS `<base>`，但其
  `preview-bootstrap.js` 会把所有 `storage.googleapis.com` URL **重写回同源
  `/preview/proxy/resource`**，污染条件被它消掉（`probe-shell-log.txt`
  实测出卡）——线上 Playground 壳的注入 runtime 没有这层重写（其
  `fetchProxy` 只补丁 `window.fetch`，不管 `Image.src`），于是只有真壳必现。
- 真壳复现：Playground 页（公开的 manual preview 入口）装入 Feed GCS URL，
  点快门 → 逐字命中上述 SecurityError，无卡（`probe-realshell-log.txt`）。
- 附：壳 chrome 覆盖层拦截假说已排除——`.samantha-ui-chrome` 为
  `pointer-events:none`，底部社交岛（y 792-852）与快门（y 718-792）零重叠，
  `elementFromPoint` 直落 iframe；点击确实到达 App。

## 修法（修订模式最小改动，2 处各 1 行生效代码）

给所有会画入截图 canvas 的光栅加 `crossOrigin='anonymous'`：

1. `src/engine/parts.ts` `loadImage()`（26 张部件贴图）
2. `src/engine/stage.ts` 构造器 `bgImage`（油画背景）

GCS 对 bucket 全对象返回 `Access-Control-Allow-Origin: *`（curl 实测 bg
与 parts 均在），跨域时 CORS 干净不污染；本地 dev / raw GCS / simulator
的同源场景下该属性为 no-op。不触碰 fix-01…13 的任何视觉与机制。

## 前后取证（`docs/rebuild/evidence-build/fix-14/`）

| 场景 | 构建 | 结果 | 证据 |
|---|---|---|---|
| raw GCS 直开（无壳，released 字节） | index-DYT-riUH.js | **出卡** | probe-raw-log.txt、raw-2-after-tap.png |
| waku simulator（released 字节） | 同上 | 出卡（bootstrap 重写消掉污染） | probe-shell-log.txt、shell-2-after-tap.png |
| **真实 Playground 壳（released 字节）** | 同上 | **不出卡**：SecurityError，页面/frame 双路点击均复现 | probe-realshell-log.txt、realshell-2-after-tap.png |
| 壳机制孪生·修复前（127.0.0.1 文档 + `<base>`→localhost 跨域 + ACAO:*，单 8891 端口双源） | 回退修复重建 = **逐位命中线上 hash** index-DYT-riUH.js | **不出卡**：同一 SecurityError | probe-mimic-old-log.txt、mimic-old-2-after-tap.png |
| **壳机制孪生·修复后** | index-CMZR0o1x.js | **出卡**（result 卡 + 学分行完整） | probe-mimic-new-log.txt、mimic-new-2-after-tap.png |

复现工具：`probe-shell.mjs`（五模式探针）、`mimic-server.mjs`（壳机制
孪生服务，8891 上以 `127.0.0.1` vs `localhost` 造双源复刻 `<base>` 注入 +
GCS ACAO）。

## 回归（全部通过）

- `npm run lint`（tsc）0 错；`npm test` 22 用例 0 失败。
- probe-fix07 全量回归（`fix-14/probe-fix07-rerun.mjs`，新 dist 静态
  8891）：双视口 **failures=0**（`fix-14/regression/probe-fix07-rerun-log.txt`
  + 8 张截图）；含"shutter → result → again loop intact"与全部
  fix-01…13 断言。dev-server 跑法下出现过一次 track-fps 计数瞬时为 0 的
  环境抖动（老构建同环境静态跑 0 失败、新构建静态跑 0 失败，与本修复
  无因果，记录在案）。

## 交接（Release 维护路径）

`dist/` 已是修复后构建（入口 bundle `index-CMZR0o1x.js`）。按
gate-feedback-14 约定走 build → push GitHub → `waku push`（必要时
`waku publish` 刷新 Feed 版本）。上线后真壳一键验收：Playground manual
preview 装入新 GCS URL 点快门应出卡。
