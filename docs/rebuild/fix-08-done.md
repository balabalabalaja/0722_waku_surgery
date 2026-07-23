# fix-08-done

**fix-08 完成**：顶栏不居中已修——根因是 `pointer-events-auto` 的
inline `<span>` 包装层参与 flex 居中时宽度解析异常（双视口一致左偏
15.1px，实测取证）；去掉包装层、`pointer-events-auto` 直接落在
`#topbar` 根节点上作为 flex 子项，并收紧内部间距（gap-3→gap-2，
消除 390 宽下的贴边风险）。修后双视口实测 **offset = 0.0px**（顶栏
中心 === 9:16 演出区中心，与浏览器窗口无关）。

光学配重检查：胶囊整体居中后，左侧四图标 + 右侧 SAT 横杆的内部
不对称在整条玻璃胶囊的读感内可接受（SAT 组含标签/轨道/百分比，
视觉质量近似两枚按钮）；如玩家想要严格光学对称，可一行改动换
`[图标×2] SAT [图标×2]` 对称排布，待玩家表态，默认不动。

取证指针：

- 修前偏移量化：phone/wide 均 `offset=-15.1px`（排查记录）；
  修后 `offset=0.0px`（双视口）
- 双视口截图：`evidence-build/fix-08/topbar-centered-phone-390x844.png`
  / `topbar-centered-wide-1440x900-letterbox.png`（letterbox 黑边
  对称、顶栏对齐演出区中轴）
- `ui-previews/01-opening-dressed.png` 已刷新
- 回归：probe-fix07 全量复跑 0 失败（一次运行中出现两条已知时序
  抖动——分割 mask 采样与穿戴等待窗口，均与本次 CSS 改动无因果，
  复跑即绿；已知抖动清单归 Harden 稳定化）；tsc + 19 单测 +
  生产构建全绿；dev server tmux `surgery-preview`:8891
