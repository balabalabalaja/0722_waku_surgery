# fix-09-done

**fix-09 换皮完成**：三个窗口的白框视觉全部换成玩家提供的
`assets/frame.svg` 样式——按 SVG 几何**参数化 canvas 重绘**
（非贴图）：细线矩形（参考 stroke 3/717）+ 四角 **45° 对角粗斜标**
（stroke 10/717、半长 50.58/717，以角点为中心沿角部外向对角线穿越，
与 SVG line 坐标核对一致）；长度与线宽按窗口最小边等比缩放并设
**最小值下限**（rectStroke ≥1.2px / tickStroke ≥3px / tickHalf ≥7px，
小窗口下下限主导保持利落粗标读感）；旧"L 形角标 + 小方块手柄"视觉
移除；相邻窗口角标去堆叠沿用（互近角斜标缩至 0.65×）；呼吸亮度
（落脸/触碰后 affordance）与暗色晕（亮底可读）保留。

**隐形命中区零改动**：fix-07 硬排序（手柄 > 框体 > 环带）与尺寸
（角柄 26px 命中 + 10px 排他死区、框体 8px 外扩）原样维持——本轮
只动视觉层（`drawBracket` 函数），`appliedBox`/`TUNING`/路由未触碰。

取证指针：

- 参考构图：`docs/rebuild/ref-04-frame-style.png`；SVG 源
  `assets/frame.svg`（自 `assets/SVG/资源 58@4x.svg` 规范化）
- 视觉落地：`ui-previews/01-opening-dressed.png` / `02-window-state.png`
  / `03-drag-adjust.png` 已刷新（细线矩形 + 45° 粗斜标、去堆叠可见）
- 回归：probe-fix07 全量复跑 **0 失败**（含命中优先级三连断言——
  证明命中层未被换皮影响）；tsc + 19 单测 + 生产构建全绿
- dev server tmux `surgery-preview`:8891
