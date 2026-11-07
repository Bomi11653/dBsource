# dBsource 发布与事故日志（模板）

> 每次本地修复、生产部署、数据库维护均新增一条；不要覆盖旧记录。

## 记录格式

```markdown
### YYYY-MM-DD HH:MM +08:00｜变更/事故标题
- 处理人：
- 环境：Windows 本地 / 阿里云 ECS / GitHub PR
- 起始版本：`git rev-parse --short HEAD`
- 目标版本：`git rev-parse --short HEAD`
- 故障现象/变更目的：
- 证据：新时间戳日志、HTTP 状态、终端输出（密钥已脱敏）
- 涉及文件/Schema/数据库：
- 数据备份位置（只写安全位置代号，不写账号密钥）：
- 验证：tsc / build / API / 页面 / 中文英文 / 手机
- 处理动作：
- 回滚入口及是否演练：
- 结果：已恢复 / 部分恢复 / 未解决
- 后续根因动作及负责人：
```

## 历史汇总

### 2026-09-05（按聊天终端截图）｜网站超时/500/502 临时恢复
- 证据：Strapi `KnexTimeoutError`/连接池满，带 Token 的 API 一度 500，Next CMS fetch failed。
- 处理：停止 Next → 重启 Strapi → 4 个带 Token API 返回 200 → 重启 Next。
- 历史结果：四个网址 HTTP 200；Next fetch success/cached。
- 遗留：数据库连接池根因未完全解决；不能以此判定后续永久健康。

### 2026-11-07｜项目交接文档归档
- 原因：准备删除聊天，将关键技术与操作流程保留到 GitHub。
- 仓库核验：`main` HEAD `20f3c0f`（2026-07-23），发现与后续本地/ECS 功能存在差异。
- 结果：生成本交接包；是否已上传/合并 PR、是否已备份生产数据仍待操作人确认。
