# fix-03-done

**fix-03 完成**（含第 19/20 轮"窗口回 0.80"终裁应用）：上脸清晰度
（渲染链审计 + smoothing 高质量 + contain 取景把上脸显示尺寸拉回
降采样区间）、嘴环左下侧翼可见（每环独立选择焦点 + 焦点点位夹紧）、
contain 默认取景（器官完整入窗留呼吸边，1.35 裁定作废）、油画化
背景层（Kuwahara 降采样节流管线，人与环清晰）。另修 boot 卡死
（模型 CDN 拉取中止实录 → 重试 + 25s 硬超时落 fallback）与玩家旧包
问题（dev server `Cache-Control: no-store`）。

取证指针：

- 逐条处置表：`build-report.md` "修订 fix-03" 段
- 断言：`evidence-build/fix-03/probe-fix03-log.txt`（fix-01/02 全量
  回归 + fix-03 新增，双视口 390×844 / 1440×900 全 PASS）
- **清晰度前后对比**（同组合 eye_03/nose_08/mouth_02、dpr3 同参数
  对拍）：`evidence-build/fix-03/clarity-before-1x-oversize1.35.png`
  （旧 1.35 取景：放大裁切 + 上采样发软）vs
  `clarity-after-contain-smoothing.png`（contain：器官完整、笔触/
  龟裂纹理可辨）
- 关键 UI 状态：`ui-previews/01–05` 已刷新（01 可见嘴环件从左右
  侧翼探出、油画化背景、contain 三件套）
- 机器底线：tsc + 19 单测 + 生产构建全绿；dev server tmux
  `surgery-preview`:8891（vite 配置变更自动重启，响应头 no-store）

## 需 4x 素材（源分辨率硬顶，conductor 请转呈玩家）

渲染链已无损（全程 DPR 分辨率、无中间降采样、高质量重采样），但
放大窗口/高倍 DPR 场景仍受**源图分辨率**限制：

- 现有素材实测：`assets/parts/` 眼 341×149 / 嘴 430×188 / 鼻 310×540；
  `assets/2x/` 的 26 个 "@2x" 文件**与 1x 同分辨率**（430×188、
  310×540、341×149，±1px，仅文件名带 @2x）——盘上不存在更高
  分辨率版本（映射尝试记录：`evidence-build/fix-03/` 下 map2x 脚本
  因"无 2 倍尺寸候选"而中止，未改动任何素材）。
- 影响场景：默认 contain 视图已锐（显示尺寸 ≤ 源尺寸）；玩家把
  窗口拖大超过 ~1.1 倍、或 dpr3 大脸特写时，眼/嘴素材进入上采样区
  （最劣约 1.8-2 倍），出现不可避免的软化。
- 请求：从 Illustrator 按 **4x** 重导出 26 个素材（眼 1364×596 /
  嘴 1720×752 / 鼻 1240×2160），文件名与 `assets/parts/` 一致即可，
  运行时会按源图原始分辨率自动烘焙（`loadParts` 已按
  `naturalWidth/Height` 处理，无需代码改动）。

> **已闭环（fix-04 期）**：玩家已重导并覆盖 `assets/parts/`
> （眼 682×297 / 嘴 859×375 / 鼻 619×1080——该 AI 文件的真实最高
> 分辨率，理论 1364 宽不存在，682 已覆盖 dpr3 最坏场景）；烘焙管线
> 实测吃到新分辨率，对比图见
> `evidence-build/fix-04/clarity-after-2x-assets.png`。
