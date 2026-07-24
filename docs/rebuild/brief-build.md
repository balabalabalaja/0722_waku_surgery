# brief-build — Surgery

> **fix-01 已完成**（验收闸反馈 13 条 + 机制澄清①环在人身后/②白框
> 取景窗 + UI 硬规）：9:16 帧、玻璃 v2、人像分割层序、窗口机制、
> 灵敏度修复；32 项双视口断言全 PASS。详见 `fix-01-done.md`（含
> 4 组待玩家裁定 UI 变体；第 17 轮裁定已应用）与 build-report
> "修订 fix-01" 段。
>
> **fix-02 已完成**（第二轮验收 5+2 条）：白框统一缩半并精准锚定
> 眼裂/鼻/唇缝、手柄视觉减半命中 ≥44pt + 呼吸暗示、环件去透明
> 近实体、人像模式背景模糊、BGM 换轻压量。断言双视口全 PASS。
> 详见 `fix-02-done.md` 与 build-report "修订 fix-02" 段。
>
> **fix-03 至 fix-06 已完成**（逐轮闸门 + 玩家中途更正均落）：窗口
> 0.80 终裁 + contain 取景、素材升级至真实最高分辨率、油画背景数次
> 迭代后按玩家自备 Rothko 底图定稿（固定背景层序：油画 → 玻璃环 →
> 分割人像，嘴环前景胸口带、鼻/眼人后）、重影根除（背景不再来自
> 摄像头）、boot 超时兜底、FPS/帧耗计数器内置。各轮 done 文件与
> build-report 修订段齐备（fix-03/04/04b/05/06-done.md）。
>
> **fix-14 已完成**（post-release 维护：壳内快门不出卡）：根因 =
> 平台壳注入跨域 `<base>` 致贴图污染 canvas、`toDataURL` 抛
> SecurityError 静默断流；修法 = 部件/背景图两处加
> `crossOrigin='anonymous'`（GCS ACAO:\*，同源 no-op）。真壳复现 +
> 单端口双源机制孪生前后对照 + probe-fix07 全量回归 0 失败。新
> `dist/`（入口 `index-CMZR0o1x.js`）待 Release 维护路径重新上传。
> 详见 `fix-14-done.md` 与 build-report "修订 fix-14" 段。
>
> **fix-15 已完成**（post-release 维护：真机转盘咔哒 SFX 缺失）：根因
> = 咔哒从 rAF 触发、永不在手势内，iOS 逐元素解锁令其永久
> NotAllowedError（BGM/快门各有手势路径所以听得到）；修法 = SFX 切
> WebAudio 主路径（手势内 resume + 每次新建 bufferSource），HTMLAudio
> 池降为回落并首手势祝福解锁，仅动 `src/engine/audio.ts`。桌面孪生
> 四场景前后对照 + probe-fix07 回归双视口 0 失败。新 `dist/`（入口
> `index-BOdIEah_.js`）待 Release 维护路径重新上传；真机一按验收留
> 玩家。详见 `fix-15-done.md` 与 build-report "修订 fix-15" 段。

- 做了什么：把源项目改造成完整可玩的竖屏 playable——前置相机镜像
  打底，三个**玻璃盘**（细管甜甜圈、锐高光、透背景折射、3D 倾斜、
  顶环穿头遮挡）环绕头部，前弧露 2-4 件名画五官，素材间保留油画感
  融接；拨转/手掌拨转换脸、白框手柄调形、侧栏（HUD/素颜对比/骰子/
  重置/饱和度）、快门出拍立得卡（credits 三行 + SURGERY 字标），
  Save 走平台图片查看器、Share 走评论区。
- 怎么跑：`npm install && npm run dev` → http://localhost:8891
  （移动端竖屏视口体验）；`npm test` 19 用例全绿；`npm run build`
  产 `dist/`（已在 8891 preview 实测可跑）。
- 真实运行证据：`docs/rebuild/evidence-build/`（真脸假摄像头全流程、
  拒相机 fallback 全流程、生产构建冒烟、锚点数值对照、截图与日志）。
- 已知问题：中文/字体/安全区数值/真机性能与真手手感归 Harden；
  credits 为最佳努力辨认（高置信项见 build-report，可整表替换）；
  MediaPipe 与字体走 CDN；发布与封面归 Release。
- 生产事件：8891 曾被两个外来 dev server 占用（一度撞进别的项目
  页面），已按派工书端口专属条款清占收回，全程记录在 build-report。
