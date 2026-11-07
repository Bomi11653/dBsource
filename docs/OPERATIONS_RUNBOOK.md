# dBsource 运行、部署、恢复手册

**适用**：阿里云 ECS Ubuntu + Nginx + PM2 + Next.js + Strapi + PostgreSQL；本地 Windows + Cursor/Codex。
**安全原则**：先只读检查、保存证据、判断影响，再经批准修改。**每次操作限定最小服务范围。**

## 1. 判断在哪台机器

| 操作 | Windows PowerShell（本地） | ECS Workbench（Ubuntu） |
|---|---|---|
| 进入项目 | `cd D:\dbsource\dbsource-audio-site` | `cd /www/dBsource` |
| 安装 | `npm.cmd install` | `npm install --no-audit --no-fund` |
| TS | `npx.cmd tsc --noEmit` | `npx tsc --noEmit` |
| 构建 | `npm.cmd run build` | `npm run build` |
| 启动前端开发 | `npm.cmd run dev`（端口 3003） | 生产使用 PM2，**不用 dev** |
| 启动 CMS 开发 | `cd cms; npm.cmd run develop` | 生产使用 PM2，**不用 develop** |
| 查端口 | `netstat -ano \| findstr :3003` | `ss -lntp \| grep ':3003'` |

### 1.1 系统级先查，不改动

ECS：

```bash
cd /www/dBsource
pwd
pm2 status
ss -lntp | grep -E ':(80|443|3003|1337|5432)\b' || true
free -h
df -h
sudo nginx -t
```

然后使用随交接包的 **只读** `bash scripts/ops/read-only-diagnostics.sh`；它不会重启、删除或写入生产资源。

## 2. 三方代码核验 —— 任何开发前必须做

**Windows PowerShell**：

```powershell
cd D:\dbsource\dbsource-audio-site
git status -sb
git log -1 --oneline
git remote -v
git fetch origin
git log -1 --oneline origin/main
git diff --stat origin/main...HEAD
```

**ECS**：

```bash
cd /www/dBsource
git status -sb
git log -1 --oneline
git remote -v
# 没有确认网络/工作区干净之前，不运行 git pull
```

**验对关键文件**（ECS 与本地各执行对应检索）：

```bash
cd /www/dBsource
rg -n 'technicalSpecImage|"productLine"|createCustomManagedSeries|mergeProductSpecsForSave' \
  cms/src/api/product/content-types/product/schema.json \
  components/admin/AdminSectionEditor.tsx lib/admin-product-spec-seed.ts \
  lib/strapi-mapper.ts app/products 2>/dev/null || true
```

如果没有 `rg`，改用 `grep -R -n -E`。`git status` 若存在修改，先私下备份文件/做 patch；**不能** `git reset --hard`。如果 ECS 文件比 GitHub `main` 新，先做 `git diff` 和 `sha256sum`，建立权威新代码源，再谈部署。

## 3. 本地开发与验收

**本地 Windows 分两个独立终端**：

```powershell
# 终端 A：Strapi
cd D:\dbsource\dbsource-audio-site\cms
npm.cmd run develop
```

```powershell
# 终端 B：Next
cd D:\dbsource\dbsource-audio-site
npm.cmd run dev
```

浏览器：`http://127.0.0.1:3003`、`http://127.0.0.1:3003/admin/login`、`http://127.0.0.1:1337/admin`。遇到 `EADDRINUSE`，先用 `netstat -ano | findstr :3003` / `:1337`，确认 PID 归属后停止旧进程，不重复运行。

修改 TypeScript 后：

```powershell
cd D:\dbsource\dbsource-audio-site
npx.cmd tsc --noEmit
npm.cmd run build
node scripts/verify-pdf-worker.mjs
```

不涉及 PDF 可省略最后一步。若构建异常 `.next` 缓存损坏，只在**本地进程已停止**且确认当前目录后执行项目既有 `npm run clean`；不要把本地修复方式生搬到生产。

## 4. 发布前保护与备份（必须）

上线前先确认：

- PostgreSQL 最近一次恢复点/备份可用；至少记录备份时间和存放位置。需要备份时使用已审核的数据库用户与权限执行 `pg_dump`，不要输出密码到终端/仓库。
- `cms/public/uploads/` 的快照/对象存储备份可恢复。
- 当前 `/www/dBsource` 源码、构建产物、服务配置留可回滚版本；备份目录不公开。
- Nginx 配置、PM2 启动脚本、环境变量文件安全备份（本地保密存放）。
- 本次变更的文件清单、数据库 schema 变化、执行人、发布时间及回滚目标明确。

**不推荐**在生产目录运行 `rm -rf .next` 时让旧前端进程继续依赖该目录。长期推荐：版本化 release 目录/构建候选、验证后原子切换、前一个 release 保留用于回滚。当前项目若还没有 release 结构，应先规划再改，不能套用未验证的脚本。

## 5. 仅改 Next 前端（现有 in-place 方式，有维护窗口/中断风险）

**前置**：文件已备份/同步，服务器 Git 状态已审查，允许安排维护，构建流程已在本地通过。以下是项目历史运行方式，不是建议无条件复制的一键上线。

```bash
cd /www/dBsource
# 仅当已经确认来源与无冲突，才能选择 git pull origin main
# 未同步 Git 时先核验手工传入的文件与预期版本
pm2 status
# 建议在维护窗口先停前端，避免清理 .next 时仍被线上请求读取
pm2 stop dbsource-web
npm install --no-audit --no-fund
npm run build
# 只有 build 退出码=0 且 standalone server.js 存在才往下
 test -f .next/standalone/server.js
node scripts/verify-pdf-worker.mjs
mkdir -p .next/standalone/.next
cp -a .next/static .next/standalone/.next/
if [ -d public ]; then cp -a public .next/standalone/; fi
# 确认 PM2 旧进程指向的正确入口和 cwd 后再启动
pm2 start dbsource-web --update-env
pm2 status
```

**注意**：上方 `pm2 start dbsource-web` 只在该 PM2 进程已经被登记并处于 `stopped` 状态时适用；如果记录已被删，必须先检查现有 `pm2 describe`、使用正确脚本路径 `.next/standalone/server.js` 和 `PORT=3003`、`HOSTNAME=127.0.0.1` 恢复。绝不可在编译失败后直接 `pm2 delete` 再 `pm2 start` 一个不存在的文件。`pm2 restart` 也不能替代成功 build。**更安全的标准是构建候选 release、检查完再切换**。

若 `npm run build` 失败：**停止，别重启或替换正在运行的版本**；若前端已停止，必须从事先备份的稳定构建恢复，再按先前入口启动。

只改前端时**不重启 Strapi**。

## 6. 改 Strapi schema 或数据库映射

1. **需要审批和备份生产 DB**；本地测试变更对已有数据的影响。
2. `cms/src/api/**/schema.json` 改动同步更新 TypeScript 类型、Admin API populate、Mapper、前端展示。
3. 在非生产完成：`cd cms && npm run build`（项目 `prebuild` 会先生成类型）。
4. 生产维护窗口中，在已备份并完成发布工件核验后构建/迁移；只重启 Strapi，观察启动迁移与日志。
5. 验证 `/admin` **和**产品/案例/下载/series 等真实数据 API；仅 `/admin 200` 不足以证明数据库正常。
6. API 正常后前端再逐项验证；不改 schema 的前端修改无需重启 Strapi。

## 7. 故障排查顺序（低风险 → 高风险）

### A. Nginx / 主站 / CMS 哪层坏了？

```bash
pm2 status
sudo nginx -t
curl -sS -o /dev/null -w 'next_root=%{http_code} time=%{time_total}s\n' --max-time 10 http://127.0.0.1:3003/
curl -sS -o /dev/null -w 'next_products=%{http_code} time=%{time_total}s\n' --max-time 10 http://127.0.0.1:3003/products
curl -sS -o /dev/null -w 'strapi_admin=%{http_code} time=%{time_total}s\n' --max-time 10 http://127.0.0.1:1337/admin
```

浏览器外网不通时，再从其他网络测试 `www`/`cms` 域名、HTTPS、VPN DNS；不要把 ECS 本机的 DNS/公网回流失败直接等同于全国用户访问失败。

### B. 真正的业务 API 与 Token 读取

**安全**：不要在截图里显示 Token；生产 `.env.production.local` 通常优先于 `.env.production`。先用 `pm2 describe dbsource-web` 验证进程环境/入口，按最终有效环境测试。示例仅取值，不输出它：

```bash
cd /www/dBsource
set -a
# 注意：以下按优先级给 local 覆盖 production；不要将 .env 文件直接打印出来
[ ! -f .env.production ] || . ./.env.production
[ ! -f .env.production.local ] || . ./.env.production.local
set +a
[ -n "${STRAPI_API_TOKEN:-}" ] || { echo 'Missing token'; exit 1; }
curl -g --max-time 10 -sS -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  -o /dev/null -w 'products=%{http_code} t=%{time_total}s\n' \
  'http://127.0.0.1:1337/api/products?pagination[pageSize]=1'
```

**安全提示**：`. env` 只在确认内容为可信的 shell 兼容配置、没有空格/命令替换时才可使用。若有复杂字符或未知来源，不要 `source`；改为用项目/密码管理器的正式部署环境或只读脚本解析。用户以前用 `grep tail -1` 可能取到 `.env.production` 的旧 Token 而非 `.env.production.local`，不要重犯。

如果带 Token `200`、匿名 `401`，说明匿名权限策略未开放；不应直接将 `401` 当成数据库故障。如果所有带 Token API `500`、请求近 60 秒，马上看 Strapi/数据库日志。

### C. 数据库连接数、慢事务（只读诊断）

```bash
sudo -u postgres psql -c "select state, count(*) from pg_stat_activity group by state order by count(*) desc;"
sudo -u postgres psql -c "select pid, usename, state, wait_event_type, wait_event, now()-query_start as age, left(query,100) as query from pg_stat_activity order by query_start asc limit 25;"
sudo -u postgres psql -c "show max_connections;"
# 若生产 DB 账号权限不同、使用外部 RDS，请以 DBA 授权方式查
```

连接池 Knex `acquireTimeout` 不等于数据库不可用；应排查具体持锁事务与慢查询、长时间 `idle in transaction`、应用并发、数据库用户连接上限。**不要随意杀 Postgres PID 或重启数据库**。

### D. 应急恢复（只在证据指向 Strapi 连接池且已确认影响后）

```bash
# 先把当前日志留档到安全运维目录，再操作；以下仅历史有效步骤
pm2 stop dbsource-web
pm2 restart dbsource-strapi --update-env
# 等真实业务 API 带 Token 响应 200 后
pm2 start dbsource-web --update-env
```

立即验证新日志、4 个业务集合/API、域名与页面。如果故障重复发生，提升级别做代码/数据库根因调查，而不是日常靠重启维持。

## 8. 其他排查规则

- **`curl -g`**：URL 带 Strapi 方括号查询时应加 `-g` 禁用 curl glob 解析；`curl: (3) bad range in URL` 是命令解析问题，不是服务异常。
- **Nginx 端口**：Nginx `:80/:443`，Next `:3003`，Strapi `:1337`；以 `ss -lntp` 核对实际监听。
- **SSL**：`curl --resolve`、`--connect-to` 要保证 SNI/Host 与域名一致；直连 IP 的证书验证不能作为全链路证明。
- **窗口/日志**：`pm2 logs ... --nostream` 只看快照；不应误读历史红色日志。必要时 `pm2 describe` 查 PID/uptime，然后用时间过滤近期日志。不要事故期间先 `pm2 flush`。
- **上传失败**：`scp` 成功后比对文件 hash；失败先核对父目录和权限，避免 ZIP 中反斜杠路径在 Linux 解压错位。
- **域名**：用户浏览器香港 VPN 曾导致 DNS 解析 `11.18.0.x`；关 VPN 后解析回真实公网 IP，服务器出错仍需单独分析。

## 9. 凭据和数据安全

- 生产 Token 曾在终端截图中完整显示，视为**已暴露**；按管理流程轮换，废止旧 token，然后逐个环境变量配置来源核查。
- `.env.production`/`.env.production.local` 同一 key 需有明确唯一权威，避免两个不同 token 引起排查混乱。轮换前备份，轮换后用不打印值的健康检查验证。
- 备份范围=Git 源码/差异 + PostgreSQL 数据 + CMS uploads + 环境配置（加密） + Nginx/PM2 配置；**GitHub 不是数据库备份**。
