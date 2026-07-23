# fix-07-done

**fix-07 完成**：①侧栏改**顶部横向玻璃药丸栏**（四控件 + SAT 横拖），
位置按 waku 安全区/Zone 规则**参数化**——
`--surgery-topbar-inset = safe-top + 56px 顶部 chrome + 10px gap`
（CSS 变量结构就位，精确数值留 Harden 按平台壳 `--waku-*` 校准）；
环几何顶/底保留带同步参数化（`LAYOUT_RESERVE {top:120, bottom:132}`，
选择焦点必在顶栏带以下、快门区以上）；实测顶栏 top=66、bottom=116，
与嘴带（top 625/649）和脸区零重叠。②触屏命中**硬排序**：四角手柄 >
窗口框体 > 环带，并加**排他边距**（手柄 26px 命中圈外再加 10px 死区，
指针在此范围内永不落环）。

取证指针：

- 逐条处置表：`build-report.md` "修订 fix-07" 段
- 断言：`evidence-build/fix-07/probe-fix07-log.txt`（历轮全量回归 +
  fix-07 新增，双视口 390×844 / 1440×900 全 PASS，0 失败）；命中
  优先级三连断言：窗口被推到环带上四角仍拿 scale 手柄 / 死区指针
  不落环 / 远离窗口环正常起拖
- 顶栏新位截图：`ui-previews/01-opening-dressed.png`（已刷新，
  横栏在 chrome 带下方居中、SAT 横拖、不遮三环与脸）
- 机器底线：tsc + 19 单测 + 生产构建全绿；dev server tmux
  `surgery-preview`:8891
