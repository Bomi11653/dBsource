# dBsource 架构与功能实现指引

## 1. 分层原则

| 层 | 文件/服务 | 只负责什么 | 不能做什么 |
|---|---|---|---|
| CMS Schema | `cms/src/api/**/schema.json` | 字段、校验、关联、发布机制 | 不承担前端布局 |
| CMS 数据库 | PostgreSQL / SQLite（开发） | 正式记录与事务 | 不通过 Git 同步 |
| API & 鉴权 | `app/api/admin/**`、`lib/strapi-client.ts` | 权限、读写、populate、错误/超时 | 不泄露 token 到浏览器 |
| Mapper | `lib/strapi-mapper.ts`、`lib/media-url.ts` | Strapi 媒体与字段转前端数据 | 不偷偷补写 CMS 数据 |
| 业务配置 | `lib/product-series-config.ts`、`lib/product-series-tabs.ts`、`lib/product-classification.ts` | 动态系列/过滤/标签 | 不用静态白名单吞掉新 slug |
| Admin UI | `components/admin/*` | 表单、编辑、保存、提示 | 不在前端自行绕开验证 |
| Frontend | `app/products/*`、`app/about/*` | 页面展示、路由交互 | 不向 CMS 直接暴露秘密 |
| Cache | `lib/cms-lkg-cache.ts`、Next 缓存 | 缓解临时 CMS 故障 | 不将缓存当永久真相 |
| Ops | PM2、Nginx、Postgres | 保持服务可用、检查告警 | 不能用 restart 代替根因分析 |

## 2. 产品列表与系列的真实链路

```text
Strapi product-series-configs（slug,nameZh,nameEn,sortOrder,visible）
         │
         ├── lib/fetchCMS.ts → buildProductSeriesConfig()
         │          ├── 后台管理条目/筛选
         │          ├── Navbar 产品下拉
         │          └── /products 系列 tabs
         │
Strapi products (model, productLine, seriesZh, seriesEn, image/gallery ...)
         ├── mapper → /products 产品卡
         └── ProductDetailContent → /products/[id] 产品详情
```

**历史需求（[H]）**：固定七项 `la/lw/mi/do/sol/k/re`；支持自定义 `sa/fa/unit48/ds` 等；CMS 明确启用/隐藏的管理项才进导航。保留 slug 的安全规则、禁止重复、至少中文和英文名称、默认 sortOrder；前台以 `visible` 和排序为准，隐藏系列数据不删除。历史种子 `electronics`、`suite`、`turnkey` 不自动进入导航；`unit48` 需要管理员显式启用，不能一刀切拒绝。直接访问未启用 slug 的 URL 需有一致且可测试的处理规则。

### 2.1 导航切换必须满足

- 点击 LA/LW/MI/DO/SOL/K/RE/SA/FA/Unit48/DS 时，立即呈现选中视觉状态。
- `?series=slug` 与选中状态保持一致，不因 `useEffect`、默认 tabs 或缓存读写被打回 `/products`。
- `productLine` 依 slug 严格匹配；产品为空应显示“该系列暂无产品”，不是显示全部商品。
- 切换中英文只改名称，不变更 slug/过滤结果。
- Navbar、后台系列管理、前端筛选共用同一真实 CMS 配置；管理界面新增系列后触发所需 revalidation。

### 2.2 服务端与浏览器权限

Strapi 公开 API `Public` 可配置 `find/findOne`，但不应为了修复暂时性 500 就盲目把所有集合公开。`lib/strapi-client.ts` 在 [R] GitHub 版本的 `fetchStrapiCollection()` **没有自动注入 `STRAPI_API_TOKEN`**；`fetchStrapiWithToken()` 才显式带 token。因此必须由 Agent 核验 **生产运行代码是否已有新鉴权策略**；`curl` 带 token 返回 200 不能证明匿名 `fetchStrapiCollection()` 一定成功。最好为服务端读取明确制定一致的 Token/权限方案，并按最小权限原则实施。

## 3. 技术规格（参数表 + 高清图）

```text
后台选择产品
  ├─ ProductSpecsEditor：技术参数行（可删除至 0 行）
  ├─ PDF 导入：服务端识别 → 预填行 → 人工确认
  └─ technicalSpecImage：可选单张图 → Strapi media id
                  ↓ 保存/发布
API：specsZh/specsEn 明确写入空字符串，media id 正确序列化
                  ↓
Strapi products → fetchCMS populate image/gallery/technicalSpecImage
                  ↓
mapper 将规格图转换为完整的原图 URL
                  ↓
详情：表格（有数据才显示） → 大图（有图才显示，w-full h-auto）
                                     └─ 右上下载按钮（原图）
```

必备的验收矩阵：

| 参数表 | 规格图 | 预期结果 |
|---|---|---|
| 有 | 无 | 只有表格 |
| 有 | 有 | 先表格，后原尺寸比例大图 |
| 空 | 有 | 技术规格标题 + 规格图，**无静态表格** |
| 空 | 无 | 不显示空参数行；是否显示空区块按产品设计规范统一 |

**特别注意**：仅有一次 `setRows([])` 不够；保存 payload、Admin 重新加载、前端 display resolver 三层均不得回填默认值。CMS 文本空值应区分 `''` 与字段缺失；不要在 `||` fallback 时把刻意清空误判成“缺省”。

PDF 后台解析要求：

- `app/api/admin/product-specs/route.ts` 在服务端处理，不在浏览器 pdfjs worker 中解析。
- `lib/pdf-parse-loader.cjs` 通过 `pdf-parse/worker getData()` 内嵌 worker；`scripts/verify-pdf-worker.mjs` 验证。
- 结构化参数须一行一项，支持中英名称和值。保存前人工审核，禁止 AI 把产品技术数值编造出来。
- 规格图原图下载（分辨率保持原件；浏览器缩放≠重采样；切勿截断长图）；跨域 `download` 行为需实际浏览器验收。

## 4. 关于页/销售顾问模块

目标：`/about` 联系区域上半段为左侧联系表单、右侧公司/地图/导航；下方单独一行销售顾问卡片，桌面端可横向四列，移动端自然换行/纵向。涉及 `app/about/AboutContent.tsx`、`components/contact/ContactModule.tsx`、`ContactDetailsLayout.tsx`、`SalesContactCards.tsx`。不要把卡片塞进地图窄栏，也不要意外改坏 `/contact` 页默认布局。

## 5. 缓存/可靠性

[R] 代码中 Next Server fetch 的 `FRONTEND_REVALIDATE_SECONDS=300`、`STRAPI_FETCH_TIMEOUT_MS=5000`；`lib/cms-lkg-cache.ts` 将最后一次成功产品/案例/下载数据写入运行时 `.data/cms-cache/`。 [H] 故障时曾出现 `cache saved`、`fetch failed ... using last-known-good cache`。

- 生产环境 CMS 不可用时不应默默退回 demo Mock 数据；能用 LKG 时应标记降级状态。
- LKG 是临时显示保障，**不解决数据库压力根因**。
- 前台请求应去重、限制重试次数和并发；不要多个 SSR 路由同时无限刷新全部集合。
- `cache` 与 `ISR` 作用域、持久性不同；跨 PM2 重启的 LKG 文件应保证目录可写并且未被意外删除。
- 当 `401`、`500`、`502`、`503` 混合出现，必须记录是哪个 URL/调用者/是否带 Token/是否匿名；不可以只看单个状态码就断言根因。

## 6. 本地→生产验收闭环

1. 本地确认 `.env.local` 指向 **本地** Strapi（不要意外写入生产数据）。
2. Strapi schema 修改先在备份过的测试库验证，生成类型，启动 CMS。
3. `npx.cmd tsc --noEmit`、`npm.cmd run build`；PDF 变动再 `node scripts/verify-pdf-worker.mjs`。
4. 浏览器检查 4 组产品规格状态、系列筛选、导航、下载、产品图及双语。
5. 将代码通过 Git PR 同步，避免混用 `scp` 和 `git pull` 导致线上文件与仓库历史背离。
6. 生产备份并部署，确认 HTTP/API/PM2/日志，保存变更记录；真实订单/询盘/产品数据禁止被测试数据覆盖。

## 7. 接手必须特别注意的仓库差异

[R] 截至 2026-11-07，`main` 仍是 2026-07-23 版本，动态系列、规格图片、空表修复在 main 中并未完整体现。 [H] ECS 在后续月份的 `grep` 和编辑页截图确实出现过相应功能。因此必须先发现最新代码和 schema 再进行任何新开发；文档里的「已实现」是历史项目事实，**不等于当前 main 已实现**。
