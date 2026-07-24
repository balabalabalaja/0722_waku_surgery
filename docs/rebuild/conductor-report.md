# conductor-report — Surgery（成功交付）

date: 2026-07-23 ・ pipeline: waku-conductor（Create 内联 + Build tmux + Harden/Release 隔离子代理）・ port 8891

## 一眼看清

- **Playground URL**：
  `https://storage.googleapis.com/waku-core-aicap-dev/content-reviews/rvi_9e4226b9c1c5485f86dda7c245a86fd0/main/bbdc3591-5208efe478ff/index.html`
- **Feed 已发布**（2026-07-23，玩家第 42 轮末端确认后）：
  `https://storage.googleapis.com/waku-core-aicap-dev/sites/b085697a-e5c1-5277-a6f0-63f4931ef930/20260723T073842219277/index.html`
  （content_id `cnt_59ff337c85c24d4a92f3b29344cb7a98`，public，
  title SURGERY，回滚坐标 dep_816fe28d…，详见 release-report
  「Feed 发布」段）
- **封面**：`evidence-release/cover-surgery.jpg`（开局穿戴态定稿画面，
  已设为线上 cover_asset；可随时 `waku cover set` 替换）
- **入库 commit**：`1e3485f`（`https://github.com/balabalabalaja/0722_waku_surgery`，
  private；Muse Library 一字节未动，归档玩家自理）
- **玩家创意一句话**（player-input 第 3 轮逐字）：
  > 我打算利用mediapipe技术实现用户打开摄像头交互 他可以转动转盘换
  > 眼镜鼻子嘴巴（眼睛鼻子嘴巴从名画来的），还可以拖住白色的方块
  > 扩大缩小更换范围（也就是眼睛鼻子嘴巴的大小）

## 审计段（玩家亲选全记录）

**Create 澄清卡（第一二轮 + 补问）**：三盘同屏环绕 / 跟脸走 /
开局就变脸 / 拍立得快照卡 / 不用 AI / 音效画廊氛围（玩家纠偏：
Surgery 仅项目名非气质）/ 侧栏授权自决 / 手掌拨转。

**Build 期玩家亲选与裁定**（player-input 第 11–38 轮）：视觉小样
v2 定稿（融接闭环）→ 油画感 + 重投影（后随玻璃盘定案作废）→
**玻璃盘定稿** → 机制澄清（环在人身后、白框即窗口）→ UI 硬规
（不确定就给玩家看）→ fix-01…13 十三轮验收反馈与变体裁定
（环构图 A / 背弧 A / 窗口 0.80 终裁 / contain 取景 / 嘴环人前
胸口带 / 统一油画背景（玩家自绘晨光渐变）/ 顶栏白色半透明全白
线稿 / 框子换玩家 SVG 样式）。

**Harden 后仲裁**：隔空手势维持零提示（守 brief 零文字教学）。

**Release 裁定**：授权 git + `waku push`（玩家账号建私仓）；
只上 Playground、不发 Feed。

**handback 往返**：1 次——Release Preflight 上传路径三条互斥 →
玩家裁定选项 1（`handback-1-release-player.md`）。
Create/Build/Harden 零 handback；Build 十三轮 fix 均为玩家插入的
验收闸（非协议退回）。

## 风险段（pending / 已知风险汇总）

| 项 | 来源 |
|---|---|
| MediaPipe WASM/模型 + Google Fonts 走 CDN（失败有兜底、未自托管） | hardening-report「Unfixed items」/ release-report |
| 真机 iOS/GPU 帧率与真手掌拨手感未实测（headless 限制；FPS 计数器已内置） | hardening-report / fix-05-done |
| zh 画作译名为高置信最佳努力，可改 `CREDITS_ZH` | hardening-report / brief-harden |
| 壳体为 vanilla-at-root（模板私仓当时 404；玩家现或有权限，SOP 对齐留后续） | hardening-report / release-report / player-input 第 41 轮 |
| 极近特写（脸宽 >85% 帧宽）鼻环可能无可见弧段（玩家裁定接受） | fix-04b-done |
| 发丝边 256px mask 轻阶梯（matting 细化未做） | fix-06-done / hardening-report |
| Feed 发布未执行，待玩家末端确认（`waku publish`） | release-report |

## 台账段（各阶段耗时与重试）

| 阶段 | 起止 | 耗时 | 重试/退回 |
|---|---|---|---|
| Preflight + Intake | 07-22 16:0x–16:5x | ~50m（含素材导出协作） | 0 |
| Create（内联·有人） | 07-22 16:5x–17:05 | ~15m（澄清 3 轮） | 0 |
| 视觉小样闸（玩家插入） | 07-22 17:0x–17:2x | ~25m（v1→v3） | — |
| Build 初版（tmux·Fable 5） | 07-22 17:05–18:11 | ~66m | 0 |
| Build fix-01…13（玩家验收闸循环） | 07-22 18:1x–07-23 13:0x | 跨夜多节，13 轮 | 窗口异常 0；fix-04b 为指令时序补丁 |
| Harden（子代理·Opus 4.8） | 07-23 13:4x–14:2x | 37m | 0 |
| Release（子代理·Opus 4.8） | 07-23 14:3x–15:0x | 首轮 14m（阻断）+ 续跑 ~25m（含上传） | handback 1（玩家裁定后续跑） |

**自动决策要录**：预检全绿放行（模型/tmux/CLI/MCP/库根/磁盘）；
Create 门禁 grep 全过零确认进 Build；Build 完工门禁两次验收
（contract+report+证据段）；玩家中途指令均逐字落盘转达（第 10-38 轮）；
嘴环头顶方案因玩家更正回退（fix-04b）；Harden 门禁三报告全绿零确认
进 Release；Release git 授权仅限上传路径。

## 维护轮 fix-14（上线后，2026-07-23）

玩家真机 Playground 实测：壳内点快门不出卡（本地无壳正常）。
根因：平台壳注入 `<base href=GCS>` → 素材跨域污染 canvas →
`toDataURL()` 抛 SecurityError 静默中断出卡；`waku simulator` 会把
URL 重写回同源、恰好掩盖此缺陷（测试盲区已记录）。修法：两处
`crossOrigin='anonymous'`（fix-14-done.md），全量回归 0 失败。
重传：commit `8b34d5f` → 新 Playground URL（release-report
「fix-14 重传」段）→ Feed 同项目刷新版本（content_id 不变、
feed_seq 3 is_current，旧版 dep_816fe28d… 可回滚）。

## 维护指北（摘自 release-report）

改码 → `npm run build` → push GitHub → 重跑 `waku push` 得新
Playground URL；Feed 发布：玩家确认后 `waku publish`。
