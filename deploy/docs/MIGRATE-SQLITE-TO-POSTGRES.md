# SQLite → PostgreSQL 数据迁移指南

将本地开发数据（`D:\dbsource\data\cms\`）迁移到阿里云 ECS 上的 Docker + PostgreSQL 生产环境。

## 数据概览

| 项目 | 本地路径 | 规模（参考） |
|------|----------|--------------|
| SQLite 数据库 | `D:\dbsource\data\cms\data.db` | 112 产品、14 案例等 |
| 媒体文件 | `D:\dbsource\data\cms\uploads\` | ~4400 文件、~2.8 GB |

GitHub **不包含**上述数据，必须手动迁移。

## 推荐方案：Strapi Export / Import

Strapi 5 官方支持跨数据库迁移（SQLite → PostgreSQL），比 `pgloader` 直接拷表更可靠，能正确处理内容类型、关联关系和媒体引用。

```
本地 SQLite (Strapi export)
        ↓  .tar.gz 导出包
ECS PostgreSQL (Strapi import)
        +
uploads 目录（可单独 scp，见下文）
```

### 方案 A：内容 + 图片分开（推荐，大文件更稳）

1. 导出时 **不含** 图片：`--only content`
2. 用 `scp` + `import-uploads.sh` 单独传 `uploads/`
3. 在 ECS 上 `strapi import` 导入内容

优点：导出包小、传输可断点续传、失败易重试。

### 方案 B：一键全量导出

导出时包含 `content` + `files`，一个包搞定。

缺点：~3 GB 压缩包，上传 ECS 较慢；中断需重传。

---

## 第一步：本地导出（Windows 开发机）

### 前置条件

- 本地 Strapi 能正常启动，且 `cms/.env` 指向 `DATABASE_FILENAME=../../data/cms/data.db`
- Node.js 18–22 已安装

### 使用脚本（推荐）

```powershell
cd D:\dbsource\dbsource-audio-site\deploy\scripts

# 方案 A：只导出内容（推荐）
.\export-local-data.ps1

# 方案 B：内容 + 图片一起导出
.\export-local-data.ps1 -IncludeFiles
```

导出文件默认保存到：`D:\dbsource\data\exports\dbsource-YYYYMMDD-HHMMSS.tar.gz`

### 手动导出

```powershell
cd D:\dbsource\dbsource-audio-site\cms

# 建议先停掉占用 1337 端口的 Strapi，避免 SQLite 写入冲突
# 在 D:\dbsource 执行: .\stop.ps1

$out = "D:\dbsource\data\exports\dbsource-manual"
New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null

# 方案 A
npx strapi export --no-encrypt -f $out --only content

# 方案 B（含图片，耗时长）
# npx strapi export --no-encrypt -f $out
```

> 默认会 gzip 压缩。若不要压缩加 `--no-compress`（文件更大、上传更慢，一般不推荐）。

---

## 第二步：上传到 ECS

将导出包传到服务器（替换 `ECS_IP`）：

```powershell
scp D:\dbsource\data\exports\dbsource-*.tar.gz root@ECS_IP:/root/
```

若采用方案 A，同时上传图片：

```powershell
scp -r D:\dbsource\data\cms\uploads root@ECS_IP:/root/uploads
```

---

## 第三步：ECS 上部署空环境

在 ECS 上确保 Docker 栈已启动（参见 [deploy/README.md](../README.md)）：

```bash
cd ~/dBsource/deploy
cp .env.example .env
nano .env    # 设置 POSTGRES_PASSWORD、域名、密钥
./scripts/deploy.sh
```

等待 `docker compose ps` 显示 `postgres`、`strapi`、`web`、`nginx` 均为 running。

**此时不要**在 Strapi 后台手动录入产品——下一步 import 会写入全部内容。

---

## 第四步：导入到 PostgreSQL

### 使用脚本

```bash
cd ~/dBsource/deploy
chmod +x scripts/*.sh

# 导入 Strapi 导出包
./scripts/import-strapi-data.sh /root/dbsource-20250615-120000.tar.gz

# 方案 A：若导出时未含图片，再导入 uploads
./scripts/import-uploads.sh /root/uploads
```

### 手动导入

```bash
cd ~/dBsource/deploy

EXPORT=/root/dbsource-20250615-120000.tar.gz
CID=$(docker compose ps -q strapi)

docker cp "$EXPORT" "$CID:/tmp/strapi-import.tar.gz"
docker compose exec strapi npx strapi import -f /tmp/strapi-import.tar.gz --force

# 方案 A 补传图片
docker cp /root/uploads/. "$CID:/opt/app/public/uploads/"
docker compose restart strapi
```

`--force` 表示非交互确认，适合脚本化部署。

---

## 第五步：配置 Token 与重启网站

Import 会带入 SQLite 里的管理员账号和 API Token 记录，但 **生产环境建议重新生成 API Token**：

1. 打开 `https://cms.dbsourceaudio.com/admin`
2. 使用本地相同的管理员邮箱登录（import 会同步账号）
3. **Settings → API Tokens** → 创建 **Full access** Token
4. 写入 `deploy/.env` 的 `STRAPI_API_TOKEN=`
5. 重启网站容器：

```bash
cd ~/dBsource/deploy
docker compose restart web
```

或在开发机用脚本刷新本地 Token（仅本地）：

```powershell
cd D:\dbsource\dbsource-audio-site\cms
$env:STRAPI_ADMIN_EMAIL="你的邮箱"
$env:STRAPI_ADMIN_PASSWORD="你的密码"
node scripts/refresh-api-token.mjs
```

---

## 第六步：验证清单

| 检查项 | 命令 / 地址 | 预期 |
|--------|-------------|------|
| Strapi 健康 | `docker compose logs strapi --tail 50` | 无报错 |
| 产品数量 | 打开 `https://www.dbsourceaudio.com/products` | 显示 ~112 个产品 |
| 案例 | `/cases` | 14 个案例 |
| 图片 | 任意产品详情页 | 图片正常加载 |
| 内容后台 | `/admin/login` | 可登录、可编辑 |
| API | `curl -H "Authorization: Bearer $TOKEN" https://cms.../api/products` | 返回 JSON |

---

## 常见问题

### import 报错 “database already contains data”

- 使用 `--force`
- 或清空 PostgreSQL 后重来：

```bash
cd ~/dBsource/deploy
docker compose down
docker volume rm deploy_postgres_data   # 会删除库内所有数据！
docker compose up -d
# 等待 Strapi 初始化后再 import
```

### 图片 404，但产品有数据

- 导出用了 `--only content` 却忘记 `import-uploads.sh`
- 或 `uploads` 路径不对：应复制到容器内 `/opt/app/public/uploads/`

### 网站仍显示 mock 数据

检查 `deploy/.env`：

```
NEXT_PUBLIC_USE_MOCK_DATA=false
STRAPI_API_TOKEN=（有效 Token）
CMS_URL=https://cms.dbsourceaudio.com
```

然后 `docker compose up -d --build web`。

### 管理员无法登录

Import 会同步 SQLite 中的 admin 用户。用本地 Strapi 相同的邮箱密码登录。若忘记密码，在容器内重置：

```bash
docker compose exec strapi npx strapi admin:reset-user-password --email=你的邮箱 --password=新密码
```

### 能否用 pgloader 直接迁 SQLite？

不推荐。Strapi 表结构含 JSON 字段、多态关联、i18n、draft/publish，直接 SQL 迁移容易缺字段或关联断裂。仅当 export/import 失败时才考虑官方 Transfer 或联系技术支持。

---

## 备选：Strapi Transfer（在线迁移）

适合 ECS 已有一个空 Strapi、且网络可达的情况：

1. **本地** Strapi：Settings → Transfer Tokens → 生成 **Push** Token
2. **生产** Strapi：Settings → Transfer Tokens → 生成 **Pull** Token
3. 本地执行：

```powershell
cd D:\dbsource\dbsource-audio-site\cms
npx strapi transfer --to https://cms.dbsourceaudio.com --to-token <生产PULL_TOKEN> --from-token <本地PUSH_TOKEN>
```

注意：需本地 Strapi 运行中；大文件传输时间长；防火墙需放行 ECS 1337 端口（Transfer 用 HTTPS API，非 SSH）。

---

## 迁移顺序总览

```mermaid
flowchart LR
  A[本地 SQLite + uploads] --> B[strapi export]
  B --> C[scp 到 ECS]
  C --> D[docker compose up]
  D --> E[strapi import --force]
  E --> F[import-uploads 可选]
  F --> G[配置 API Token]
  G --> H[验证官网数据]
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `deploy/scripts/export-local-data.ps1` | Windows 本地导出 |
| `deploy/scripts/import-strapi-data.sh` | ECS 导入导出包 |
| `deploy/scripts/import-uploads.sh` | ECS 导入 uploads 目录 |
| `deploy/README.md` | 整体部署文档 |
