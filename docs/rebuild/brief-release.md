# brief-release — Surgery

- **状态：已上 Playground + 已正式发布 Feed + fix-14 维护重传完成，交付完成。** Surgery
  （名画五官换脸镜子玩具）经 Release 先上 Playground；玩家第 42 轮真机确认后 `waku publish`
  正式发布 + `waku cover set` 封面。随后 Build 修订 fix-14（壳内快门 tainted-canvas
  不出卡），本线程重验 + 重传：`waku push` 新 Playground + `waku publish --project-id`
  刷新 Feed 版本（content_id 不变、非重复卡；封面不动），`publication_status: published`、
  新版 succeeded/is_current。
- **Feed URL（fix-14 当前版）**：`https://storage.googleapis.com/waku-core-aicap-dev/sites/b085697a-e5c1-5277-a6f0-63f4931ef930/20260723T090516352941/index.html`
  （content_id `cnt_59ff337c85c24d4a92f3b29344cb7a98`；deployment `dep_8d6a0fbc…` is_current；
  封面 `uas_c7635a2f…` prod 生效）
- **Playground URL（fix-14 当前版）**：`https://storage.googleapis.com/waku-core-aicap-dev/content-reviews/rvi_9e4226b9c1c5485f86dda7c245a86fd0/main/ba994b72-254965f02787/index.html`
- **过程**：首轮 Preflight 判定产物 ship-ready（lint 0 / test 22-22 / build 出
  dist@root / 凭据 0 命中 / 资产全 200），但唯一合规上传路径缺失——`waku push` 强制
  git+GitHub origin，而本项目非 git 仓；写了 handback。**玩家第 41 轮裁定选项 1**：
  授权 git + `waku push`。
- **续跑动作**：①打包补 `metadata.json`（相机权限）进 dist（33 文件）；②项目内
  git init + 在玩家账号 `balabalabalaja` 建私仓 `0722_waku_surgery` 并 push（HEAD
  `1e3485f`）；③`waku push ./dist --source-dir . --name "SURGERY"` 一次成功
  （`kind: review` = Playground，非 Feed）。
- **实证**：线上 33 资产全 200；`index.html`/`metadata.json` 与本地 dist sha256
  逐位全等；相机权限声明线上在位；全相对引用可在新 base 渲染。未重跑第三遍浏览器
  （字节与验讫构建同一，playability 继承）。
- **入库**：Muse Library 一字节未动（玩家自理归档，核验库内无 surgery 条目）。
- **留痕缺口（非阻断）**：MediaPipe/字体 CDN 自托管、zh 译名、手势规二（玩家仲裁
  零提示）、模板仓 SOP 对齐——均按派工书保持现状/留后续。
- **维护**：改码→build→push GitHub→重跑 `waku push` 得新 Playground URL；Feed
  republish = 同名 `waku publish`（必带全量 `--name`/`--description`）新增不可变版本 +
  原子切指针；回滚 `waku rollback "SURGERY" --to dep_816fe28d… --yes`。Muse Library 归档
  仍由玩家自理。
