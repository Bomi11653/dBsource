# dBsource 官网 · 完整项目交接文档

**交接版本**：2026-11-07 / ChatGPT 历史会话归档版
**用途**：把项目背景、系统、已实现功能、线上事故、上线流程和后续操作交接给 Codex/Agent/开发者。
**仓库**：[Bomi11653/dBsource](https://github.com/Bomi11653/dBsource)
**重要**：本文件记录历史过程，不构成 2026-11-07 当天的在线实时测试。

## 0. 三种证据等级（不要混淆）

- **[R 仓库核验]**：2026-11-07 通过 GitHub 连接核查仓库 `main` 的实际文件和提交。
- **[H 历史实测/用户反馈]**：本次聊天中的 Windows/ECS 终端截图、Cursor 审计报告、上线截图和测试结论；不代表已推送 GitHub。
- **[T 待复核]**：尚未从目前线上、ECS Git 状态或 GitHub 最新代码得到一致证据；新 Agent 必须验证。

### 0.1 最高优先级风险：GitHub 不是当前线上源代码的可靠快照

[R] 2026-11-07 GitHub `main` 最新可读提交为 `20f3c0fc67f312cd727805f3b83450666d37b854`，提交时间 **2026-07-23**，标题 `fix: make product admin actions visible`。其中：

- `cms/src/api/product/content-types/product/schema.json`：`productLine` **仍是 enum**（不是新方案的 string）。
- 上述 schema **缺少** `technicalSpecImage`。
- `lib/product-series-config.ts` 只将固定七项视为可管理系列。
- `lib/admin-product-spec-seed.ts` 仍有静态参数回填路径。
- `app/api/admin/[collection]/route.ts` 的产品查询未包含 `technicalSpecImage` populate。
- 根目录旧 `README.md` 内容较少；`deploy/docs/` 的部分部署手册仍为旧域名/旧路径。

[H] 2026-08～09 聊天截图中，Windows 本地和 ECS 已实际进行多轮代码修改，ECS 的 grep 显示 `technicalSpecImage` 和动态系列相关代码存在，且已有上传/构建/重启。**这些修改未能从 GitHub 当前 `main` 确认**。请先按 `docs/OPERATIONS_RUNBOOK.md` 的三方差异核验流程保护最新代码；严禁把 GitHub `main` 直接拉下来覆盖 ECS。

## 1. 项目是什么

dBsource 是专业音响/工程产品展示官网，面向客户展示品牌、产品、案例、下载资料，提供中英文内容、选型咨询和联系销售入口；运营人员通过自建后台更新产品与页面，Strapi 负责底层内容管理。核心目标是：不必修改页面源码就能管理产品、图片、技术规格、系列及商业内容。

### 1.1 完整技术栈

| 层 | 技术/职责 | 证据 |
|---|---|---|
| 前端/全栈 | Next.js **14.2.28** App Router、React 18、TypeScript、Tailwind CSS | [R] `package.json` |
| 动画/3D | Three.js、React Three Fiber、Framer Motion | [R] |
| CMS | Strapi **5.12.4** | [R] `cms/package.json` |
| 开发数据库 | SQLite（本地） | [R] `cms/config/database.ts` 支持、[H] 本地启动日志 |
| 生产数据库 | PostgreSQL | [H] ECS 的 Postgres/Knex 故障堆栈；[R] Strapi 配置支持 |
| 进程 | PM2 (`dbsource-web`、`dbsource-strapi`) | [H] |
| 网络代理 | Nginx + HTTPS | [H] |
| PDF 识别 | pdf-parse / pdfjs-dist，服务端 embedded worker | [R] `next.config.js`、`lib/pdf-parse-loader.cjs` |
| 内容缓存 | Next ISR/React cache + 服务端 last-known-good 落盘缓存 | [R] `lib/strapi-client.ts`、`lib/cms-lkg-cache.ts` |

### 1.2 地址、路径、进程

| 场景 | 实际地址/路径 | 作用 |
|---|---|---|
| 本地仓库 | `D:\dbsource\dbsource-audio-site` | Windows 开发/构建 |
| 本地前端 | `http://127.0.0.1:3003` | Next 开发/预览 |
| 本地 Strapi | `http://127.0.0.1:1337/admin` | CMS 开发 |
| ECS 项目 | `/www/dBsource` | 服务器实际代码目录，**不是**旧文档中的 `/var/www/dbsource` |
| ECS Strapi | `/www/dBsource/cms` | CMS 源码 |
| ECS Next | `127.0.0.1:3003`，PM2 `dbsource-web` | Nginx 上游 |
| ECS CMS | `127.0.0.1:1337`，PM2 `dbsource-strapi` | Nginx 上游 |
| 生产官网 | `https://www.dbsource-pro.com/` | 访客站点 |
| 自建后台 | `https://www.dbsource-pro.com/admin/login` | 运营内容后台 |
| Strapi 后台 | `https://cms.dbsource-pro.com/admin` | 内容/API 权限管理 |
| 公开代码 | `https://github.com/Bomi11653/dBsource` | 版本库（截至核查时落后） |

**双后台区别：** `/admin/login` 是 **Next 自建业务后台**，读取/写入 Strapi；CMS 子域名的 `/admin` 是 **Strapi 系统管理后台**。阿里云只是运行环境，Strapi 是内容管理软件，两者不是二选一。

### 1.3 核心数据链路

```text
用户浏览器
   ↓ HTTPS
Nginx :443（www / cms 两域名）
   ├─ www → Next.js :3003 → React 页面 / Next API / 自建后台
   │                   │
   │                   ├─ lib/fetchCMS.ts → lib/strapi-client.ts
   │                   │                      ↓ http://127.0.0.1:1337/api/*
   │                   └─ lib/strapi-mapper.ts → 产品 / 案例 / 下载展示模型
   └─ cms → Strapi :1337 ──→ PostgreSQL :5432
                                └─ cms/public/uploads（图片、PDF 等）
```

## 2. 主要目录和职责

```text
dBsource/
├── app/                            # Next App Router；页面及 API
│   ├── page.tsx                    # 首页
│   ├── products/                    # 产品列表、详情
│   ├── cases/                       # 工程案例
│   ├── downloads/                   # 下载中心
│   ├── about/                       # 关于/联系模块
│   ├── contact/                     # 联系
│   ├── configurator/                # 产品选型
│   ├── admin/                       # 自建运营后台
│   └── api/admin/                   # 自建后台访问 Strapi 的 API
├── components/admin/               # 字段编辑、规格编辑、后台表单
├── components/contact/             # 联系表单/地图/销售卡片
├── lib/                            # CMS、产品分类/规格、映射、缓存、鉴权
│   ├── fetchCMS.ts
│   ├── strapi-client.ts
│   ├── strapi-mapper.ts
│   ├── product-series-config.ts
│   ├── product-series-tabs.ts
│   ├── product-classification.ts
│   ├── admin-product-spec-seed.ts
│   ├── product-spec-display.ts
│   ├── cms-lkg-cache.ts
│   └── pdf-parse-loader.cjs
├── cms/                            # Strapi 源码 + schema + 配置
│   ├── config/database.ts
│   └── src/api/                    # content types
├── scripts/                        # 构建、PDF 验证、部署、内容处理脚本
├── deploy/                         # 旧部署示例与历史说明（可能过期）
├── docs/                           # 历史说明及本次新交接
├── AGENTS.md                       # 新 Agent 阅读入口（本交接包提供）
└── package.json
```

**注意**：GitHub 里不含生产数据库、私有环境变量和生产 uploads；完整系统备份不能只依赖 GitHub。

## 3. 历史已完成的业务需求（以本地/ECS 对账为准）

### 3.1 内容与基础页面

- 首页、产品中心、产品详情、工程案例、下载中心、关于、联系、智能选型、中英文双语、响应式导航。
- 自建后台可管理产品/案例/下载/联系信息/公司介绍/销售联系方式等，写回 Strapi。
- 系列与产品展示排序、中文英文名称、是否显示、Navbar 导航联动。
- 首页/产品/案例等 CMS 数据支持缓存，短期 CMS 故障时 last-known-good 数据降级。
- 关于页联系模块：左侧表单 + 右侧公司/地图，下方独立全宽销售顾问卡片（PC 横向四张）；联系人位置不能挤进右侧窄栏。[H]

### 3.2 产品系列管理（关键变更）

- 固定系列：`la`, `lw`, `mi`, `do`, `sol`, `k`, `re`。
- 后台「产品系列管理」可新增自定义系列（slug、中英文名、排序、可见），例如 `sa`、`fa`、`unit48`、`ds`；需要校验 slug、去重、保留 slug。
- 变更需贯通：Strapi `productLine` 的类型 → `product-series-configs` → Admin 新建/保存 → Navbar → `/products?series=slug` → 产品详情标签/搜索。
- `electronics`、`unit48`、`suite`、`turnkey` 等系统 seed 不能未经主动启用就成为产品系列导航；产品实体和 CMS 数据仍保留。「全部」仍能看到它们。
- `/products?series=sa|fa|unit48|ds` 切换不得被 `useEffect` 或默认白名单回退为「全部」；过滤以真实 `productLine` 匹配，不要依靠型号前缀乱猜。
- 未知 slug 如何降级、隐藏项是否可直接 URL 访问，需同产品系列管理规则保持一致。[H]

### 3.3 技术规格编辑、PDF 与规格图片

- 后台 `components/admin/ProductSpecsEditor.tsx` 编辑中英参数名称/值，新增、删除、上下排序。
- 参数允许删除到 **0 行**，保存明确写空 `specsZh:""`、`specsEn:""`，不得自动回填静态默认参数；后台刷新后也应保持空。
- PDF 参数识别：服务端上传 → `app/api/admin/product-specs/route.ts` → `lib/pdf-parse-loader.cjs` + AI 解析 → 可编辑的多行规格表；**不得把多条参数拼到一个字段**。
- 服务器 worker 曾报 `Setting up fake worker failed: Cannot find module './pdf.worker.mjs'`，采用 `pdf-parse/worker getData()` 的 data URL embedded worker，且必须校验 standalone loader。
- `technicalSpecImage`：产品级可选的单张规格图片，目标用于 SA/FA/Unit48/DS 等产品；在产品技术规格表下方 **与表格同宽、保留原比例、不裁切、原图清晰度**；右上角「下载规格图」按钮。无表格、有规格图时仍显示技术规格区域。
- 规格图与封面 `image`、图集 `gallery`、参数 PDF 各自独立。注意跨域的 `<a download>` 未必强制浏览器下载，若要保证下载应通过同源下载端点验证 `Content-Disposition`，不要贸然代理任意远程 URL。[H]

### 3.4 最近已解决的线上事故

**[H] 最近一次有截图时间戳的事故排查发生在 2026-09-05；不代表 11 月 7 日现场状态。**

1. 浏览器访问 `www` 和 `cms` 超时、502，ECS PM2 显示 online 但 API 不稳定。
2. 一度怀疑香港 VPN/DNS；Windows VPN DNS 解析成 `11.18.0.x` 非实际 ECS `47.119.181.44`；关 VPN 后 DNS 能解析真实 IP，但访问不一定立即恢复。
3. ECS `curl http://127.0.0.1:3003`、`curl http://127.0.0.1:1337/admin` 能返回 200；Nginx `nginx -t` 正常，但外部请求仍可能超时，不能把问题简单归为 VPN。
4. `public_series=401` 表示匿名读取无权限，但**不是**所有 500 的解释；带 API Token 时，四个集合曾都返回 500。
5. Strapi 日志显示 **`KnexTimeoutError: Timeout acquiring a connection. The pool is probably full`** 和 `read ETIMEDOUT`；大量请求约 60 秒后 401/500，说明数据库连接池等待/耗尽，根因可能涉及连接泄漏、慢事务、压力或等待，需要进一步定位，不等于已证明具体哪段代码泄漏。
6. 临时恢复操作：`pm2 stop dbsource-web` → `pm2 restart dbsource-strapi --update-env` → 4 个带 Token API 全部 200 → `pm2 restart dbsource-web --update-env`。
7. 恢复后 ECS 本机及经 Nginx 的 `/`、`/products`、`/admin/login`、CMS `/admin` 返回 200，Next 后续日志出现 `[CMS] fetch success` 和缓存保存。[H]
8. **这是临时恢复，不是根治。** 后续应监测连接池、慢查询、重复请求、重试频率、数据库 max_connections，并逐步做请求合并/限流/告警。

详见 `docs/INCIDENT_REGISTER.md`、`docs/OPERATIONS_RUNBOOK.md`。

## 4. 应保存的运行规则

- 所有新功能先弄清 Strapi schema/权限/媒体字段是否存在，再动 Next API、Mapper、页面和后台；**不要只改按钮**。
- 本地 Windows PowerShell 与 Linux ECS 命令不要混用：`rm -rf` 不是 PowerShell 标准写法，`npm.cmd` 不是 Linux 命令。
- 本地 `3003` 或 `1337` 报 `EADDRINUSE` 表示已有进程占端口；先查 `netstat -ano`/进程，不要盲目启动多个实例。
- ECS build 失败不得 restart；可执行文件 `.next/standalone/server.js` 不存在时不能创建 PM2 指向它；`pm2 online` 必须配合实际 HTTP/日志。
- 发布只改前端则不用重启 Strapi；修改 Strapi schema/config 则需备份 DB、构建 CMS、重启 CMS、验证业务 API。
- GitHub 拉取失败可能是服务器代理 `gh.llkk.cc`、GitHub 外联网络或 ECS 未提交手工上传；避免因 pull 失败用 `git reset --hard`。
- 使用 `scp` 单文件上传前必须保证服务器父目录存在；需要方括号路径时 PowerShell 用引号，传输完成核对 `sha256sum`/文件大小。
- **环境变量多文件可能不一致**：`.env.production.local` 对 Next 优先级高于 `.env.production`；不要用 `grep ... | tail -1` 的值代替实际 Next 运行时选中的值。
- Token/SSH 凭据若出现在截图或公开仓库应轮换，禁在回复里复制真实密钥。

## 5. 当前接手次序（严格按顺序）

1. 备份：ECS PostgreSQL、CMS uploads、当前 ECS 源代码、Nginx 配置与 `.env`（私下保存，不入公开 GitHub）。
2. 比对三方：本地 `git status/HEAD`、ECS `git status/HEAD`、GitHub `origin/main`；ECS 手工改动要保留。确定真正包含最新功能的代码根。
3. 补齐版本控制：将 ECS/本地最新版以审查过的 commit/PR 统一入仓库。先比差异，不强行覆盖，也不直接在生产服务器执行破坏性同步。
4. 检验 schema 是否实际为 string 且有 `technicalSpecImage`，Admin `populate`、mapper、保存接口/组件均对应。
5. 在非生产环境回归：新增系列、隐藏/删除保护、四大动态系列、参数删空、图片上传下载、PDF 识别、about 销售卡片。
6. 加强稳定性：API 调用超时+去重、数据库连接池监测、跨服务健康检查、避免请求雪崩、完善告警和备份演练。
7. 只有全部绿灯，再单次有限范围部署生产并存档结果。

## 6. 交接索引

- `AGENTS.md`：Agent 协作禁令和任务模板。
- `docs/ARCHITECTURE_AND_FEATURES.md`：技术数据流、功能清单、验收。
- `docs/OPERATIONS_RUNBOOK.md`：本地/ECS/GitHub/生产部署、故障处理。
- `docs/INCIDENT_REGISTER.md`：已发生故障及根因证据。
- `docs/RELEASE_CHECKLIST.md`：上线前后检查表。
- `docs/REUSABLE_ENGINEERING_BLUEPRINT.md`：通用代码架构与可复用模板。
- `docs/CHAT_ARCHIVE_SUMMARY.md`：整次聊天故事线、完成项、遗留项。
- `docs/GITHUB_UPLOAD_GUIDE.md`：只上传交接文档的安全方法。
- `docs/ENV_AND_BACKUP.md`：环境变量与备份/恢复规则。
- `scripts/ops/read-only-diagnostics.sh`：服务器只读体检脚本。
- `templates/reusable/`：可迁移其它项目的 CMS 客户端、单元测试和 CI 示例。

> 本文档完成后可以归档聊天，但**不要将聊天删除视作代码/数据已完成备份**。先保证本次包、GitHub PR 和生产数据快照分别存在。
