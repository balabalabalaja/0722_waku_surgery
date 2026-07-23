# dispatch-harden — Surgery（conductor 派工书）

- 项目文件夹（绝对路径）：`/Users/balaja/waku-projects/0722_waku_surgery`
- 本阶段 skill：`waku-harden`——用 Skill 工具调用；不可用则读
  `~/wakuPGCSkill/waku-Harden/SKILL.md` 照做（再不可用读
  `~/.claude/skills/waku-harden/SKILL.md`）。
- **无人模式**：全程不向用户回询；拿不准的事项写进报告"pending
  items"段。

## 启动白名单（waku-harden SKILL.md 所列，逐条照抄）

- `docs/rebuild/create-brief.md`
- `docs/rebuild/build-contract.md`
- `docs/rebuild/build-report.md`
- 产物目录（src/、dist/、public/、assets/ 等）
- `waku-Harden/` 自身文件（skill 自带 stages/ 与 reference/）

不读 Create / Build 的对话历史。

## 本管线专属本地端口

**8891**——dev server / probe / bootstrap origin 全部用它（Build 的
dev server 已关停，端口已让出）。

## 阶段要点（照 skill 流程，此处仅提示）

- 壳体移植（vanilla 产物 → 平台 initial repo）与工具链门禁为本线程
  第 0 步专属职责；产物当前为 vanilla 状态属正常交接态。
- 玩家已知关注点（build-report 注记已列）：中文/字体、安全区数值
  按平台壳 `--waku-*` 校准（顶栏 inset 已参数化）、真机 GPU 性能、
  发丝 matting（256px mask 阶梯）、credits 文案核对。
- UI 为玩家第一验收维度：硬化改动不得回退 Build 已定稿的视觉
  （fix-01…fix-13 全部裁定见 build-report 修订段）。

## 退回协议（原文）

> 子 agent 需要退回时，写 `docs/rebuild/handback.md`：
> `target:`（create/refit/build）、`reason:` 一句话、`evidence:` 证据，
> 然后结束，不得自行修改方向或产物。

## 结束要求

- 输出握手物全部落盘（**落盘即完成信号**）：
  1. `docs/rebuild/hardening-report.md`
  2. `docs/rebuild/review-report.md`
  3. `docs/rebuild/smoke-report.md`（无未闭合阻断项）
- 另写一段简报到 `docs/rebuild/brief-harden.md`（5-10 行：做了什么、
  怎么验、pending items）。
