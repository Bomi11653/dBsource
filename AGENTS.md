# AGENTS.md — dBsource 项目 AI 协作规则

> 本次归档实查：先阅读 `docs/IMPORT_AUDIT_2026-11-07.md`。指定本地目录无 .git，741 个 main 跟踪文件逐字节一致；ECS 未连接。本文中的旧本地路径和历史验收不代表当前状态。

> 面向 Codex、Cursor、Claude Code、其他 Agent。进入仓库时先读本文件，再读 `docs/PROJECT_HANDOVER_2026-11-07.md`。文档日期 2026-11-07；**它不是当前线上运行状态的实时证明**。

## 0. 严格优先级

1. **保护生产数据**：不删除 Strapi 数据库、产品记录、uploads、环境变量、证书、真实媒体，不擅自改 schema。
2. **确认代码来源**：先看 `git status -sb && git log -1 --oneline && git remote -v`；明确当前操作的是本地 Windows、阿里云 ECS 还是 GitHub。不要假设 GitHub `main` 与生产环境一致。
3. **一轮只解决一个问题**：先审计事实、列最小改动、再执行、再测试、再交付；不并行扩张需求。
4. **失败立即停**：`tsc` 或 `npm run build` 失败不得 `pm2 restart`；构建后的 standalone 要存在 `server.js`，否则禁止替换生产进程。
5. **不泄露凭据**：永远不要打印、上传、写入文档真实 `.env*`、`STRAPI_API_TOKEN`、`ADMIN_TOKEN`、数据库密码、SSH 私钥；截图日志必要时先脱敏。公开仓库视为任何人可读。
6. **严禁为了“修复”使用危险捷径**：不要默认 `git reset --hard`、`git clean -fdx`、`pm2 delete`、`rm -rf /www/dBsource`、数据库清表、`sudo systemctl restart postgresql`。必须先诊断、备份、说明影响、获得明确批准。

## 1. 必读顺序

- `docs/PROJECT_HANDOVER_2026-11-07.md`：项目及历史状态、代码差异风险、接手顺序
- `docs/ARCHITECTURE_AND_FEATURES.md`：数据链路、页面、功能、核心代码路径
- `docs/INCIDENT_REGISTER.md`：踩坑、排查证据与修复措施
- `docs/OPERATIONS_RUNBOOK.md`：环境检查、部署和恢复
- `docs/REUSABLE_ENGINEERING_BLUEPRINT.md`：复用方案与样例代码
- `docs/RELEASE_CHECKLIST.md`：每次上线的验收标准
- `docs/ENV_AND_BACKUP.md`：环境变量、凭据轮换与正式数据备份
- 原有旧文档在 `deploy/docs/`，但可能含旧域名 `/var/www/dbsource`，不可直接照搬。

## 2. 当前代码差异风险（必须读）

**2026-11-07 对远程 GitHub `Bomi11653/dBsource` 的核对结果：** 默认 `main` 最新可读提交 `20f3c0f`（2026-07-23）。该快照中 `cms/src/api/product/content-types/product/schema.json` 的 `productLine` 仍为 `enumeration`，没有 `technicalSpecImage`。而聊天中的本地/ECS 修改已经实现动态 series、图片规格、空参数保存等。**因此 GitHub `main` 不是最新功能的可靠依据**。

任何 Agent 想继续开发前必须做版本盘点：

```text
本地 HEAD 与 status → ECS HEAD 与 status → GitHub origin/main → 三方差异文件
```

必要时仅导出差异/备份；不得直接 `git pull --rebase` 覆盖 ECS 手工上传文件，也不得将旧 `main` 直接部署线上。

## 3. 结构与运行

- 本地（Windows）：`D:\dbsource\dbsource-audio-site`
- ECS：`/www/dBsource`
- 官方 GitHub：`Bomi11653/dBsource`，`main`
- Next.js 14.2.28，TypeScript，Tailwind；站点与自建后台监听 `127.0.0.1:3003`，PM2 `dbsource-web`
- Strapi 5.12.4，监听 `127.0.0.1:1337`，PM2 `dbsource-strapi`
- 生产 PostgreSQL，前端通过 Strapi API 取产品、案例、下载、分类等内容
- Nginx 对外提供 HTTPS；`www.dbsource-pro.com` → Next；`cms.dbsource-pro.com` → Strapi
- 本地 Windows 运行 npm 优先 `npm.cmd`、`npx.cmd`；Linux 使用 `npm`/`node`。

## 4. 变更后必须做的事

- 列出改动文件、数据影响（是否改 Strapi schema）、是否重启哪个 PM2 服务、回滚方法。
- `npx tsc --noEmit` → `npm run build` → 若涉及 PDF：`node scripts/verify-pdf-worker.mjs`。
- 前端改动只重启 `dbsource-web`；**Strapi schema/config 变化**需验证 `cms` 构建及重启，并事前备份生产数据。
- 验收 `/`、`/products`、`/admin/login`、`/about`、`/contact`、`cms /admin`、相关接口，至少复核修改对应功能。
- `pm2 status` 显示 `online` **不等于服务健康**；必须用 `curl` 和新时间戳日志验证。
- 不得使用“通过”替代运行截图/命令结果；区分本地测试与生产验证。

## 5. 必须遵守的功能不变量

- 自定义系列（例如 `sa`/`fa`/`unit48`/`ds`）必须从 CMS 同步到后台、产品筛选、Navbar、详情标题；只有 `visible=true` 的管理系列出现在前台筛选。
- `electronics`/`unit48`/`suite`/`turnkey` 等历史系统 seed 不得自行冒充启用的系列导航；`unit48` 可由管理员显式启用。不能删除关联的实际产品或 CMS 记录。
- 规格文本 `specsZh` / `specsEn` **允许都为空**，不得用静态规格重新填回；`technicalSpecImage` 可独立存在；规格图展示原图、不裁切、提供下载。
- PDF 在服务端解析；保留 `pdf-parse/worker getData()` 的嵌入式 worker 逻辑，不再依赖 `./pdf.worker.mjs`。
- 前端 CMS 请求失败时按既有 LKG 机制降级，**绝不以 Mock 数据悄悄覆盖生产真实内容**。
- 区分 SEO/SSR 缓存、浏览器缓存、LKG 落盘缓存、Strapi 数据以及数据库中的正式记录。

## 6. Agent 回复模板

```text
目标：本轮只处理……
已核实：代码位置、实际运行环境、数据链路
疑点/风险：……
最小改动：文件列表
执行：本地命令（Windows）/ ECS 命令（Linux）分开
验证：tsc/build/API/浏览器/日志
上线：仅在构建成功与审批后操作
回滚：……
```

**接手第一件事：不要立即修改代码，先依据 `docs/PROJECT_HANDOVER_2026-11-07.md` 做三方状态对账。**
