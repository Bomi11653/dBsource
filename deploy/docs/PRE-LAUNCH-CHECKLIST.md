# dBsource 上线检查清单

商业官网交付级优化后的 **上线前 / 切换后** 核对清单。适用于阿里云 ECS（Docker 或 PM2+Nginx）及本地预发布验证。

> 部署流程详见 [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) · DNS 切换详见 [VERCEL-TO-ALIYUN-CUTOVER.md](VERCEL-TO-ALIYUN-CUTOVER.md)

---

## 一、环境变量（生产必查）

在服务器 `.env.production.local`（或 `deploy/.env`）中确认：

| 变量 | 生产值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.dbsourceaudio.com` | SEO、sitemap、OG、JSON-LD 正式域名 |
| `CMS_URL` | `https://cms.dbsourceaudio.com` | 服务端拉取 Strapi |
| `NEXT_PUBLIC_CMS_URL` | 同上 | 前台图片 URL |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | 生产必须关闭 mock |
| `STRAPI_API_TOKEN` | 已填写 | 后台询盘、统计等私有 API |
| `ADMIN_TOKEN` | 强口令 | 简易后台登录；留空则免登录（勿用于生产） |
| `NEXT_PUBLIC_IMAGE_DOMAINS` | 按需 | 额外 CDN 域名，逗号分隔 |
| `NEXT_PUBLIC_ALLOW_CMS_SVG` | `true` 或留空 | 仅 CMS 域名可信时启用 SVG 远程图 |

- [ ] 所有必填项已填写，无 `localhost` 残留
- [ ] `.env` 未提交到 Git（已在 `.gitignore`）
- [ ] Strapi 与 Next 使用同一套 CMS 域名

---

## 二、构建与进程

```bash
cd dbsource-audio-site   # 或 ~/dBsource
npm ci
npm run build
```

- [ ] `npm run build` 无 TypeScript / ESLint 错误
- [ ] 静态页生成数量正常（产品 + 案例详情页）
- [ ] PM2 / Docker 中 `web` 与 `strapi`（或 `cms`）均为 running
- [ ] Nginx 已配置 `www` → 3000/3003，`cms` → 1337
- [ ] HTTPS 证书有效（`www` + `cms`）

---

## 三、CMS 与数据源

- [ ] Strapi 后台可登录：`https://cms.dbsourceaudio.com/admin`
- [ ] 产品、案例、下载数量与预期一致
- [ ] 图片 / 附件可正常加载（非 403 / 404）
- [ ] 前台 `/api/sync/status` 返回 `"dataSource": "strapi"`
- [ ] 后台 **系统状态** `/admin/status` 显示 CMS 在线、数据源为 Strapi
- [ ] 临时断开 CMS 时，前台仍可 fallback 到 mock（应急），状态页显示 `mock-fallback`

---

## 四、性能与缓存

- [ ] 首页 Hero：桌面 WebGL 正常；手机为 lite 动画（非卡顿 WebGL）
- [ ] 开启「减少动态效果」时 Hero 使用 lite 模式
- [ ] Hero 滚出视口后 CPU 占用下降（动画暂停）
- [ ] 前台 CMS 请求 ISR 缓存约 **300 秒**（改内容后最多 5 分钟生效）
- [ ] 后台 `/admin/*` 数据为实时（no-store）

---

## 五、后台安全

- [ ] 生产环境登录 Cookie 带 `Secure` + `SameSite=Strict`
- [ ] `/admin/login` 连续错误 8 次触发 429 限流
- [ ] 登录后可访问 `/admin`，未登录跳转登录页
- [ ] **退出登录** 按钮可用，调用 `/api/admin/logout`
- [ ] `robots.txt` 禁止 `/admin` 与 `/api/admin`
- [ ] `ADMIN_TOKEN` 非默认值、非空（生产）

---

## 六、图片安全

- [ ] `next.config.js` 未使用 `hostname: "**"`
- [ ] 产品 / 案例 CMS 图片正常显示
- [ ] 若需 SVG：仅 `NEXT_PUBLIC_ALLOW_CMS_SVG=true` 且 CMS 域名可信
- [ ] 无控制台 `Invalid src prop` 或图片优化域名报错

---

## 七、B 端询盘转化

### 产品详情页

- [ ] 顶部 CTA：**获取报价** / **联系工程师** / **下载资料**
- [ ] 移动端底部 sticky CTA 栏可见且不遮挡内容
- [ ] **推荐系统搭配** 区块有同系列/常配型号
- [ ] 报价链接带 `?product=型号` 参数

### AI 顾问

- [ ] 首页 AI 顾问可提问
- [ ] 推荐产品后显示 **联系工程师** 按钮

### 询盘后台

- [ ] `/contact` 提交询盘成功
- [ ] 后台询盘列表可见新记录
- [ ] 状态可选：**未处理 → 已联系 → 已报价 → 已成交 / 无效**
- [ ] 旧状态（已读、已确认等）仍可正常显示标签

---

## 八、SEO

- [ ] `https://www.dbsourceaudio.com/robots.txt` 含 sitemap 地址
- [ ] `https://www.dbsourceaudio.com/sitemap.xml` 含静态页 + 产品 + 案例 URL
- [ ] 产品详情页：独立 title / description，查看源代码含 `Product` JSON-LD
- [ ] 案例详情页：独立 title / description，查看源代码含 `CreativeWork` JSON-LD
- [ ] 分享链接 OG 预览正常（微信 / 钉钉可抽查）
- [ ] 百度 / Google 站长工具已提交 sitemap（可选）

---

## 九、核心页面冒烟测试

在 **桌面 Chrome** 与 **手机 Safari/微信内置浏览器** 各测一遍：

| 页面 | 检查项 |
|------|--------|
| `/` | Hero、导航、AI 顾问、页脚 |
| `/products` | 列表、筛选、搜索 |
| `/products/[id]` | 详情、CTA、推荐搭配、规格 |
| `/cases` | 列表、图片 |
| `/cases/[id]` | 详情、相关案例 |
| `/downloads` | 文件下载 |
| `/contact` | 表单提交 |
| `/configurator` | 选型计算 |
| `/admin` | 登录、仪表盘、各栏目编辑 |
| `/admin/status` | CMS 状态、数量统计 |

- [ ] 中英文切换正常
- [ ] 备案号、联系方式正确
- [ ] 无控制台红色报错（字体 CDN 超时可忽略）

---

## 十、DNS 切换当日（若从 Vercel 迁移）

- [ ] ECS 全量验证通过（用 hosts 或临时域名先测）
- [ ] 数据备份已完成（DB + uploads）
- [ ] `www` A 记录指向 ECS 公网 IP
- [ ] `cms` A 记录指向 ECS 公网 IP
- [ ] 旧 Vercel 项目保留 24–48h 可回滚
- [ ] 切换后复测第三节「CMS 与数据源」+ 第九节冒烟

---

## 十一、上线后 24 小时

- [ ] 访问日志无大量 5xx
- [ ] Strapi / Next 内存与 CPU 正常
- [ ] 询盘 webhook（若配置）收到测试消息
- [ ] GA4（若配置 `NEXT_PUBLIC_GA_ID`）有 PV 数据
- [ ] 磁盘空间充足（uploads 增长）

---

## 快速命令参考

```bash
# 本地预发布
npm run build && npm run start

# 同步状态 API
curl -s https://www.dbsourceaudio.com/api/sync/status | jq

# PM2
pm2 status
pm2 logs web --lines 50

# Docker
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f web --tail=50
```

---

**文档版本：** 与 commit「商业官网交付级优化」同步 · 2026-06
