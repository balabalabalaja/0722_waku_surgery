# fix-13-done

**fix-13 完成**（玩家第 38 轮）：只针对顶栏**文字**加强可读性——
SAT 标签与百分比数字的 text-shadow 加深一档
（`0 1px 2px rgba(0,0,0,0.3)` → `0 1px 3px rgba(0,0,0,0.45)`），
字重上调（百分比 normal→semibold；SAT 保持 bold）+ 字号 +1px
（SAT 7→8px、百分比 9→10px）、白色提满（white/90→white）。
图标线稿投影与整体白色气质**未动**（仍 fix-12 参数）。

取证指针：

- `ui-previews/01-opening-dressed.png` 已刷新（SAT / 100% 清晰
  可读）；02/03 同步刷新
- 顶栏几何复验：字号变化后自然宽 362px < 390 帧宽无溢出、双视口
  居中 offset=0.0px
- 回归：probe-fix07 全量复跑 **0 失败**；tsc + 19 单测 +
  生产构建全绿
- dev server tmux `surgery-preview`:8891
