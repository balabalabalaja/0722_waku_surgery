# dispatch-release — Surgery（conductor 派工书）

- 项目文件夹（绝对路径）：`/Users/balaja/waku-projects/0722_waku_surgery`
- 本阶段 skill：`waku-release`——用 Skill 工具调用；不可用则读
  `~/wakuPGCSkill/waku-Release/SKILL.md` 照做（再不可用读
  `~/.claude/skills/waku-release/SKILL.md`）。
- **无人模式**：唯一允许回询的点 = `waku login` 需浏览器授权时；
  其余自决或记 blocker。

## 启动白名单（waku-release SKILL.md 所列，逐条照抄）

- `docs/rebuild/create-brief.md`
- `docs/rebuild/build-report.md`
- `docs/rebuild/hardening-report.md`
- `docs/rebuild/review-report.md`
- `docs/rebuild/smoke-report.md`
- 可发布产物目录（dist/ 及其源 src/、public/、assets/）
- `waku-Release/` 自身文件
- Muse Library 仓 git 状态（仅 Archive 步涉及，见下方专项指令）

不读上游线程对话历史。

## 本管线专属本地端口

**8891**——本地校验起服一律用它。

## 发布范围（本次硬边界）

- **只做 Playground 上传，不做 Feed publish**——Feed 发布等玩家
  末端确认后另行执行（玩家历史惯例）。
- 壳体：产物为 vanilla-at-root（模板私仓 404，见 hardening-report），
  按同管线已上线先例 `0722_waku_pivoting-circles` 处理
  （`waku push ./dist` 路线）；若本账号已获模板仓权限可按最新
  SOP 对齐，不强求。
- **Archive 步专项指令**：本项目按玩家显式指定位于
  `~/waku-projects/0722_waku_surgery`（不在 Muse Library 库根内），
  且玩家习惯自行批量提交 git——**跳过 Muse Library git push**，
  在 release-report 入库记录段如实注明"项目位于玩家指定路径、
  归档由玩家自理"即可，不执行任何 git 写操作。
- Harden pending 项的 Release 决策权：MediaPipe/Google Fonts CDN
  自托管（可选，不强求；失败已有兜底）、zh 画作译名（保持现状，
  玩家可后改）。手势零提示为玩家仲裁定案，不得加提示。

## 退回协议（原文）

> 子 agent 需要退回时，写 `docs/rebuild/handback.md`：
> `target:`（create/refit/build）、`reason:` 一句话、`evidence:` 证据，
> 然后结束，不得自行修改方向或产物。
> （Release 语境：产物层问题退 Harden（验证）或 Build（实现），
> 本线程绝不改产物代码。）

## 结束要求

- 输出握手物全部落盘（**落盘即完成信号**）：
  1. `docs/rebuild/release-report.md`——含 Playground URL、上传成功
     实证（命令输出/回执）、入库记录段
  2. `docs/rebuild/release-checklist.md`——无未勾项
- 另写一段简报到 `docs/rebuild/brief-release.md`（5-10 行）。
- 凭据纪律：任何 token/key 不进页面、仓库、日志、报告。
