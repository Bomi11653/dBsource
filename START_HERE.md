# dBsource 交接包 · 阅读与上传入口

> 本次归档实查：先阅读 `docs/IMPORT_AUDIT_2026-11-07.md`。指定本地目录无 .git，741 个 main 跟踪文件逐字节一致；ECS 未连接。本文中的旧本地路径和历史验收不代表当前状态。

**版本**：2026-11-07
**GitHub 项目**：https://github.com/Bomi11653/dBsource

此包是为删除历史聊天前制作的**完整文档与通用代码模板**。不包含生产密钥、数据库备份、图片媒体，也**没有修改 GitHub 仓库或 ECS**。

## 先看最重要结论

2026-11-07 读取 GitHub `main` 发现最新提交仍为 `20f3c0f`（2026-07-23），与聊天中后续实现的动态系列、规格图片/空表保存不同。**不要直接从 main 向生产发布**；先对本地、ECS、GitHub 进行版本对账。

## 文件阅读顺序

1. `AGENTS.md`：Codex/Agent 的永久项目约束。
2. `docs/PROJECT_HANDOVER_2026-11-07.md`：完整项目情况、历史成果与当前风险。
3. `docs/CHAT_ARCHIVE_SUMMARY.md`：此次聊天的全过程浓缩归档。
4. `docs/ARCHITECTURE_AND_FEATURES.md`：网站数据流、页面和具体功能。
5. `docs/INCIDENT_REGISTER.md`：所有主要踩坑及已知处理方法。
6. `docs/OPERATIONS_RUNBOOK.md`：从诊断到部署、回滚的安全手册。
7. `docs/RELEASE_CHECKLIST.md`：验收标准。
8. `docs/REUSABLE_ENGINEERING_BLUEPRINT.md`：其它项目可复用的工程架构和代码。
9. `docs/ENV_AND_BACKUP.md`：环境变量与正式数据/媒体备份。
10. `docs/GITHUB_UPLOAD_GUIDE.md`：如何独立将文档提交 GitHub。
11. `scripts/ops/`、`templates/reusable/`：只读诊断和可测试样例代码。

在项目仓库根目录请不要覆盖现有 `README.md`；本包的 `START_HERE.md` 可留作导航，文档提交时可一并 `git add START_HERE.md`。

## 验证样例代码（无需联网）

```bash
node --check templates/reusable/cms-client.mjs
node --test templates/reusable/cms-client.test.mjs
bash -n scripts/ops/read-only-diagnostics.sh
```

## 新 Agent 开场词

> 请先阅读 `AGENTS.md`、`docs/PROJECT_HANDOVER_2026-11-07.md`、`docs/INCIDENT_REGISTER.md` 和 `docs/OPERATIONS_RUNBOOK.md`。不要直接改代码。先做本地/ECS/GitHub 三方版本对账；区分确认过的代码和历史消息，验证生产关键链路后给出最小单任务计划。禁止泄露密钥/删除数据/未经 build 成功就重启。
