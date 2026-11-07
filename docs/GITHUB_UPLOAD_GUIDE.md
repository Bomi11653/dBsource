# 如何把本交接包安全上传到 GitHub（Windows PowerShell）

**目标**：先把文档独立上传，再另外处理本地/ECS 的最新业务源码，避免旧 GitHub 版本覆盖线上。

## 0. 包内结构

解压后可得到 `AGENTS.md`、`docs/*.md`、`scripts/ops/`、`templates/reusable/`。这些都是**新增文件**，不会覆盖现有 `README.md`、历史部署脚本、业务代码和环境变量。

## 1. 安全检查

```powershell
cd D:\dbsource\dbsource-audio-site
git status -sb
git log -1 --oneline
git remote -v
git fetch origin
git log -1 --oneline origin/main
```

如果工作区有未提交业务文件，不要 `git add .`；尤其不要 `git reset --hard` 或 `git pull` 强行冲突。

## 2. 推荐：建立一个不夹带本地业务代码的独立文档工作区

在本地项目根目录执行：

```powershell
cd D:\dbsource\dbsource-audio-site
git fetch origin
git worktree add -b docs/project-handover-20261107 D:\dbsource\dbsource-handover-worktree origin/main
```

把本 ZIP **内部文件夹内容**复制到 `D:\dbsource\dbsource-handover-worktree\` 根目录。必须得到：

```text
D:\dbsource\dbsource-handover-worktree\AGENTS.md
D:\dbsource\dbsource-handover-worktree\docs\PROJECT_HANDOVER_2026-11-07.md
D:\dbsource\dbsource-handover-worktree\scripts\ops\read-only-diagnostics.sh
D:\dbsource\dbsource-handover-worktree\templates\reusable\cms-client.mjs
```

提交（显式路径、不要 `git add .`）：

```powershell
cd D:\dbsource\dbsource-handover-worktree
git status --short
git add START_HERE.md AGENTS.md docs/ENV_AND_BACKUP.md docs/PROJECT_HANDOVER_2026-11-07.md docs/ARCHITECTURE_AND_FEATURES.md docs/INCIDENT_REGISTER.md docs/OPERATIONS_RUNBOOK.md docs/RELEASE_CHECKLIST.md docs/CHAT_ARCHIVE_SUMMARY.md docs/GITHUB_UPLOAD_GUIDE.md docs/REUSABLE_ENGINEERING_BLUEPRINT.md docs/CHANGELOG_OPERATIONS.md scripts/ops/read-only-diagnostics.sh templates/reusable
git diff --cached --stat
git diff --cached --check
git commit -m "docs: add complete project handover and agent knowledge base"
git push -u origin docs/project-handover-20261107
```

然后在 GitHub 打开一个 PR：`docs/project-handover-20261107 → main`。**合并文档 PR 不会同步本地/ECS 业务代码**；后续仍需版本对账。PR 审核时确认无密钥、历史截图、个人隐私或生产数据泄露。

## 3. 如果想先存档，不想建 PR

也可将本 ZIP 私下备份到本地和安全网盘，确认文件完整后，再上传 GitHub。公开仓库**绝不能**放 `.env`、Token、密码、数据库备份、uploads 私有文件。

## 4. 如何让 Codex/Agent 读取

在最新项目根目录打开 Codex/Cursor。优先让其自动读根目录 `AGENTS.md`；若不自动读，请粘贴：

```text
请先完整阅读 AGENTS.md、docs/PROJECT_HANDOVER_2026-11-07.md、docs/OPERATIONS_RUNBOOK.md、docs/INCIDENT_REGISTER.md 和 docs/RELEASE_CHECKLIST.md。
不要开始写代码。先用只读命令核验本地/GitHub/ECS 三方 HEAD 与 status，比较 technicalSpecImage、productLine schema、系列导航、技术规格空表等关键差异。
区分 [R] 仓库证据、[H] 历史报告、[T] 待验证。先输出一份「当前真实状态/缺失代码/生产数据风险/下一步最小动作」，等我确认后再修改。
禁止打印任何 token、密码、密钥；严禁重置数据库或覆盖 ECS。
```

## 5. 重要区别：上传文档 ≠ 备份项目

GitHub 可能只存储 7 月旧代码。**不要删本地最新代码或 ECS**；生产 PostgreSQL、CMS uploads、密钥和 SSL 配置需要另外加密备份。建议确认文档 PR、代码 PR、数据库快照和媒体备份都存在后，才删除历史聊天。
