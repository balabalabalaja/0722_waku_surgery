# fix-01-done

**fix-01 完成**：gate-feedback-01 玩家 4 条 + 截图取证 5-13 条 +
机制澄清①②逐条修复完毕，双视口（390×844 / 1440×900）32 项自动断言
全 PASS，19 条单测 + tsc + 生产构建全绿；dev server 在 tmux
`surgery-preview`:8891 运行中（曾消失，已按约定原名重建）。

取证指针：

- 逐条处置表：`docs/rebuild/build-report.md` "修订 fix-01" 段
- 断言日志与截图：`docs/rebuild/evidence-build/fix-01/`
  （probe-fix01-log.txt、phone/wide 各 4 张）
- UI 关键状态截图（玩家硬规第 16 轮）：`docs/rebuild/ui-previews/`
  01 开局穿戴态 / 02 白框窗口态 / 03 拖拽调节态 / 04 玻璃环特写 /
  05 快照卡

## 待玩家裁定（UI 变体，均已截图，默认值可随裁定即时切换）

1. **环构图**（差异在无相机图最直观；真人特写下两者都大量被身体遮挡）
   - A `var-ring-composition-a-large-ref03(.png/-nocam.png)`：ref-03
     大盘背景式，盘体可出画、月牙从人身侧探出 —— **当前默认**
   - B `var-ring-composition-b-compact(.png/-nocam.png)`：紧凑前景小盘，
     整环入帧（改造前构图）
2. **环背弧素材**（"完整圆盘"与"玻璃留呼吸"的平衡）
   - A `var-ring-back-a-dimmed-0.34.png`：全环可见、背弧调暗缩小 ——
     **当前默认**
   - B `var-ring-back-b-frontonly-0.png`：只亮前弧 2-4 件（玻璃定案
     第 4 条原文）
3. **窗口默认尺寸**
   - A `var-window-default-a-uniform-0.80.png`：三窗统一 0.80
   - B `var-window-default-b-uniform-1.05.png`：三窗统一 1.05（更大）
   - C `var-window-default-c-perkind-nose-0.65.png`：眼嘴 0.80、
     鼻 0.65（鼻窗全高会与眼/嘴窗相撞）—— **当前默认**
4. **窗口取景倍率**（窗内名画的裁切松紧）
   - A `var-window-reveal-a-1.35.png`：1.35，默认窗内器官完整可辨 ——
     **当前默认**
   - B `var-window-reveal-b-1.60.png`：1.60，放大窗口的"露出更多"
     头室更大，但默认窗只见素材中央约 50%（金鼻曾读成橙色板）

裁定切换方式（conductor 转呈后我方执行）：1/2/4 为运行时参数
（`RING_COMPOSITION.mode` / `RING_STYLE.floor` / `WINDOW_STYLE.oversize`），
3 为 `WINDOW_DEFAULT` 常量，均一处改动即生效。

---

**裁定已应用**（player-input 第 17 轮）：1/2/4 维持默认；3 改三窗统一
0.80（`WINDOW_DEFAULT`），窗口接触处做手柄去堆叠视觉处理（相邻角
互近 <18px 时双方小号绘制，命中逻辑不动）。证据：运行时 fits 实测
`{eye:0.8, nose:0.8, mouth:0.8}` + 默认态截图
`ui-previews/ruling-01-applied-uniform-0.80.png`；probe-fix01 双视口
32 项断言复跑全 PASS；tsc + 19 单测绿。
