# dBsource 环境变量、数据备份与安全边界

## 1. 为什么 GitHub 备份不等于整个网站备份

Git 仓库原则上只包含源码、结构定义、无密钥配置样例。真实运行依赖以下独立资产：PostgreSQL 数据、Strapi 上传媒体、`.env`/Token/密码/私钥、Nginx TLS 证书、PM2 进程配置、线上实际编译版本。如果只保存源码但没有生产数据库/媒体，无法完整恢复网站。

| 资产 | 通常位置 | 必须做什么 |
|---|---|---|
| 前端/后台源码 | 本地 `D:\dbsource\dbsource-audio-site` / ECS `/www/dBsource` | 三方版本核对后提交 Git；手工上传的差异先备份 |
| Strapi PostgreSQL | ECS 本机或数据库服务 | 定期加密备份、恢复演练、访问控制 |
| Strapi 媒体 uploads | `/www/dBsource/cms/public/uploads/` | 定期同步/备份，和数据快照保持一致 |
| 生产配置 | `/www/dBsource/.env.production*`、`cms/.env` | 私密备份、最小权限、不要提交 Git |
| Nginx / TLS | `/etc/nginx/`、`/etc/letsencrypt/` | 私密备份、证书续期监测 |
| PM2 配置 | 用户 PM2 home / 进程配置 | 记录真正的 `cwd`、`script`、`PORT`、`HOSTNAME`；不要只信旧例子 |
| CMS LKG 缓存 | `/www/dBsource/.data/cms-cache/`（若实际使用） | 可再生、不能代替正式数据；记录丢失后的降级策略 |

## 2. 关键环境变量（只写名字和作用，不写真实值）

**Next 服务端**：

```text
CMS_URL                  # 服务端访问 CMS，例如 http://127.0.0.1:1337
STRAPI_API_TOKEN         # 服务端 API token（不暴露浏览器）
ADMIN_TOKEN              # 自建后台口令（服务端）
REVALIDATE_SECRET        # 后台保存后触发缓存失效所用验证值
DEEPSEEK_API_KEY         # 若启用 AI 翻译/智能顾问等服务
NEXT_PUBLIC_USE_MOCK_DATA # 生产必须明确关闭 mock
NEXT_PUBLIC_CMS_URL      # 前端必要时使用的公共 CMS URL；前缀 NEXT_PUBLIC 会进入客户端包
NEXT_PUBLIC_SITE_URL     # 站点正式 HTTPS 域名
```

**Strapi 生产配置**：

```text
DATABASE_CLIENT=postgres
DATABASE_HOST / DATABASE_PORT / DATABASE_NAME / DATABASE_USERNAME
DATABASE_PASSWORD / DATABASE_URL / DATABASE_SSL
DATABASE_POOL_MIN / DATABASE_POOL_MAX / DATABASE_CONNECTION_TIMEOUT
APP_KEYS / API_TOKEN_SALT / ADMIN_JWT_SECRET / JWT_SECRET 等
```

`DATABASE_POOL_MAX`、连接超时等是**参数而非修复结论**；出现 Knex 连接池问题时先收集连接状态和慢查询证据，再做负载/容量调整。

## 3. 环境变量文件的优先级和历史教训

历史截图中，`.env.production` 与 `.env.production.local` 含不同 `STRAPI_API_TOKEN`。Next 会按其环境加载规则决定实际使用值，**不能**因为 Linux 下 `grep fileA fileB | tail -1` 输出某个 token，就断言生产 Next 使用该 token。

建议：管理清楚每个 key 的唯一权威来源；用部署平台/密码管理器管控；重启 PM2 时确认 `--update-env` 与实际启动方式，再用新日志和实际请求验证。**禁止** `grep STRAPI_API_TOKEN .env*` 将完整 token 输出到截图、客服或 GitHub。

## 4. Token 暴露处置

本聊天历史截图曾展示完整 Strapi API Token，应假设该 Token 已暴露。流程：确认有哪些环境依赖 → 建立权限最小的新 token → 在保密存储中替换所有实际使用位置 → 测试真实 API 200 → 废止旧 Token → 检查仓库内容和历史记录是否还有凭据。不要为修复 401 将所有内容类型改成公开写权限。

## 5. 备份与恢复演练的底线

- 备份须包含时间、DB 版本、Strapi schema 版本、媒体清单与校验值；备份文件不要进入公开 GitHub。
- 数据库恢复必须在隔离环境演练，验证产品记录、上传文件关联及正常登录。
- 数据库 schema 升级时，如果需要迁移数据，应明确正向迁移、回滚兼容性；不能仅回滚前端 Git commit。
- 多个项目/服务共享 PostgreSQL 时，重启 Postgres 会影响全部连接，必须事先审批、维护窗口、回滚预案。
