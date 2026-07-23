# fix-04-done

> **注**：第 2 条初稿（头顶方案）已按玩家第 25 轮更正回退，最终形态
> 见 `fix-04b-done.md`（嘴环位置不动、改前景层）。本文其余条目有效。

**fix-04 完成**：①油画背景 v2——内部分辨率 300px + SAT 积分图大核
Kuwahara（半径 6）+ 色度提升 + 色块交界勾勒线，读作被画出来的平坦
颜料块而非失焦模糊（滤镜层直出证据 `bg-paint-canvas-direct.png`），
220ms 节流单次 4.5–10ms 不拖帧率，人与三环照片级清晰；②嘴环可见性
——最终按 fix-04b 执行（见上注）。顺带修复取证发现的环拾取度量 bug
（圆形距离 vs 椭圆 hitTest 不一致导致邻环抢拖拽），并验证玩家素材
升级（682/859/619 宽真实最高分辨率）已被烘焙管线零改动吃到、
清晰度对比已重拍。

取证指针：

- 逐条处置表：`build-report.md` "修订 fix-04" 段
- 断言：`evidence-build/fix-04/probe-fix04-log.txt`（历轮全量回归 +
  fix-04 新增，双视口 390×844 / 1440×900 全 PASS，0 失败）
- **背景前后对比**：`bg-before-lowres-kuwahara.png`（旧：低清模糊感）
  vs `bg-after-large-kernel-painted.png`（新：整帧内嵌）+
  `bg-paint-canvas-direct.png`（油画层直出——平坦色块、利落边界）
- **清晰度重拍（新素材）**：`clarity-after-2x-assets.png`
  （对照 fix-03 的 before/after 同组合同参数；运行时 sprite 烘焙尺寸
  实测 682×298 / 619×1080 / 859×375）
- 关键 UI 状态：`ui-previews/01–05` 已刷新
- 机器底线：tsc + 19 单测 + 生产构建全绿；dev server tmux
  `surgery-preview`:8891（no-store 响应头）
