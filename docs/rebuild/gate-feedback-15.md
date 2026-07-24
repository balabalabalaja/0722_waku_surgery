# gate-feedback-15 — 上线后真机缺陷（2026-07-24，post-release 维护轮）

## 玩家反馈（逐字，最高优先级）

1. 我刚在手机上试了一下，发现没有转动时候的齿轮咔嚓咔嚓的声音

玩家补充确认（澄清卡）：**只缺转盘咔哒声**——BGM/快门声能听到；
铃声拨片与壳内声音开关都开着，非静音问题。真机 = 手机浏览器开
Playground（平台壳内）。

## conductor 排查方向（供参考，以实测为准）

- **混合音频管线嫌疑最大**：BGM/快门若走 HTMLAudio 而咔哒走
  WebAudio（或反之），iOS 对两条通路的解锁策略不同——WebAudio
  AudioContext 必须在用户手势回调内 resume，否则永久 suspended
  （桌面 Chrome 宽松所以本地测不出）。
- iOS 上高频重触发问题：单个 Audio 元素 `currentTime=0` 快速重播
  在 iOS Safari 不可靠；应使用 WebAudio bufferSource 每次新建
  （前提是 context 已解锁）。
- 触发路径检查：咔哒是否只挂在 pointer/mouse 事件而触屏 touch
  路径漏触发；掌拨通道换件是否也触发咔哒。
- 桌面复现手段：Chrome `--autoplay-policy=user-gesture-required` +
  Playwright 移动仿真（touch）可模拟解锁策略；修复后最终真机
  一按仍留玩家。

## 约束

- 修订模式只修此缺陷；fix-01…14 已定稿内容零触碰；端口 8891。

## 完成信号（约定）

- `docs/rebuild/fix-15-done.md`（根因一句话 + 修法 + 复现前后取证）
  + build-report 追加"修订 fix-15"段。结构性障碍写 handback.md。
