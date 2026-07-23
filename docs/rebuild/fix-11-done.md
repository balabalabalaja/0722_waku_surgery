# fix-11-done

**fix-11 完成**（玩家第 36 轮）：

1. **顶栏透明度**：白底 `bg-white/65 → bg-white/50`（更透、更轻）。
2. **窗口框细 50%**：统一 `FRAME_SCALE=0.5`——矩形线宽、45° 角标
   线宽与半长、以及三项**最小值下限**全部同步减半
   （rectStroke ≥0.6px / tickStroke ≥1.5px / tickHalf ≥3.5px），
   比例关系与 frame.svg 几何原样保持；命中区照旧不动。

取证指针：

- `ui-previews/01-opening-dressed.png` 已刷新（顶栏 50% 透出发色、
  半重框线同屏可验）；02/03 同步刷新
- 回归：probe-fix07 全量复跑 **0 失败**；tsc + 19 单测 +
  生产构建全绿
- dev server tmux `surgery-preview`:8891
