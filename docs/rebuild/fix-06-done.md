# fix-06-done

**fix-06 完成**：摄像头背景整体废弃，层序定稿**固定油画背景 →
玻璃环（鼻/眼人后、嘴前景）→ 分割人像 → 窗口 → HUD**——重影从根上
消失。背景用玩家自备 `assets/background.webp`（Rothko 式色域画），
本地打包 `public/bg/background.webp`（同源、快照卡 canvas 无跨域
污染），cover 裁切铺满 + 静态细颗粒 overlay 遮上采样与 WebP 色带。
clean-plate / Kuwahara 旧管线整体下线。

- **待玩家裁定段**：无（原 3-4 张候选背景的裁定流程随玩家自备定稿
  取消；已生成未使用的 2 张候选图 URL 记录于 build-report fix-06 段，
  不进产物）。
- **性能回收**：下线管线已计量成本 4.5–13ms/220ms tick 纯像素工作
  → 0；headless CPU 推理 render/track 4-5 → 6/6 fps；fallback 渲染
  60fps 维持；真机数值归 Harden（`engine.frameMs` 已内置）。
- **发丝边取证（橙底）**：`evidence-build/fix-06/hair-edge-closeup.png`
  （dpr3）——mask 渐变带已收紧（0.45-0.75），残留如实记录：细灰
  渗边 + 256px mask 上采样轻阶梯，属分割模型分辨率上限，进一步
  matting 归 Harden。
- 断言：`evidence-build/fix-06/probe-fix06-log.txt`（历轮全量回归 +
  背景就绪/帧耗记录断言，双视口 390×844 / 1440×900 全 PASS，
  0 失败）；关键 UI 状态 `ui-previews/01–05` 已按定稿层序刷新。
- 机器底线：tsc + 19 单测 + 生产构建全绿；dev server tmux
  `surgery-preview`:8891。

---

**fix-06b（背景终稿替换）已完成**：玩家重画的 `assets/background.png`
（1290×2293 PNG，晨光渐变 + 自带油画肌理，原创无版权问题）替换旧
background.webp——打包压为 **900 宽 q88 WebP（578KB，"q90 级/几百
KB"双达标；dpr2 帧下 ≥1:1 降采样）** 落 `public/bg/background.webp`
（引用路径唯一、无旧 jpg/webp 残留）；程序颗粒 overlay 因与自带肌理
重复而移除（`makeGrainTile` 下线）；浅色底发丝边重拍取证
`evidence-build/fix-06/hair-edge-closeup-06b-light-ground.png`（浅底与
相机原背景色调相近，渗边几乎不可见，余 256px mask 轻阶梯归 Harden）；
probe-fix06 双视口复跑全 PASS（可见弧断言加双次采样抗 mask 时机
抖动）；tsc + 19 单测 + 生产构建（dist/bg 578KB）全绿。
