# brief-harden — Surgery

date: 2026-07-23 ・ thread: waku-harden（无人模式）・ port 8891

**做了什么**：贴合层硬化，未碰玩法/状态机/核心循环，fix-01…13 视觉零回退。
① 壳体移植——模板私仓 404（无权限），产物以 vanilla-at-root 交付（同已上线的
pivoting-circles 先例），平台接线补全，门禁全绿。② 本地化——无壳体故在文本层建
最小自足 i18n（`src/i18n.ts`：设备检测 + `<html lang>`，无切换）；`content.ts`
补 zh 全量（16 UI 键 + 26 画作信用，文化迁移非直译，字标 SURGERY 双语不译）；
canvas 信用读同一 locale 表。③ 安全区——顶/底 inset 参数化对齐 `--waku-*`/
`--sys-*`，新增消费 `pv.host.safeArea()`，快门上移避开宿主底部导航带（校准非回退）。
④ 字体——角色 token + zh CJK 栈 + SAT 等宽 + fallback 提示补 scrim 对比。

**怎么验**：门禁最终 lint clean / test 22 pass / build 出 `dist/index.html`。独立
Playwright 烟测（`docs/rebuild/evidence-harden/`）：核心循环走通（首触拨环换件→
快门视觉坐标 tap→出卡 2.65MB→再来一张，首胜 6s）、安全区三档全 PASS、语言三档
（zh/en/fr→en）全 PASS、BGM≤1、模型 CDN 阻断仍 fallback 可玩、无滚动/无手机壳/
无控制台报错。测试断言经 scratchpad 副本突变验证真咬合（真树未动）。

**pending items**：① 手势规二（未检测到手的虚线手形+文字提示）与 brief「不出现
文字教学」核心 Hook 冲突 → 送裁 Create/Build，未擅改（非阻断，产物完整可玩）。
② 壳体 SOP：Release 若获模板仓权限需对齐。③ MediaPipe/Google Fonts 走 CDN（失败
已兜底），自托管留 Release。④ 真机 iOS/GPU 帧率/真手掌拨手感未测（headless 限制）。
⑤ zh 画作译名为高置信最佳努力，玩家可改 `CREDITS_ZH`。

**产物路径**：hardening-report.md / review-report.md / smoke-report.md 已落盘。
