# fix-15-done — 真机转盘咔哒 SFX 缺失（post-release 维护轮，2026-07-24）

## 根因（一句话）

转盘咔哒（与落位声）由 rAF 渲染循环里的选中变化触发
（`stage.ts` loop → `playSfx('click')`），永远不在任何用户手势回调内；
iOS Safari 对 HTMLAudioElement 的解锁是**逐元素**的——从未在手势内
play 过的元素，`play()` 永远拒绝（NotAllowedError 被
`.catch(() => {})` 静默吞掉）——而 BGM 恰好有 `{once:true}` 的
pointerdown 重试（手势内解锁成功）、快门/滑出声在点击回调里同步触发
（自带手势），于是玩家听得到 BGM 和快门、唯独没有咔哒；桌面 Chrome
的激活是页面级 sticky（任意一次点击后全部元素放行），所以本地永远
测不出。

## 修法（只动 `src/engine/audio.ts`，App/stage 调用面零改动）

SFX 切 **WebAudio 主路径**（gate-15 排查方向 1+2 一并落）：

1. `primeAudio()` 启动时 fetch + decode 四条 cue 成 AudioBuffer
   （CDN 实测 `Access-Control-Allow-Origin: *`，curl 2026-07-24——
   旧注释"CORS 挡 WebAudio"已过时）；同时挂常驻捕获段
   `pointerdown/touchend/keydown` 解锁监听。
2. 首个真实手势内 `ctx.resume()`（iOS 要求 resume 必须在手势回调内；
   监听常驻，来电/切后台再挂起后下一次触摸静默复活）。
3. `playSfx()`：context running 且 buffer 已解码 → 每次**新建
   AudioBufferSourceNode**（`start(0, 0, dur)` 直接落时长上限；
   高频重触发天然安全，绕开 iOS `currentTime=0` 快速重播不可靠）；
   否则回落原 HTMLAudio 池——池元素也在首手势内做了静音
   play/pause 祝福（blessing），非 WebAudio 环境同样解锁。
4. 取证探针 `window.__surgeryAudio`（ctxState/decoded/played/
   rejected，无敏感信息），与 fix-14 的 `window.__surgery` 同例。

触发路径检查（gate-15 方向 3）：咔哒挂在 rAF 内的选中变化上，
指尖拨环与手掌拨盘走同一条路，不存在 touch 漏触发——问题纯在解锁。

## 桌面复现（前后取证，`docs/rebuild/evidence-build/fix-15/`）

探针 `probe-sfx.mjs`：Chromium `--autoplay-policy=user-gesture-required`
+ 触屏移动仿真，静态伺服 8891。两个关键的取证工程点：

- **Playwright 激活泄漏**：`page.evaluate` 在 Chromium 带
  `userGesture:true`，会送 sticky activation 把缺陷洗掉——Phase A
  （首手势前）全部由 init-script 内自治驱动器执行（转盘由
  `__surgery` 句柄注入角速度、rAF 自然触发咔哒），结果经
  `exposeFunction` 绑定回传，Node 全程零 evaluate。
- **Chromium 不闸 WebAudio**（AutoplayIgnoreWebAudio 回滚已删闸），
  iOS WebKit 闸——after 探针在 init-script 里包装 AudioContext
  构造器拿到实例后强制 `suspend()`，精确复刻 iOS 开机态。

| 场景（cam=授权假摄像头 / nocam=拒相机 fallback） | Phase A（无手势，rAF 转盘） | Phase B（一次真实触摸后再转） | 判定 |
|---|---|---|---|
| before-nocam（released 字节 `index-CMZR0o1x.js`） | click `play()` 全拒 `NotAllowedError`（iOS 上此态**永久**） | 同一元素放行（桌面 sticky 激活 = 本地测不出的原因） | 0 失败 |
| before-cam（同上，相机开——玩家真机同构） | 同上全拒（活跃采集并不豁免文件音频） | 同上 | 0 失败 |
| after-nocam（修复 `index-BOdIEah_.js`） | ctx 强制 suspended：WebAudio 零播放、回落路径全拒（与 BGM 同步静默，符合 iOS 手势前预期） | 手势监听 resume → running，rAF 咔哒走 bufferSource（webaudio 8→21），双盘急拨 burst +13 全新 source，池亦完成祝福 | 0 失败 |
| after-cam（相机开） | 同上 suspended 静默 | running，webaudio 4→20，burst +16 | 0 失败 |

日志：`probe-sfx-{before,after}-{cam,nocam}-log.txt` + 各截图。

## 回归（全部通过）

- `npm run lint`（tsc）0 错；`npm test` 22 用例 0 失败。
- probe-fix07 全量回归（`fix-15/probe-fix07-rerun.mjs`，新 dist 静态
  8891）：双视口（390x844 / 1440x900）**failures=0**，65 断言含
  "shutter → result → again loop intact" 与全部 fix-01…13 项
  （`fix-15/regression/probe-fix07-rerun-log.txt` + 8 张截图）。
- fix-01…14 定稿零触碰：改动只在 `src/engine/audio.ts` 一个文件
  （bgm 对象原样保留），`content.ts` 的 AUDIO/SFX_DURATIONS 未动。

## 交接（Release 维护路径）

`dist/` 已是修复后构建（入口 bundle `index-BOdIEah_.js`）。按
gate-feedback 约定走 build → push GitHub → `waku push`（必要时
`waku publish` 刷新 Feed 版本）。上线后真机一按验收留给玩家：
手机壳内进入 Playground，任意触屏一次后拨转任一玻璃盘应闻咔哒；
若设备曾被来电/切后台打断，再触摸一次即恢复（常驻解锁监听）。
