# fix-05-done

**fix-05 完成**：①嘴环按红圈标注移到**胸口锁骨带**——帧锚定中心
(50%W, ≥83%H)、横向半径 42%W、扁平横椭圆（squash 0.46 / theta 0），
顶弧钳制不过下巴，维持前景层，选择焦点移到左下弧避开快门；②运动
重影根修——**clean-plate**：油画背景层每次快照只吸收分割 mask 判为
背景的像素、人区保留历史背景，画中人从此不进油画层；渲染/追踪 FPS
计数器上线并入取证。顺带修复取证发现的真 bug：全宽快门容器拦截
底部整条触控带（容器 pointer-events-none）。

取证指针：

- 逐条处置表：`build-report.md` "修订 fix-05" 段
- 断言：`evidence-build/fix-05/probe-fix05-log.txt`（历轮全量回归 +
  fix-05 新增，双视口 390×844 / 1440×900 全 PASS，0 失败）
- **重影前后对比**（运动人像假摄像头 `face-moving.y4m`，±42px/1Hz
  横摆）：`ghost-before.png`（整张旧位人脸叠影）vs `ghost-after.png`
  （人像边缘干净；已知残留：plate 首帧播种区经油画平坦化、随背景
  露出逐步治愈，非叠影观感）
- **实测 FPS**（页面内计数器，追踪/渲染分开）：headless CPU 推理下
  render 4-5 fps / track 4-5 fps（XNNPACK CPU 推理占满所致）；无推理
  fallback 渲染 60 fps（fix-02 取证）；真机 GPU delegate 数值归
  Harden 实机盘（计数器已内置：`engine.renderFps` /
  `vision.trackFps`，随时可读）
- 嘴环新位形：`ui-previews/01-opening-dressed.png`（胸口横带 +
  锁骨位选中件，顶弧在下巴之下）
- 机器底线：tsc + 19 单测 + 生产构建全绿；dev server tmux
  `surgery-preview`:8891
