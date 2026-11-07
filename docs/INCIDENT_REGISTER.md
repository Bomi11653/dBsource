# dBsource 历史故障记录与解决方案

**标记**：`[H]` 聊天截图和执行记录；`[R]` 仓库代码核验；`[T]` 待再次验证。故障时间以用户截图为依据，不要把日志旧日期当成当前故障。

## I-01 · 官网和 CMS 同时卡顿、超时、502 / 500（最重要）

**现象 [H]**：浏览器 `www.dbsource-pro.com` 超时、`cms.dbsource-pro.com/admin` 不可达；Nginx 曾报告 upstream timed out；`pm2 status` 两服务却是 `online`；Next 日志高频 `fetch failed products/cases/downloads`。

**排查经过**：

1. Windows 开香港 VPN 时 `nslookup` 得到 `11.18.0.x`，断开 VPN 后解析到真实 ECS 公网 IP。说明 VPN/DNS 能影响浏览器访问，但这不是服务器后端 500 的直接根因。
2. ECS 本机 curl Nginx/Next/Strapi 的部分路径回 `200`，`nginx -t` 正常；这只证明当时某一路径可用，不证明所有 API 健康。
3. 访问未授权 `product-series-configs` 返回 `401`；带有效 Token 请求 `product-series-configs`、`products`、`cases`、`downloads` 一度全为 `500`。
4. `pm2 logs dbsource-strapi` 实际出现 `read ETIMEDOUT` 和：

```text
KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.
Are you missing a .transacting(trx) call?
```

**结论 [H]**：请求数据库连接池发生等待/耗尽，Strapi API 可能卡 60s 最后 500；Next 对 CMS 的重复请求加剧可用性问题。**尚未证明**是哪一个 SQL、具体事务泄漏、或者是否由连接数配置不足、慢查询、并发过高引起，不能把“连接池被占满”当成全部根因已永久解决。

**曾用的临时恢复步骤 [H]**：

```bash
pm2 stop dbsource-web
pm2 restart dbsource-strapi --update-env
# 确认带 token 的 4 项业务 API 均 200
pm2 restart dbsource-web --update-env
# 确认 PM2 两项 online、curl 成功、新日志 fetch success
```

**验收 [H]**：Token API 4 × 200；前端、本机域名及后台相关路径回 200；Next 日志重新出现 `[CMS] fetch success products/cases/downloads` 与 `cache saved`。

**长期优化 [T]**：查 `pg_stat_activity`、PostgreSQL `max_connections`、慢查询、`DATABASE_POOL_MAX/MIN`、Knex transaction 生命周期、Next 重复 fetch、页面 SSR 风暴、所有 GET 批量与重试行为；加限流、去重、缓存/告警。**不要在数据库有其他业务连接时直接重启 PostgreSQL**；如要重启须审批与备份。

**复现排查顺序**：`pm2 status` → `curl 127.0.0.1:3003/` → `curl 127.0.0.1:1337/admin` → 安全的单次 token API → Strapi 新时间戳日志 → PostgreSQL 连接统计 → Nginx -> 外网 DNS/VPN 对比。详见 RUNBOOK。

## I-02 · PDF 自动识别 `fake worker failed` [H/R]

**报错**：`Setting up fake worker failed: "Cannot find module './pdf.worker.mjs'"`。生产 `standalone`/PM2 运行路径与 pdfjs worker 相对路径不一致。

**改法**：`lib/pdf-parse-loader.cjs` 使用 `pdf-parse/worker getData()` 生成嵌入式 data URL；`next.config.js` 增加 server tracing；`scripts/copy-pdf-worker.mjs` 将 loader 放入 standalone；`scripts/verify-pdf-worker.mjs` 进行内嵌 worker 与 PDF 文字 smoke test。[R] 当前 GitHub 已有相关代码。

**验收**：Next build PASS、worker 验证 PASS、真实 PDF 能识别成多行参数表。不能只看页面出现“上传成功”。

## I-03 · Next standalone 找不到 `server.js` 导致网站 502 [H]

**报错**：`[PM2][ERROR] Script not found: /www/dBsource/.next/standalone/server.js`；`curl 127.0.0.1:3003` Connection refused，外网 502。

**成因**：build 被 Ctrl+C 中断、构建失败或 `.next` 被删后，仍 `pm2 delete/start` 指向不存在的构建产物。某次网页 `pm2` 显示在线和 `curl 200` 也必须核对是**新的进程+新的构建**。

**处置**：停止重复删除/启动；检查 `npm run build` 退出码、`test -f .next/standalone/server.js`、`.next/static`、`public`；确保 build 完成后才按照现有 PM2 启动模式重新运行并验证。不要为解决前端问题重启 Strapi。

## I-04 · Strapi `401` 与 `500` 被混淆 [H/R]

- 匿名读：`product-series-configs` 返回 `401` → 当前访问方式不获授权；需确认 Public `find/findOne` 或明确带 Token 的服务端读取。
- 带 Token 请求多集合返回 `500` → 不意味着 Token 一定损坏。实际 Strapi 日志显示 Knex 连接池超时。
- [R] 2026-07-23 的 `lib/strapi-client.ts` 的 `fetchStrapiCollection()` 默认不带 Token，而 `fetchStrapiWithToken()` 带 Token。因此 Token CURL=200 与 Next SSR 成功不是同一试验。

**规则**：先查请求实际是谁发的、是否带 `Authorization`、是否命中同一个 endpoint，随后看 Strapi 新日志；拒绝在证据不足时删除 Token 或全开 Public 权限。

## I-05 · 本地开发端口冲突 `EADDRINUSE` [H]

Windows 运行 Next `-p 3003` 或 Strapi `1337` 时重复启动，日志 `address already in use`。

**排查**（本地 PowerShell）：

```powershell
netstat -ano | findstr :3003
netstat -ano | findstr :1337
Get-Process -Id <真实PID>
```

只停止确认属于自己项目的 PID；保留其他运行实例。错误命令 `cd D:\...` 在 Linux Workbench、`rm -rf` 在 PowerShell 都不适用。

## I-06 · 系列导航「自定义项」跳回全部/卡顿 [H]

历史原因：URL 解析只认固定七系列，`unit48` 被归类 `electronics`；`useEffect` 使用旧 URL 参数覆盖刚点的本地状态。

**修复意图**：本地即时切换、URL 同步且保持 slug、动态 config 包含 CMS 明确启用系列、`productLine === slug` 精确过滤；不再把 SA、FA、Unit48、DS 回退全部。**需要先把最新源码同步进 GitHub**，当前 [R] `main` 尚存旧分支逻辑。

## I-07 · `electronics` / `unit48` / `suite` / `turnkey` 被自动追加导航 [H]

历史原因：默认 engineering 配置和 CMS seed 自动拼接，非系列类业务项意外显示。

**修复意图**：导航只由后台产品系列管理中启用可见项生成；数据仍保留；如需 `unit48`，须显式启用该配置。

## I-08 · 技术参数删到最后一行后恢复默认值 [H]

**成因**：Admin `resolveAdminProductSpecs`、保存 payload 和前端 resolver 都可能将空字符串当缺失，从静态参数库回填。

**修复意图**：删除最后行后 `setRows([])`；保存显式 `specsZh:""`/`specsEn:""`；刷新不回填；仅图无表时只展示原图。当前 GitHub `main` 仍有静态回填代码（[R]），严禁基于 main 直接覆盖新功能。

## I-09 · 规格图片上传按钮缺失、原图下载 [H]

旧线上 schema、Admin、Mapper 未全链路同步；原图可能被缩略图替换。历史修复增加单图 media `technicalSpecImage`，上传按钮放在技术规格区，`populate`、Mapper、`ProductDetailContent` 读原图。原生 `<img>` 并不重新编码图像；保持 `w-full h-auto object-contain`；右上下载按钮。**新 Agent 需检查当前运行完整链路**。

## I-10 · GitHub pull、手工 scp 混合部署风险 [H]

- ECS `git pull` 曾卡在 `gh.llkk.cc` GitHub 代理超时；恢复官方 GitHub 远端之前应查网络。
- Windows 多次 `scp` 成功上传单文件，但失败过 `data/mock.ts` 因远端 `data/` 不存在；先 `mkdir -p`，验证文件哈希。
- 手工上传文件会形成 `git status` 未提交差异；再 `git pull` 可能冲突或覆盖。必须先备份并对账，不得使用 `git reset --hard`。
- 在 GitHub 当前 `main` 比 ECS 旧的情况下，更不能“一键部署 main”。

## I-11 · HTTPS/外网偶发无法打开 [H]

Nginx `nginx -t` 成功≠ HTTPS 外网从用户所在网络一定可达；`curl` 在 ECS 自己请求域名失败可能涉及公网回流、DNS/代理，不足以认定 Nginx 配置错。分层测试：本机回环 → Nginx 本机（正确 Host、SNI）→ 外网不同运营商 → 客户端 DNS/VPN。停止服务/重启 Nginx 应最后考虑，而非第一动作。

## I-12 · 旧的 Server Action 版本不一致报错 [H]

曾出现 `Failed to find Server Action "x" ... newer or older deployment`。常见诱因是客户端缓存 JS 与服务端部署版本不一致、`.next` 构建资产与进程不一致。先验证静态资产、缓存、Nginx、部署版本一致性，避免混用两轮 build 产物；不能只凭报错推断数据库故障。

## 故障处理时禁止的动作

- 未确认数据库快照就删除数据库、清 uploads、重置 Strapi 内容。
- 用 `pm2 flush` 当作修复（它只清日志，并可能抹掉排查证据）；事故期间先保存日志，恢复后才可考虑轮转。
- 服务器有代码更改时用 `git reset --hard`、强制 pull 覆盖或重装。
- 主站和 CMS 同时无差别重启，混淆根因。
- 不检查 build 结果直接重启前端。
- 因 token API 500 就新建 Full Access Token 并公开权限。
