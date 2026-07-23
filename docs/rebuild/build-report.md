# build-report — Surgery（art-history face collage）

date: 2026-07-22
thread: waku-build（无人模式）
端口：8891（本管线专属）

## 完成状态

**可玩**。首屏到收束全流程在浏览器真实走通（dev 与生产构建产物
各 ≥1 次），相机拒绝 / 模型加载失败两条降级路径同样完整可玩到出卡。

## 兑现对照（vs create-brief）

| brief 承诺 | 产物兑现 |
|---|---|
| 一句话方向：摄像头 + 三个名画五官转盘环头 → 拨转换脸 → 白框调形 → 快门出 credits 卡 | 全部落地：`CollageEngine`（相机镜像打底、三玻璃盘环脸）+ 白框四角手柄缩放/拖移 + 快门→拍立得卡（credits 三行 + SURGERY 字标） |
| Hook：检测到脸 1 秒内自动换脸、环已在动 | `boot→active` 检测到脸即随机整套飞落（探针实录 `probe-log.txt`：stage→active 后 applied 三件齐）；三环 idle 缓转（0.22 rad/s，首触即停） |
| 核心乐趣 D：8×8×10=640 组合 | 26 素材全部上环；转盘拨转 + 骰子随机 + 三角重置 + 白框调形 |
| 支线 G：镜像反差喜剧 | 实时镜像 + 椭圆羽化贴脸（结果卡 a4 可证：像素眼×粉彩鼻×版画嘴落在真脸上） |
| 核心循环：拨转→咔哒落脸→credits 更新→快门 | 过步进点咔哒 SFX + 飞落动画 + 落脸"嗒"；credits 由 applied 实时决定 |
| 首屏承诺：碰哪都有事、白框呼吸、无文字教学 | 环命中即拨、框命中即亮呼吸手柄；全程零教学文案（引导判定逐条"不引导"，见 contract） |
| 玩具节奏：零计时零催促 | 状态机无计时/失败态；face 丢失仅缓动回默认锚点 |
| 结果资产：拍立得卡，保存/分享 | `polaroid.ts` 合成 1000×1300 卡；Save→平台图片查看器（`pv.media.openImage`）/无宿主降级下载；Share→`pv.app.composeComment`（上传换公网 URL） |
| 环材质定案：玻璃盘 | 细管玻璃甜甜圈（管径 0.125r）+ 锐高光棱线 + 透背景折射（环管内底图放大重绘）+ 3D 倾斜椭圆（每环独立倾角/压扁）+ 前弧 2-4 件渐显 + 顶环穿头遮挡（视频头区羽化贴片）+ 适中投影；油画感仅存于素材间融接（预模糊+色相扰动+切向拉长笔触拷贝） |
| 不做清单 | 无医疗语义（含测试断言）、无内容内 AI、无计分/限时、单只右眼、无第四盘、无 [TRACKING] |

## 平台四层与文件结构

- 四层：Web + React 19 + Canvas 2D + multi-file（照 contract）。
- 入口：`index.html`（polyverse-manifest + vendor runtime）→
  `src/main.tsx` → `src/App.tsx`（状态机编排）。
- 引擎：`src/engine/`——`machine.ts`（纯状态机）、`facefit.ts`
  （landmark→锚点/环几何）、`dialmath.ts`（转盘数学）、`rings.ts`
  （玻璃盘渲染）、`stage.ts`（渲染循环+输入路由+手掌拨转+取景）、
  `polaroid.ts`（卡片合成）、`vision.ts`（相机+MediaPipe）、
  `audio.ts`（BGM controller + 有界 SFX）、`parts.ts`（素材加载羽化）。
- UI：`src/components/`——Sidebar / Shutter / ResultCard / BootScreen。
- 运行：`npm install`；`npm run dev`（8891）；`npm test`（19 用例）；
  `npm run lint`（tsc）；`npm run build` → `dist/`。

## 资产索引

| 资产 | 用途 | 来源/URL | 状态 |
|---|---|---|---|
| `public/parts/*.png` ×26 | 环上素材 + 贴脸部件 | 玩家提供（assets/parts 拷入 public） | ✅ 全部接入，椭圆羽化在 `parts.ts` |
| 环带油画融接 | 素材间过渡 | 代码生成（预模糊拷贝） | ✅ 零运行时 filter |
| fallback 背景 | 无相机场景 | 代码生成（继承源项目模拟器语言） | ✅ |
| 拍立得卡框 | 结果卡 | 代码绘制 | ✅ 文字走 `content.ts` |
| 封面 | — | 归 Release | 未做（按 contract） |
| vendor runtime | Waku 平台契约 | 拷自本机可信构建，sha256 `6eb50d95…c6f8` 与源一致 | ✅ |

## 音频索引（全部 durable GCS 直链，HTMLAudioElement 播放）

| 条目 | URL 摘要 | 接入 | 时长上限 |
|---|---|---|---|
| bgm_gallery | `…acj_d867…ef6.mp3` | 单一 controller，开屏即播，被拦截挂 once 手势重试，任意时刻 ≤1 轨 | loop |
| sfx_click | `…acj_9ba8…/asset-0.mp3` | 过步进点，3 元素池叠播 | 0.5s 硬截 |
| sfx_land | `…acj_4be0…/asset-0.mp3` | 素材落脸（idle 飞落降音量） | 0.5s |
| sfx_shutter | `…acj_df45…/asset-0.mp3` | 快门 | 0.6s |
| sfx_slide | `…acj_6356…/asset-0.mp3` | 卡片滑出 | 0.8s |

5 条 URL 取证：`curl -r 0-0` 全部 `206 audio/mpeg`（见自证摘要）。
完整 URL 在 `src/content.ts` `AUDIO`。

## 内容内 AI

不用（brief 明确）。无。

## Waku 融合

- manifest capabilities（显式全量）：`app.comment.compose`、
  `assets.write`、`assets.read.own`、`media.image.open`——与代码调用
  一一对应（composeComment / assets.upload / media.openImage），无多报。
- SDK wrapper：`src/waku/polyverse.ts`（ready 超时竞速；上传按卡缓存，
  Save 与 Share 复用同一平台资产）。
- 无宿主降级：Save→`<a download>`；Share 失败给状态行，不做平台外
  分享通道。发布/上传归 Release。

## 补默认项（brief 未写，Build 自决）

1. ready >6s 无脸 → 照样自动穿戴到默认锚点（首屏承诺不因无脸落空）。
2. 脸丢失 >2s → 环与部件缓动回屏幕默认锚点，保持可玩；脸回来重新跟脸。
3. 相机 OK 但模型加载失败 → fallback 仍用实时视频做底（仅失去跟踪）。
4. 素颜按快门 → credits 写 "Bare canvas — you"。
5. 环半径按视口封顶（0.3×短边）+ 中心三边夹紧、底部预留快门区——
   特写大脸时 mockup 比例会把环推出屏外（探针实测），此为可玩性下限。
6. 选中位定义为环前弧中心（玻璃盘 3D 倾斜下最靠观者处）。
7. 手掌拨转 = 掌心在环带区的切向速度→角速度（叉积），参数集中
   `stage.ts TUNING`。

## 自证证据摘要（evidence-build/）

探针：`probe.mjs`（Playwright，假摄像头 y4m 输入）+ `diag.mjs`
（锚点-landmark 对照）；日志 `probe-log.txt`；截图 a1–a5 / b1–b2 / c1。

- **入口无报错**：探针 A/B 均 `page errors: none`（仅 TFLite INFO 一条
  被 console.error 通道误列，非错误）。
- **全流程 ≥1 次**：A（相机+真脸 y4m）：boot→active（脸检测自动穿戴
  `{eye,nose,mouth}` 齐）→ 拖嘴盘换件（selected 3→5, applied=5）→
  骰子/重置生效 → 快门 → result（卡 dataURL 1.8MB）→ One more →
  active。B（拒相机）：boot→fallback（进场即穿戴）→ 拖盘 4→7 →
  快门 → result。C（生产构建 dist 于 8891 preview）：fallback→result，
  0 个 ≥400 响应。
- **touch-only**：探针全程 pointer 事件驱动；键盘零依赖。
- **无死胡同**：RESOLVE_FAIL/AGAIN/FACE_LOST 等出口由 19 条单测覆盖
  （`npm test` 全绿）；fallback 实测走通。
- **空间锚定**：`diag.mjs` 实测——鼻锚 (191,361) 落在 bridge(192,292)
  与 tip(191,413) 中点、眼锚 (272,303) 与右眼角 (235–310,~303) 重合、
  嘴锚 (191,490) 居唇区；放大自证 = 结果卡 `a4-result.png`（三件套
  精确贴在真脸五官上）。
- **资产真实加载**：26 素材 200（dist 抽查）；音频 5 条 durable 直链
  `206 audio/mpeg`；控制台无 404。
- **BGM/SFX 口径**：单 controller ≤1 轨（play 前 stop 旧轨）；每条
  SFX 播放路径显式 setTimeout 截断。
- **帧率**：fallback（无推理）60fps；headless CPU 推理下 10fps——
  headless 无 GPU，TFLite 落 XNNPACK CPU 所致（日志可证），真机
  GPU delegate 表现归 Harden 实测。

## 生产事件记录（端口取证）

启动时 8891 被两个外来管线 dev server 占用（`lsof`：pivoting-circles
vite PID 23797、lyrichand vite PID 32351——探针曾因此撞进 LYRIC HAND
页面，正是派工书"取证互踩"要防的事故）。按派工书端口专属条款清掉
两个占用进程收回 8891；此后取证全部在 8891 完成。

## 未解决问题（留给 Harden）

1. 中文文案未做（Build 只出英文，集中于 `src/content.ts`）。
2. 安全区数值未校准（safe 层已用 env(safe-area-inset) + flex，未实机取证）。
3. 真机性能/GPU delegate、真手掌拨转手感（`TUNING`）未实测。
4. credits 为最佳努力辨认：高置信（eye_03 梵高、eye_09 蒙娜丽莎、
   nose_07 蒙娜丽莎、mouth_02 美杜莎、eye_06/mouth_06 珍珠耳环少女、
   mouth_07 马蒂斯绿条纹）；其余为风格匹配的可信博物馆标签，玩家
   如有实际出处清单可直接替换 `CREDITS`。
5. MediaPipe wasm/models 走 CDN（jsdelivr + storage.googleapis），
   弱网首载慢；是否本地化归 Harden/Release。
6. Google Fonts 走 CDN（Inter/JetBrains Mono）；字体系统归 Harden。
7. 标准模板私仓无读取权限（`waku initial_repo pull` 404）；vendor
   runtime 从本机已发布项目拷贝并 hash 取证。Release 上传前如需对齐
   最新模板 SOP 请复核。
8. iOS WKWebView 宿主内 getUserMedia 权限表现未测（metadata.json 已
   声明 `requestFramePermissions: ["camera"]`）。
9. 无宿主 web 环境下 Share 按钮可能可见但 composeComment 不可用
   （vendor runtime 在裸浏览器 ready() 行为决定），失败有状态行承接。

## 修订 fix-01（gate-feedback-01 逐条处置 + 机制澄清 + UI 硬规）

取证：`docs/rebuild/evidence-build/fix-01/`（probe-fix01-log.txt =
双视口 32 项断言全 PASS + 截图）与 `docs/rebuild/ui-previews/`
（关键 UI 状态 + 裁定变体）。修复全程 dev server 走 tmux
`surgery-preview`:8891（中途该窗口曾消失，已按约定原名重建）。

| # | 反馈 | 处置 | 证据 |
|---|---|---|---|
| 1 | 圆盘残缺半空 | 玻璃管全环利落双缘线恒在；素材全环可见（背弧 `RING_STYLE.floor=0.34` 调暗缩小、前弧主导），完整圆盘读感恢复 | ui-previews/var-ring-composition-a-large-ref03-nocam.png；fix-01/\*-1-play.png |
| 2 | 器官没上脸 | 三重根因修复：宽视口构图崩坏（见 5）、环折射重绘抹掉贴脸层（折射改画背景层）、（新机制下）窗口层移到人像层之上 | probe "auto full set applied" PASS ×2 视口；锚点-landmark 断言 PASS |
| 3 | 操作不灵敏 | 全窗口最近角命中路由（相邻窗口不再抢手柄）、子步进拖动必进一格（nudge）、SPIN 阈值 1.6→1.1、snap 弹簧加硬、环命中带宽 0.78→0.95、掌拨区 1.15→1.3 | probe "sub-step drag advances one notch" PASS ×2 |
| 4 | 白框不可见 | 白框/手柄高对比重绘（alpha 0.85 + 深色晕 + 2px + 大手柄），亮背景可读；窗口默认必显 | ui-previews/01、02、03 |
| 5 | 宽视口无 9:16 | `#stage-frame` 强制 `min(100vw, 100dvh×9/16)` 居中 pillarbox（手机竖屏保持满屏不加黑边） | probe "9:16 pillarbox — frame 506x900, centered" PASS |
| 6 | 快门被裁半 | 快门归帧内 + bottom 提到 26px + safe-inset | probe "shutter fully on screen — bottom 874/900、818/844" PASS |
| 7 | 侧栏缺失 | 侧栏归帧内（此前钉在宽窗口最左被截图裁掉）+ 深色玻璃底提对比 | probe "sidebar visible inside frame" PASS |
| 8 | 灰烟环叠中央 | 投影改离屏 shadow trick（画面上无灰描边）；环几何按帧收敛 + 三环分立断言 | probe "rings separated, no pile-up" PASS |
| 9 | 玻璃廉价 | 玻璃 v2：净投影、双缘线、锐 glint、管内背景放大折射 + sheen、素材嵌玻璃高光 | ui-previews/04-glass-ring-closeup.png、\*-nocam.png |
| 10 | 素材混环 | 实为环堆叠视错觉；三环分立（含 9:16 帧 + 半径视口封顶）后消除；各环仅画自类素材（代码结构如此） | probe "rings separated" + 截图 |
| 11 | 融接成水平带 | 同为巨环浅弧视错觉；smear 沿环路径逐段绘制（预模糊贴图 + 切向旋转），修构图后走向正确 | \*-nocam.png（融接沿环带走） |
| 12 | 鼻贴眉心 | 鼻锚点向鼻尖偏置（bias 0.62）+ NOSE_H 1.5→1.35；开局整套三件断言 | probe "nose anchor below bridge midpoint" PASS |
| 13 | 边缘裁半 | compact 模式整环入帧；默认 large（ref-03 大盘）模式下盘体出画为规格本身，改为约束**前弧交互焦点**必在屏内快门区上方 | probe "dial front-focus zones reachable" PASS |

机制澄清落地：

- **① 环在人身后**：层序 背景→环→人。人像分割 = MediaPipe selfie
  segmenter（confidence mask → alpha 贴层，用鼻尖 landmark 采样自校
  正向，防前景/背景反转；每 2 帧与手部检测交替）。分割不可用降级
  羽化头/躯干剪影。probe "person segmentation layer" PASS。
- **② 白框=取景窗**：矩形裁切；素材以 landmark 锚定、
  `WINDOW_STYLE.oversize` 超采衬底；拖角改窗口大小（露出更多/更少
  名画）、拖框体移窗口。probe 三项（窗口移动 / 素材锚定不动 /
  拖角变大）PASS。
- 快照卡随层序连环入镜（`capture` rings:true）。

fix-01 期补默认项：窗口默认尺寸 per-kind（nose 0.65 / eye 0.8 /
mouth 0.8，鼻窗全高会撞眼嘴窗）；oversize 默认 1.35（1.6 时默认窗
只见素材中央 50%，器官辨识度差）；环构图默认 large。三者均出变体
图待玩家裁定（见 fix-01-done.md）。

## 修订 fix-02（gate-feedback-02 逐条处置）

取证：`docs/rebuild/evidence-build/fix-02/`（probe-fix02-log.txt，双视口
全部断言 PASS，含 fix-01 全量回归 + fix-02 新增 6 项）；关键 UI 状态
截图已按新默认刷新（`ui-previews/01–05`）。

| # | 反馈 | 处置 | 证据 |
|---|---|---|---|
| 1 | 怎么调节白框（可用性） | 组合修复：手柄命中区 ≥44pt（52px，与视觉解耦）+ 框体命中外扩 8px + 每次落脸后手柄呼吸 2.5s（可拖暗示）+（fix-01 已有）最近角路由/子步进必进格 | probe "handle hit ≥44pt" PASS；mechanic ② 拖移/拖角三项 PASS ×2 视口 |
| 2 | 白框太大，缩小至少一半 | `WINDOW_DEFAULT` 三窗统一 0.80→**0.40**（覆盖第 17 轮裁定，玩家新指令优先）；scaleMin 0.45→0.22 | probe "window default halved to 0.40" PASS；ui-previews/01、02 |
| 3 | 环别加透明度，看不清 | `RING_STYLE.floor` 0.34→**0.95**：环上素材近实体、颜色饱满；深度感靠近大远小 + 玻璃棱线/边缘（玻璃感保留在高光不在半透） | probe "ring parts near-solid" PASS；ui-previews/01 环件对比 |
| 4 | 背景模糊（人像模式） | 层序改为：**模糊房间背景**（视频双降采样 40px 宽再放大，零 ctx.filter、全引擎兼容）→ 清晰玻璃环 → 清晰人像（分割 matte）；玻璃折射同步折射模糊背景 | ui-previews/01（人锐背糊）；fix-02/\*-1-play.png |
| 5 | BGM 太噪 | 重生成更轻更稀疏底噪（长静默弦乐涌动 + 美术馆房间气流声，无旋律无节奏），音量 0.35→0.18；SFX 保留不变 | 新 durable URL `…acj_16ba….mp3`（curl 206 audio/mpeg），`src/content.ts` |
| 6 | 三窗锚定偏移 | 眼窗纵心改用**上下眼睑中点**（眼裂中心，Δ=0.0px 实测）；鼻锚 tip-bias 0.62→0.72 + NOSE_H 1.35→1.5（覆盖鼻梁→鼻底，sprite 底缘过鼻尖实测 +118px）；嘴窗以**唇缝**（13/14 中点）为纵心（Δ=0.0px） | probe 三项 "#6" PASS ×2 视口；19 单测含新锚定断言 |
| 7 | 视觉缩半但命中 ≥44pt | 手柄视觉 14-18px→8-10px 方块、框线 2→1.5px、角标 18→10px；命中区独立于视觉（`handleHitPx` 26 → 52px 直径） | probe "#7" PASS；ui-previews/03 |

fix-02 期补默认注记：#2 为玩家逐字指令，明确覆盖第 17 轮"统一 0.80"
裁定；旧裁定变体截图保留仅作历史归档。

## 修订 fix-03（gate-feedback-03 四条 + 第 19/20 轮终裁 + 稳定性）

取证：`docs/rebuild/evidence-build/fix-03/`（probe-fix03-log.txt =
fix-01/02 全量回归 + fix-03 新增断言，双视口全 PASS；清晰度前后对比
clarity-before/after）。

| # | 反馈 | 处置 | 证据 |
|---|---|---|---|
| 终裁 | 窗口回 0.80（"缩半"仅指手柄） | `WINDOW_DEFAULT` 0.40→0.80，手柄缩半维持；断言改为验证 0.80 | probe "window default restored to 0.80" PASS ×2 |
| 1 | 环上清晰、上脸模糊 | 渲染链审计：无中间降采样链路、canvas 全程 DPR 分辨率 ✓；补 `imageSmoothingQuality='high'`；根本改善来自 #3 contain——上脸显示尺寸回到源图降采样区间（eye 341px 源 vs ~222 设备 px @dpr2）。**源分辨率为硬顶**（见 fix-03-done"需 4x 素材"）：`assets/2x/` 26 文件实测与 1x 同分辨率（430×188/310×540/341×149±1px，仅命名 @2x），盘上无更高分辨率源 | clarity-before-1x-oversize1.35.png vs clarity-after-contain-smoothing.png（同一组合 eye_03/nose_08/mouth_02、dpr3 同参对拍） |
| 2 | 竖屏嘴环永不可见 | 嘴环移左下侧翼（large 布局 dx -0.55→-1.05, dy 0.98→0.5）+ **每环独立选择焦点**（嘴环焦点改到左下弧 π·0.78，转盘数学全参数化）；夹紧改为按焦点点位（必在屏内快门区上方）；层序"环在人身后"未动 | probe "mouth dial focus on left flank — fx=56" + "selection-focus reachable" PASS ×2；ui-previews/01 左右侧翼可见嘴环件 |
| 3 | 落脸被放大看不全 | 默认取景改 **contain**：sprite 固定 = 默认 0.80 窗的 92%（oversize 1.35→0.74，第 17 轮裁定作废），器官完整入窗留呼吸边；机制②不变（拖大窗口露到画布边缘，不缩放贴纸）；落点动画终点同步 sprite 足印 | probe "contain framing" PASS；clarity-after 三件完整可辨 |
| 4 | 背景油画滤镜 | 与背景模糊合并为**油画化背景层**：96px 宽降采样 + 4 象限 Kuwahara（半径 2）+ 高质量放大；150ms 节流低频更新保帧率；人与三环各自图层保持清晰；玻璃折射同步折射油画背景 | ui-previews/01 背景涂抹质感；fallback fps 断言维持 |
| 稳定性 | boot 卡死（取证发现） | MediaPipe 模型 CDN 拉取 `ERR_ABORTED` 实录 → `loadModels` 失败重试一次 + App 侧 25s 硬超时强制 MODELS_FAIL（落 fallback 仍可玩，boot 永不冻结） | diag2 实录 + probe 全绿 |
| 旧包 | 玩家浏览器疑似吃到旧构建（第 20 轮截图 0.40 窗+大手柄） | vite dev server 响应头加 `Cache-Control: no-store`（配置变更 vite 自动重启生效），刷新即最新 | vite.config.ts |

## 修订 fix-04（gate-feedback-04 两条 + 素材升级验证）

取证：`docs/rebuild/evidence-build/fix-04/`（probe-fix04-log.txt =
历轮全量回归 + fix-04 新增断言，双视口全 PASS）。

| # | 反馈 | 处置 | 证据 |
|---|---|---|---|
| 1 | 油画背景像"画质不清晰的模糊"，重做 | 油画层 v2：内部分辨率 96→**300px 宽**（输出上采样 ≤1.7×，色块边界保持锐利）+ **SAT 积分图大核 Kuwahara**（半径 6，O(1)/象限，平坦颜料块）+ 色度提升 1.16 + 色块交界**深色勾勒线**（painted outline）；220ms 节流，实测单次 4.5–10ms，人与三环各层照片级清晰 | bg-before-lowres-kuwahara.png vs bg-after-large-kernel-painted.png + **bg-paint-canvas-direct.png**（滤镜层直出：平坦色块+利落边界，无失焦感）；probe "painterly pass within budget" PASS |
| 2 | 嘴环还是看不到（玩家第 25 轮定稿：位置不动，改前景层） | **fix-04b**：嘴环位置回 ref-02 下巴区、图层改**人像之前**（前景玻璃盘整环恒可见；鼻/眼维持人后）；前景玻璃折射合成"油画背景+清晰人像"；曾按初稿做过头顶方案，已回退。配套：选择焦点回前弧、特写大脸自适应加大盘径、修**环拾取度量 bug**（见下行）；断言改为"嘴环下巴区前景 + 人后两环存在可见弧段（48 点分割 mask 采样，极端特写鼻环豁免见 fix-04b-done）" | probe "mouth dial at the chin, focus low — fy=687/757" + "behind-person dials keep visible arcs" PASS ×2 视口；ui-previews/01（前景整环压在人像上） |
| bug | 顶弧拖拽被鼻环抢走（取证发现） | 环拾取的"最近环"比较原用圆形欧氏距离、与椭圆 hitTest 度量不一致——统一为压扁局部距离 | dragdbg 实录（drag kind:nose → 修后 mouth）+ probe 拖拽断言 PASS |
| 素材 | 玩家重导 2x（实为该 AI 文件真实最高分辨率） | `assets/parts/` 已换 682×297 / 859×375 / 619×1080（旧档备份 parts-1x-backup/）；同步 `public/parts/`；`loadParts` 按 naturalWidth 烘焙零改动吃到新分辨率（运行时实测 sprite canvas 682×298/619×1080/859×375）；dpr3 最坏场景进入 ≥1:1 区间，fix-03"需 4x"诉求就此闭环 | verify2x 实测 + clarity-after-2x-assets.png（对比 fix-03 前后图） |

## 修订 fix-05（gate-feedback-05 两条）

取证：`docs/rebuild/evidence-build/fix-05/`（probe-fix05-log.txt =
历轮全量回归 + fix-05 断言，双视口全 PASS；重影前后对比 + FPS 数字）。

| # | 反馈 | 处置 | 证据 |
|---|---|---|---|
| 1 | 嘴环下移到红圈标注位、别挡脸 | 嘴环改**帧锚定胸口带**：中心 (50%W, ≥83%H)、横向半径 42%W、squash 0.46、theta 0（横平椭圆），**顶弧不过下巴**（`max(0.83H, 下巴+r·sq+8)` 钳制）；维持前景层；选择焦点移到左下弧（0.75π）避开中央快门 | probe "mouth band at the red-circle spot — c=(195,701) r=164 / c=(253,747) r=213" + "top arc below the chin — top=625 chin=597 / 649 vs 637" PASS；ui-previews/01 |
| 2 | 动一下就有重影 + 要实测帧率 | 根因确认：油画层 220ms 快照含"画中人"，人动后残留旧位。修复 = **clean-plate**：每次快照仅吸收分割 mask 判为背景的像素（羽化低阈值=膨胀软边），人区保留历史背景像素，油画层从此永不含人；渲染/追踪 FPS 计数器上线（`engine.renderFps` / `vision.trackFps`） | **ghost-before.png vs ghost-after.png**（运动人像假摄像头 face-moving.y4m ±42px/1Hz：before 整脸叠影、after 人缘干净）；FPS 实录：headless-CPU 推理下 render 4-5 / track 4-5 fps（推理占满 CPU 所致），无推理 fallback 渲染 60fps（fix-02 取证），真机 GPU delegate 数值归 Harden 实测 |
| bug | 底部触控带失灵（取证发现） | 快门容器为全宽 div 拦截了底部整条 pointer 带（嘴带下移后暴露）——容器 `pointer-events-none`、按钮恢复 `auto` | probe 拖拽断言由 FAIL 转 PASS |

已知残留（如实记录）：clean-plate 以首帧播种（含人一次），人移动后
被真实背景逐步治愈；从未露出过的背景区保留播种内容（经油画平坦化，
非叠影观感）。

## 修订 fix-06（gate-feedback-06 + 玩家自备背景更新）

取证：`docs/rebuild/evidence-build/fix-06/`（probe-fix06-log.txt =
历轮全量回归 + fix-06 断言，双视口全 PASS；hair-edge-closeup.png）。

- **摄像头背景整体废弃**：层序定稿为**固定油画背景 → 玻璃环（鼻/眼
  人后、嘴前景）→ 分割人像 → 窗口 → HUD**。重影从根上消失（背景
  不再来自摄像头）。
- **背景素材**：玩家自备 `assets/background.webp`（514×800 WebP，
  Rothko 式色域画）——原候选生成任务按玩家更新取消（已产出未使用
  的 2 张生成图记录在案：salon `…acj_33ed…jpeg`、texture
  `…acj_9d90…jpeg`，另 2 任务弃置未取件；不进产物）。持久化 =
  **本地打包** `public/bg/background.webp`（同源，快照卡 canvas 不被
  跨域污染；符合"durable/本地打包"规范）。
- **处理**：cover 裁切铺满视口 + 静态细颗粒 overlay（160px 噪声瓦片、
  alpha 0.10，遮上采样与 WebP 色带，不闪烁）；玻璃折射同步改折射
  油画。
- **管线下线**：clean-plate / Kuwahara / 300px 快照 / mask 小图全部
  移除（`paintPass`、`drawBlurredBackdrop`、plate 缓冲、220ms tick）。
- **性能回收（前后帧耗）**：下线管线的已计量成本 = 每 220ms tick
  4.5–13ms 纯像素工作（fix-04/05 取证）+ 两次 getImageData——现全为
  0（背景 = 一次 drawImage + pattern fill）；headless 软光栅下
  drawScene EMA 53–61ms（各构建同量级，环/人像光栅化为主，非本轮
  指标），headless CPU 推理下 render/track 由 4-5fps 升至 **6/6fps**；
  无推理 fallback 渲染维持 60fps。真机 GPU 数值归 Harden
  （`engine.frameMs` 计数器已内置）。
- **发丝边融合（橙底）**：mask 渐变带收紧（0.35-0.65→0.45-0.75，
  减少相机原背景色渗边）；`hair-edge-closeup.png`（dpr3）如实记录
  残留：发丝外缘有细灰色渗边 + 256px mask 上采样的轻微阶梯——
  分割模型分辨率所限，进一步 matting 归 Harden。
- 顺带：`drawFallbackBase`（渐变+网格）随层序移除——无相机模式同用
  油画底 + 抽象 sitter，全模式视觉统一。
- **fix-06b 背景终稿**：玩家重画 `assets/background.png`（1290×2293、
  晨光渐变自带油画肌理、原创）替换 Rothko 旧图；打包压 900 宽 q88
  WebP（578KB）同路径落 `public/bg/background.webp`（代码引用唯一，
  无旧 jpg/webp 残留）；程序颗粒层因肌理重复移除；浅色底发丝边
  重拍（`hair-edge-closeup-06b-light-ground.png`：渗边几乎不可见，
  余 mask 轻阶梯）；probe 复跑全 PASS（可见弧断言加双采样抗抖动）。

## 修订 fix-07（gate-feedback-07 两条）

取证：`docs/rebuild/evidence-build/fix-07/`（probe-fix07-log.txt =
历轮全量回归 + fix-07 断言，双视口全 PASS）。

| # | 反馈 | 处置 | 证据 |
|---|---|---|---|
| 1 | bar 移到顶部，别压到 waku | 侧栏改**顶部横向玻璃药丸栏**（`TopBar.tsx`，SAT 改横拖）；位置**参数化**对齐 Waku Zone 规则：`--surgery-topbar-inset = safe-top(max(env, --sys-top, --gallery-safe-area-top)) + --surgery-top-chrome(56px) + gap(10px)`（结构 Build 落、数值 Harden 按平台壳 `--waku-*` 校准）；环几何顶/底保留带参数化 `LAYOUT_RESERVE {top:120, bottom:132}`（选择焦点必在顶栏带以下、快门区以上）；容器 pointer-events-none 不吞触控 | probe "topbar placed below Waku chrome band — top=66" + "clear of the mouth band — bar bottom=116 vs band top=625/649" PASS ×2；ui-previews/01 |
| 2 | 调节手势与转盘冲突 | 命中**硬排序**落死：四角手柄（全窗口最近角）> 窗口框体（含 8px 外扩，最小框优先）> 环带；新增**排他边距**——任一手柄 `hitPx(26)+10px` 范围内指针永不落环（死区防误抢）。手势清单本身未变（contract 输入映射 7 条） | probe 三连断言 PASS ×2：重叠角拿 scale-handle（窗口被推到环带上仍拿手柄）/ 死区不落环 / 远离窗口环正常起拖 |

## 修订 fix-08（小单：顶栏居中）

顶栏相对 9:16 演出区左偏 15.1px（双视口一致）——根因 =
`pointer-events-auto` inline span 包装层的 flex 宽度解析；去包装层
（属性移到 `#topbar` 根节点）+ 内距收紧后 **offset=0.0px**（顶栏
中心 === 演出区中心，与窗口无关）。光学配重判定可接受（对称重排
方案备选待玩家表态）。取证：`evidence-build/fix-08/`
双视口截图 + 前后偏移量化；probe-fix07 全量回归 0 失败。
详见 `fix-08-done.md`。

## 修订 fix-09（换皮：窗口白框样式）

窗口框视觉换玩家 `assets/frame.svg` 样式（细线矩形 + 四角 45° 对角
粗斜标穿越角点）——按 SVG 几何参数化 canvas 重绘（3/10/50.58 每
717 参考比 + 最小值下限 1.2/3/7px），旧 L 角标 + 方块手柄移除；
去堆叠/呼吸/暗晕保留；**命中层零改动**（fix-07 排序与尺寸原样）。
取证：ui-previews/01–03 刷新 + probe-fix07 全量回归 0 失败。
详见 `fix-09-done.md`。

## 修订 fix-10（窗口框纯白 + 顶栏白磨砂）

①窗口框线+角标去暗晕（仅 `drawBracket`；环棱线/落影等其余阴影
不动）；②顶栏灰玻璃→白色半透明磨砂（bg-white/65 + blur），图标与
SAT 轨道/文字翻深色保对比。取证：ui-previews/01–03 刷新 +
probe-fix07 回归 0 失败。详见 `fix-10-done.md`。

## 修订 fix-11（顶栏 50% 透明 + 窗口框细一半）

①顶栏 `bg-white/65→/50`；②窗口框 `FRAME_SCALE=0.5`（线宽/角标
长宽/最小下限同步减半，frame.svg 比例保持，命中区不动）。取证：
ui-previews/01–03 刷新 + probe-fix07 回归 0 失败。详见
`fix-11-done.md`。

## 修订 fix-12（顶栏元素全白化）

顶栏图标/SAT 标签/轨道/滑钮/百分比全部改白 + 柔和小半径深色投影
兜底（非黑晕）；激活态改白亮片（bg-white/35）保状态可辨。取证：
ui-previews/01–03 刷新 + probe-fix07 回归 0 失败。详见
`fix-12-done.md`。

## 修订 fix-13（顶栏文字可读性）

仅文字：SAT/百分比 text-shadow 加深一档（0.45/3px）+ 字重字号
上调一档（8px bold / 10px semibold、纯白）；图标与白气质不动。
几何复验无溢出、居中 0 偏移；probe-fix07 回归 0 失败。详见
`fix-13-done.md`。

## 给 Harden 的注记

- 文案集中：`src/content.ts`（STR / CREDITS / AUDIO / SFX_DURATIONS），
  canvas 文字同源。
- safe 层容器：侧栏 `#sidebar`（App 内 left-4 top-1/2 容器）、快门
  `#shutter`（bottom env inset）、结果层 `#result-overlay`；full-bleed
  层 = `stageRef` div 内 engine canvas。
- 状态机探针：`#app-root[data-stage]`；运行时句柄 `window.__surgery`
  （engine/vision）。
- 手感参数：`src/engine/stage.ts` `TUNING`；环几何 `facefit.ts`
  `RING_LAYOUT` + `rings.ts` `TILT/TUBE_R/FADE_*`。
- 测试命令：`npm test`（node:test，19 用例）；`npm run lint`；
  E2E 复跑：`node docs/rebuild/evidence-build/probe.mjs`
  （需 `npm i playwright --no-save` 与本地 8891 dev server；假摄像头
  正脸源可用 `docs/rebuild/evidence-build/` 同法重生成，portrait
  durable URL：`…acj_00803066b92e40378713de748ddc77d3/….jpeg`）。
