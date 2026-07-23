# gate-feedback-14 — 上线后玩家实测缺陷（2026-07-23，post-release 维护轮）

## 玩家反馈（逐字，最高优先级）

1. 我在playground点了拍摄怎么没有那个卡片生成，我之前测试的时候是有的

证据截图：`gate-feedback-14-shell-shutter.png`——App 运行在 Waku
平台壳内（顶部 WAKU chrome、右侧 feed 操作栏、底部工具条），
快门可见但点击无卡片产出。玩家此前的本地测试（8891 直开、无壳）
快门出卡正常（build/harden 取证均可复现）。

## conductor 排查方向（供参考，以实测为准）

- **壳内环境差异是嫌疑主线**（vanilla-at-root 未做壳体移植的接缝）：
  1. 平台壳手势/覆盖层拦截：feed 的透明手势区或底部操作栏是否
     盖住快门命中区（tap 落壳不落 App）；
  2. 壳内视口尺寸差异：result 卡入场动画/定位是否滑出可视区或
     被壳 chrome 压住（z-index / 视口高度）；
  3. 快门流程里的平台 API（保存/分享路径的 pv.* 调用）在壳内
     报错并中断出卡流程（本地无壳时不触发）；
  4. 线上 GCS base 下 canvas 合成/资源同源性复查。
- **复现工具**：`waku simulator`（CLI 自带模拟器）优先；对照
  raw GCS URL 直开（无壳）是否正常以定位"壳内专属"。
- 修复属实现层 → Build 修订模式；修完本地/模拟器取证，
  再由 Release 线程走维护路径重新上传（build → push GitHub →
  `waku push`，必要时 `waku publish` 刷新 Feed 版本）。

## 完成信号（约定）

- 修复 + 模拟器/无壳对照取证写 `docs/rebuild/fix-14-done.md`
  （含根因一句话、修法、复现前后证据），build-report 追加
  "修订 fix-14"段。
- 结构性/方向性障碍照旧写 handback.md。
