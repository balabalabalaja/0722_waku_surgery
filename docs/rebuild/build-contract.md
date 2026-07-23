# build-contract — Surgery（art-history face collage）

date: 2026-07-22
thread: waku-build（无人模式，dispatch-build.md 派工）
本管线端口：**8891**

## 方向引用（原样，不改写）

> Open your camera and three dials of masterpiece eyes, noses and mouths
> orbit your head — spin them to remix your face into a living collage of
> art history, pinch the white brackets to size each part, then snap a
> polaroid card with the painting credits.

核心乐趣：主线 D·创造表达（8 嘴 × 8 鼻 × 10 眼 = 640 种组合的搭配装扮）；
支线 G·情绪体验（实时镜像里的名画反差喜剧）。
命名注记生效：Surgery 仅为项目名，产品零手术/医疗语义。

## 平台四层选择

| 层 | 选择 | 理由 |
|---|---|---|
| Runtime | Web | 默认 |
| UI Layer | React 19 | 源项目即 React 19 + Vite + TS，复用其 MediaPipe 管线与侧栏组件；结果页/侧栏多状态 |
| Render | Canvas 2D | 实时视频合成 + 环带绘制 + 贴脸合成 + 快照卡离屏合成，DOM 做不了 |
| Packaging | multi-file（沿用源项目 `src/` 骨架） | 默认；在源项目上改造 |

媒介结构基线照单执行：`viewport-fit=cover`、根容器 `100dvh` 铺满、
无页面滚动、无 letterbox / 手机壳 max-width、不硬锁比例（9:16 竖屏为
设计目标态，布局全部按 viewport 百分比 + flex，safe 层与 full-bleed
层分离）。触摸为主输入，鼠标仅作调试等价通道。

## 首屏到收束流程

1. **进入（boot）**：黑底 + 白细线极简 spinner + 一行小号等宽字加载语
   （英文，无医疗词）。后台并行：请求前置相机、加载 MediaPipe
   FaceLandmarker + HandLandmarker。BGM（画廊底噪）在首屏就绪即尝试
   开播，被拦截则挂 once 手势重试。
2. **相机亮起（ready）**：镜像实时画面铺满全屏。三个素材环以默认
   屏幕位（按 ref-02-layout 相对几何）缓慢 idle 旋转，当前选中件微微
   发亮。左侧玻璃药丸侧栏、底部白色圆形快门键就位。无任何文字教学。
3. **检测到脸（active，首赏）**：自动贴上一整套随机名画五官——素材从
   各自环上飞落到脸上（短动画 + 轻"嗒"声）。环锚定切换为跟脸走
   （蓝环鼻盘绕头部左上、绿环眼盘绕右脸颊、红环嘴盘绕下巴）。
   眼睛只贴画面右侧一只（单只右眼素材，不镜像成对）。
4. **玩（active 循环）**：拨环换件（触屏拖转 / 掌心拨转双通道）→
   咔哒 + 新件飞落；拖白框四角手柄调大小、拖框体调位置；侧栏随机
   一套 / 素颜对比 / HUD 显隐 / 重置 / 饱和度。零计时零催促。
5. **快门（resolve）**：按底部快门 → 当前帧定格 → 全屏闪白 +
   快门声 → 离屏合成拍立得卡。
6. **收束（result）**：拍立得卡从下方滑出（定格新脸 + 底部英文
   credits 三行 + 小号等宽 SURGERY 字标）。按钮：Save（存图）、
   Share（评论区）、再来一张（回 active，保留当前组合）。

## 状态机总表

| 状态 | 进入条件 | 出口 |
|---|---|---|
| boot | 页面加载 | 相机+模型就绪 → ready；相机拒绝/模型加载失败 → fallback-active |
| ready | 相机亮起、未检测到脸 | 检测到脸 → active（自动贴整套）；>6s 无脸 → 环仍可玩（固定锚点，等价 fallback 交互），检测到脸随时升级 active |
| active | 检测到脸（或从 result 返回） | 按快门 → resolve；脸丢失 >2s → 环缓动回默认屏幕位（保持可玩），脸回来 → 重新跟脸 |
| fallback-active | 相机拒绝 / MediaPipe CDN 失败 | 程序化画布背景 + 固定脸锚点，触屏通道全功能可玩，快门照常 → resolve（卡面用程序化背景 + 贴件）。**每个交互路径不因无相机断裂** |
| resolve | 快门按下 | 合成完成 → result（合成为同步 canvas 操作，无失败分支；意外异常则回 active 并轻震提示） |
| result | 卡片滑出 | 再来一张 → active；Save/Share 停留在 result |

AI 不可用分支：不存在（内容内 AI 不用，MediaPipe 失败已并入 fallback）。

## 输入映射（逐条附引导判定）

| 手势 | 动作 | 反馈 | 引导判定 |
|---|---|---|---|
| 环带上横向拖转（触屏） | 该盘旋转，过步进点换件 | 咔哒 SFX + 选中件高亮 + 新件飞落脸上 | 环已 idle 旋转 + 选中件发亮（自明 affordance）；触碰必有响应 → **不引导** |
| 掌心靠近环区横向滑动（镜头内手掌） | 同上（HandLandmarker 供数据） | 同上 + 手部折线线框可见 | 触屏同权通道兜底，卡不住、错过不可逆均否 → **不引导** |
| 拖白框四角小方块手柄 | 等比缩放该部位 | 手柄亮起呼吸（触碰框体即亮） | affordance 自明（呼吸手柄）→ **不引导** |
| 拖白框框体 | 平移该部位贴合偏移 | 框随手指移动 | 同上 → **不引导** |
| tap 快门 | 定格出卡 | 闪白 + 快门声 | 通用相机语义自明 → **不引导** |
| tap/拖 侧栏 5 控件 | HUD 显隐 / 素颜对比 / 随机整套 / 重置 / 饱和度 | 图标态切换 + 即时画面变化 | 图标按钮自明 → **不引导** |
| result 页三按钮 | 存图 / 分享 / 再来 | 标准按钮 | 文字按钮 → **禁止引导** |

输入隔离：result 为全屏覆盖层，拦截全部 pointer；侧栏与快门
`stopPropagation`，不透传给环旋转层；环命中区按"距环带中心线半径 ±
带宽"判定，框手柄命中优先于环（更靠屏幕中心）。

## 结果资产实现方式（结果页三问）

- 有明确目标结果？**有**——生成物（拍立得快照卡）→ 做结果页。
- 有社交货币？**有**——玩家自创的名画换脸卡 → 加"分享到评论区"
  （`pv.app.composeComment`，Waku 环境外降级为仅 Save）。
- 有竞技性？**无** → 不加排行榜。

施工：全屏 result 层，拍立得卡为视觉主角（占屏 ~70%），按钮退居底部。
卡面 = 离屏 canvas 合成：定格帧（镜像相机帧 + 已贴部件，**不含**
HUD/环/侧栏/快门）+ 拍立得白宽边 + 底部三行英文 credits
（`Eye: … / Nose: … / Mouth: …`，画作名 — 画家）+ 小号等宽 SURGERY
字标。素颜态（无任何部件）按快门 → credits 区写 `Bare canvas — you`。
Save：`canvas.toBlob` 下载（Waku 环境用图片查看器/相册通道，produce
期按 runtime 能力接）。CORS 安全：卡面只画 getUserMedia 视频帧 +
同源本地 parts + 代码装饰，可安全 `toDataURL`；远程音频不进 canvas。

## 环渲染契约（玩家材质定案：玻璃盘，覆盖此前油画盘探索）

玩家亲选最终规格（create-brief 视觉风格节，覆盖"油画盘 + 重投影"
两条已废弃指令）：

1. **细管径玻璃甜甜圈**：管径细、轮廓利落，边缘有**锐利高光棱线**
   （细线亮边，非大面积柔光）。
2. **玻璃/树脂质感**：半透明，透出并轻微折射背后的摄像头画面
   （实现：环管区域内把底图轻微放大重绘 + 白色薄纱层），素材像嵌在
   玻璃介质里。
3. **3D 倾斜 + 前后遮挡**：环在 3D 空间倾斜（椭圆投影，每环有独立
   倾角/压扁率）；**顶环（鼻盘）穿到头后被头部遮挡**（实现：视频帧
   头部区域羽化椭圆采样作遮挡贴片，插在环体与前景素材之间）。
   立体感靠高光 + 遮挡；**投影适中**（柔和椭圆落影，"更 sharp 投影"
   指令随油画盘方案一并作废）。
4. **每环同屏素材露出 2-4 个**：素材只在环前弧显示（按 3D 深度
   渐隐渐显 + 近大远小），玻璃面占主导、留呼吸，不整圈挤满。
5. **油画感只保留在素材间融接过渡**：相邻可见素材间沿环路径插值
   涂抹过渡拷贝（mockup-preview.html pass 1 工艺：预模糊 + 色相
   扰动 + 沿切向拉长笔触），环体本身是玻璃不是油画。
- 性能结构：每素材的模糊拷贝**预渲染**（一次性），运行时零 filter；
  玻璃管/高光/落影为轻量矢量椭圆弧描绘；遮挡贴片复用单一离屏
  canvas。目标常帧 ≥30fps（与 MediaPipe 推理共存）。
- 选中位在环**前弧中心**（最靠观者处），选中件发亮脉冲。

## 资产 manifest

| type | filename / 来源 | 用途 | 生成或降级方式 |
|---|---|---|---|
| sprite ×26 | `assets/parts/{mouth,nose,eye}_*.png` | 环上素材 + 贴脸部件 | **已就位**，椭圆羽化裁切在代码内做 |
| texture | 程序化 | 环带油画纹理 / 画布颗粒 | 代码生成（噪声 + 切向涂抹），不出图 |
| bg | 程序化 | fallback 无相机背景（径向渐变 + 网格 + 白线抽象脸，继承源项目模拟器语言） | 代码生成 |
| card frame | 程序化 | 拍立得卡白边 + 阴影 | 代码绘制；文字归代码文本层（图内无文字规则天然满足） |
| credits 文案 | 手写 | 26 素材 × 画作出处英文小注 | Build 逐图目验辨认名画出处，辨认不确定的用风格化描述句，逐条记入 build-report |
| cover | — | 封面 | **归 Release，不在本轮** |

无静默砍位：26 素材全部上环；WHOLE.png 仅作参照，不进运行时。

## 音频清单（全部走 waku MCP 生成 → durable URL）

| 条目 | 工具 | 时长 | 用途 |
|---|---|---|---|
| bgm_gallery | generate_music_asset | ~60s loop | 极轻古典弦乐 + 美术馆房间底噪，开屏即播，单 controller ≤1 轨 |
| sfx_click | generate_sfx_asset | 0.3s | 转盘过步进点咔哒 |
| sfx_land | generate_sfx_asset | 0.35s | 素材落脸轻"嗒" |
| sfx_shutter | generate_sfx_asset | 0.5s | 快门 |
| sfx_slide | generate_sfx_asset | 0.6s | 拍立得卡滑出 |

SFX 一律显式传 duration 截断（audio-rules 口径）；无医疗音效。
生成失败重试一次，仍失败降级：对应交互静音 + 记录 build-report。

## 内容内 AI 行为

不用（brief 明确）。无玩家触发点、无模型、无离线 fallback 需求。

## Waku 融合（玩家注记"用 waku cli 融一下"）

produce 期按 waku playable 契约接入：runtime.js 加载契约、manifest
capabilities（相机权限声明）、`pv.app.composeComment` 分享通道；
在非 Waku 环境（本地 8891 直开）全部能力探测降级、核心闭环不依赖。
Playground 上传 / publish / Feed 发布归 Release，不在本轮。

## fix-01 蓝图修订（gate-feedback-01 + 玩家机制澄清/硬规，2026-07-22 晚）

- **9:16 帧**：`#stage-frame` = `min(100vw, 100dvh×9/16)` 居中 pillarbox；
  手机竖屏（窄于 9:16）保持满屏；全部 chrome 归帧内。
- **层序（机制①）**：房间背景 → 三玻璃环 → 人（MediaPipe selfie
  segmentation 人像分割贴层；分割不可用降级为羽化头/躯干剪影）。
- **窗口（机制②）**：白框 = 开在脸上的矩形取景窗；素材以 landmark
  为锚定、按 `WINDOW_STYLE.oversize` 超采尺寸衬在脸后；拖角 = 改窗口
  裁切范围，拖框体 = 移窗口；框线/手柄高对比（白线 + 深色晕）。
- **玻璃 v2**：离屏 shadow trick 出净投影（无灰烟描边）、全环利落
  双缘线 + 前弧亮棱线/glint、管内背景放大折射 + 纵向 sheen；素材
  全环可见（背弧调暗缩小、前弧主导），保"完整圆盘"读感。
- **环构图**：默认 ref-03 大盘背景式（`RING_COMPOSITION.mode='large'`，
  可切 compact），前弧焦点保证在屏内快门区之上。
- **灵敏度**：全窗口最近角命中路由、子步进推进（`nudge*`）、SPIN 1.1、
  更硬 snap 弹簧、命中带宽 0.95。
- UI 变体（默认值 + 待玩家裁定截图）见 `docs/rebuild/ui-previews/`
  与 `fix-01-done.md`。

## 未解决问题（produce/verify 收口结果见 build-report）

1. ~~26 素材出处辨认~~——已逐图目验并落 `src/content.ts`，为最佳
   努力辨认（置信度分级记入 build-report），玩家可随时改文案。
2. 手掌拨转手感阈值——参数已集中在 `src/engine/stage.ts` 的
   `TUNING`；headless 无法实测真手，真机校准归 Harden。
3. MediaPipe wasm/model 走 CDN（沿源项目）——保持现状并记入
   build-report；是否本地化归 Harden/Release 决策。
4. iOS Safari `100dvh` 与相机纵横比裁切实机表现——结构按基线做对，
   数值校准归 Harden。
