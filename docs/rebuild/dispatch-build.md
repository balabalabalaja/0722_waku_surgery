# dispatch-build — Surgery（conductor 派工书）

- 项目文件夹（绝对路径）：`/Users/balaja/waku-projects/0722_waku_surgery`
- 本阶段 skill：`waku-build`——用 Skill 工具调用；Skill 工具不可用时
  读 `~/wakuPGCSkill/waku-Build/SKILL.md` 照做（再不可用则读
  `~/.claude/skills/waku-build/SKILL.md`）。
- **无人模式**：全程不向用户回询；实现细节自决，brief 缺字段选最贴
  方向的默认值补上并记入 build-report。

## 启动白名单（waku-build SKILL.md 所列，逐条照抄）

- `docs/rebuild/create-brief.md`
- （修订模式）`docs/rebuild/refit-brief.md`（本次无）
- `waku-Build/` 自身文件（即 skill 自带 stages/ 与 reference/）
- 产物目录

不读 Create / Refit 的对话历史，不读 Harden / Release 的产物。
（brief 的"给下游的注记"指向的素材路径 `assets/parts/`、
`assets/WHOLE.png`、`docs/rebuild/ref-02-layout.png` 及已拷入的源项目
代码属于产物目录/输入素材，可读可用。）

## 本管线专属本地端口

**8891**——dev server / probe / bootstrap origin 全部用它，
不得使用其他端口（并行管线取证互踩防线）。

## 退回协议（原文）

> 子 agent 需要退回时，写 `docs/rebuild/handback.md`：
> `target:`（create/refit/build）、`reason:` 一句话、`evidence:` 证据，
> 然后结束，不得自行修改方向或产物。

## 结束要求

- 输出握手物全部落盘（**落盘即完成信号**）：
  1. `docs/rebuild/build-contract.md`
  2. `docs/rebuild/build-report.md`——必须含**真实运行证据段**
     （测试输出 / 取证命令结果，非自称）
  3. 可运行产物目录
- 另把一段简报写到 `docs/rebuild/brief-build.md`（给 conductor 与玩家
  看的 5-10 行：做了什么、怎么跑、已知问题）。
