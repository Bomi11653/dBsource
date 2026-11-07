# dBsource 本次聊天归档 · 完整脉络

> 供未来 AI 不依赖聊天记录理解。最后一次实际生产恢复的截图时间为 **2026-09-05**；本文整理日为 **2026-11-07**。状态不是实时监控。

## 1. 项目背景与总体目的

专业音响品牌 dBsource 官网。开发方式以 Windows `D:\dbsource\dbsource-audio-site` 为本地项目、Cursor/Codex 迭代、阿里云 ECS `/www/dBsource` 部署。技术是 Next.js（前台和自建运营后台）、Strapi CMS（商品/案例/下载/导航等内容和媒体）、生产 PostgreSQL、Nginx HTTPS、PM2 进程；支持双语、产品筛选、详情技术规格、图片、PDF 识别、品牌展示/销售联系。常用生产域名为 `www.dbsource-pro.com` / `cms.dbsource-pro.com`。

## 2. 项目推进历史（只记录本聊天中发生过的事实和报告）

**早期基础功能**

- 完成 Next + Strapi + PostgreSQL 的部署和后台交接；自建 `/admin/login` 用于日常内容，CMS `/admin` 用于底层数据管理。
- 产品中心系列排序、详情页参数表、图片/图集、案例、下载、联系模块、销售卡、首页导航、双语等不断迭代。
- 关于页销售顾问模块要在地图/公司联系下方独立全宽展示，不是挤在右侧窄栏四张竖排。

**PDF 识别问题**

- PDF 上传/识别在生产出现 `./pdf.worker.mjs` 找不到；排查服务端 pdf-parse fake worker、standalone tracing。
- 改成 embedded worker `getData()` 方案，添加 verify 脚本并在本地/ECS 多次测试。
- PDF 提取内容须拆分多行中英参数，不可将整张表当作单行字符串；修复 AI 返回 `rows` 的 TypeScript 类型报错。

**产品系列功能**

- 原后台固定 `LA/LW/MI/DO/SOL/K/RE` 七项，新增系列按键仅能补缺，不允许自定义。
- 本地 Cursor 审计宣称 `productLine` 已改 string 和 `product-series-configs` 已存在，完成可新增自定义 slug、动态导航/筛选/详情与删除保护；ECS 曾手工上传新的 schema 类型、前台和后台模块。
- `electronics/Unit48/dBcover/工程方案` 被无意加入导航，之后调整为仅由后台明确管理/启用的系列显示，产品和历史 CMS seed 不删除。
- SA、FA、Unit48、DS 筛选曾卡顿/URL 跳回「全部」，之后按本地状态立即切换+动态 slug 路由修复。

**技术规格图与空参数**

- 根据 FA/SA/Unit48/DS 产品技术说明截图，在技术规格表格下添加与表格同宽的清晰原图；后台新增上传单图字段 `technicalSpecImage`，下载按钮在右上角。
- 上传图应保留 Strapi 原始文件 URL，而不是取 `thumbnail/small/medium/large` 压缩格式；前台原生 img `w-full h-auto object-contain`。
- 后台删完参数原来会被默认参数库补回；先修了保存时的 fallback，随后发现最后一行仍无法删除，经再次修改 Editor + 保存路由 + 规格展示 resolver，使 `specsZh/specsEn` 为空时真正保持空表。
- 这些本地改动以 `scp` 手动传入 ECS，过程中出现部分服务器缺失目录、build 缺类型、被中断等部署问题。

**生产事故（2026-09-05 截图）**

- 官网和 CMS 域名出现浏览器超时，曾讨论香港 VPN、Windows DNS、ECS 防火墙和 Nginx。
- ECS 内 Next/Strapi 有时 200，但外网超时；日志有大量 Next CMS 读取失败；Strapi 先出现未授权 `401`，后 Token 请求多集合也 `500`。
- Strapi 后端日志最终证实 Knex 数据库连接池获取超时（`KnexTimeoutError`），并非简单域名错误/浏览器 VPN/Token 失效。
- 应急操作：停止 Next、重启 Strapi、测试所有四类 Token API 均 200、重启 Next；再测官网、产品页、自建后台、Strapi 后台均 HTTP 200，后续日志 `fetch success`，恢复。
- 尚未完成长期根治数据库连接池耗尽或请求风暴，今后必须加根因监控，禁止认为一次重启等于永久修好。

## 3. 处理过程中出现过的错误关键词（供检索）

```text
EADDRINUSE :3003 / :1337
Setting up fake worker failed: Cannot find module './pdf.worker.mjs'
Type error: Property 'rows' does not exist on type 'ProductSpecExtraction'
Property 'technicalSpecImage' does not exist on type 'Product'
PM2 Script not found: /www/dBsource/.next/standalone/server.js
Failed to find Server Action "x"
Strapi product-series-configs HTTP 401
KnexTimeoutError: Timeout acquiring a connection. The pool is probably full
read ETIMEDOUT
HeadersTimeoutError
502 Bad Gateway
curl: (3) bad range in URL position ...
GitHub proxy gh.llkk.cc connection timed out
```

完整排查见 `docs/INCIDENT_REGISTER.md`。

## 4. 历史最后确认的测试结果（不是当前线上）

- Strapi Token：`product-series-configs/products/cases/downloads` **均返回 200**。[H]
- PM2：`dbsource-web`、`dbsource-strapi` 均在线。[H]
- 站点 `/`、`/products`、`/admin/login`、`https://cms.dbsource-pro.com/admin` 均经 ECS 测试返回 200。[H]
- Next 新日志：`fetch success products/cases/downloads`、`cache saved ...`。[H]

## 5. 当前真正没完成的事情（接手时优先处理）

1. **代码对账（P0）**：GitHub `main` 与 2026-08～09 ECS/本地手工修改显著不一致；不要删旧生产文件，更不要用 `main` 覆盖。先让仓库包含真正最新版。
2. **数据库长稳（P0）**：需要对 Knex 连接池耗尽做根因调查与监控/削峰，重启只是临时恢复。
3. **安全（P0）**：截图中曾暴露 Strapi API Token；需轮换，检查仓库历史和日志是否还保存明文密钥。
4. **流程（P1）**：需要规范 PR、版本化部署、生产前构建验证和可回滚 release，减少乱传文件/乱删 `.next`。
5. **回归（P1）**：验证线上动态系列、规格图上传/下载、空参数、PDF 识别、About 销售卡的最终状态；现仅有历史截图，不能声称今天也已通过。
6. **数据备份（P1）**：GitHub 不存 CMS 正式数据库和 uploads；需定期加密备份+实际恢复演练。

## 6. 一句话给未来 Agent

> 我们做过大量本地和 ECS 直接修改，**GitHub main 比这些修改旧**。先保护服务器和数据库，完成三方版本对账；稳定后再做新功能。最严重的线上故障曾是 Strapi/Knex 数据库连接池耗尽，临时通过停止 Next、重启 Strapi、逐个 API 验证、再启动 Next 恢复，但尚未根治。
