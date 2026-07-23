# fix-02-done

**fix-02 完成**：gate-feedback-02 玩家 5 条 + conductor 取证 2 条逐条
修复完毕——白框统一缩半（0.40）且锚定校正到眼裂/鼻梁至鼻底/唇缝
（实测 Δ=0.0px）、手柄视觉缩半但命中区 52px（≥44pt）+ 落脸呼吸暗示、
环上素材去透明近实体（floor 0.95）、人像模式背景模糊（模糊房间 →
清晰玻璃环 → 清晰人像）、BGM 换更轻更稀疏版并压量至 0.18。

取证指针：

- 逐条处置表：`docs/rebuild/build-report.md` "修订 fix-02" 段
- 断言日志与截图：`docs/rebuild/evidence-build/fix-02/`
  （probe-fix02-log.txt = fix-01 全量回归 + fix-02 新增 6 项断言，
  双视口 390×844 / 1440×900 全 PASS；phone/wide 各 4 张截图）
- 关键 UI 状态截图（已按 fix-02 新默认刷新）：
  `docs/rebuild/ui-previews/01-opening-dressed.png`（缩半窗口 +
  实体环件 + 背糊人锐）、02 窗口态、03 拖拽调节态、04 玻璃环特写、
  05 快照卡
- 新 BGM durable URL 在 `src/content.ts`（curl 取证 206 audio/mpeg）
- 机器底线：tsc + 19 单测（含新锚定断言）+ 生产构建全绿；
  dev server tmux `surgery-preview`:8891 热更运行中

注记：#2（窗口统一 0.40）为玩家逐字指令，明确覆盖第 17 轮
"统一 0.80" 裁定；第 17 轮其余三项裁定（环构图 large / 背弧显示 /
取景倍率 1.35）维持不变，背弧显示的透明度实现已按 #3 改为近实体。
