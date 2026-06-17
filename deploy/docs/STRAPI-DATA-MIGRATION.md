# Strapi 数据迁移指南（SQLite → PostgreSQL）

将本地 Strapi 内容从 **SQLite** 迁移到阿里云 ECS 生产环境的 **PostgreSQL**。

> **适用项目：** dBsource-audio-site（Strapi 5.12.4）  
> **原则：** 使用 Strapi 官方 `export` / `import`，不要直接拷贝 `.db` 文件到 PostgreSQL。

---

## 迁移概览

```
┌─────────────────────┐         ┌──────────────────────────────┐
│ 本地开发机 (Windows) │         │ 阿里云 ECS (Ubuntu)           │
│                     │         │                              │
│ SQLite data.db      │ export  │ PostgreSQL                   │
│ data/cms/uploads/   │ ──────► │ Strapi (postgres)            │
│                     │  scp    │ cms/public/uploads/          │
└─────────────────────┘         └──────────────────────────────┘
```

| 数据类型 | 本地路径 | 迁移方式 |
|----------|----------|----------|
| 内容（产品、案例、配置等） | `D:\dbsource\data\cms\data.db` | `strapi export` → `strapi import` |
| 图片 / 媒体文件 | `D:\dbsource\data\cms\uploads\` | `scp` 复制目录 |

**GitHub 不含上述数据**，必须手动迁移。

---

## 前置条件

### 本地（导出端）

- [ ] 本地 Strapi 能正常启动（`D:\dbsource\dev.ps1`）
- [ ] `cms/.env` 指向 SQLite：`DATABASE_FILENAME=../../data/cms/data.db`
- [ ] Node.js 18–22 已安装
- [ ] 产品、案例、图片在本地显示正常

### 生产（导入端）

- [ ] ECS 已部署 Strapi，且 `cms/.env` 使用 **PostgreSQL**（见第 2 节）
- [ ] Strapi 至少成功 `npm run build` 并启动过一次（初始化空库表结构）
- [ ] 官网 `.env` 中 `NEXT_PUBLIC_USE_MOCK_DATA=false`

---

## 1. 从本地 Strapi 导出内容数据

### 1.1 推荐方案：内容 + 图片分开

| 方案 | 命令 | 优点 | 缺点 |
|------|------|------|------|
| **A（推荐）** | `--only content` | 导出包小、上传快、可断点续传 | 需单独传 uploads |
| B | 含 content + files | 一个包搞定 | 约 3GB，上传慢 |

### 1.2 使用脚本导出（推荐）

```powershell
cd D:\dbsource\dbsource-audio-site\deploy\scripts

# 方案 A：只导出内容（推荐）
.\export-local-data.ps1

# 方案 B：内容 + 图片一起导出
# .\export-local-data.ps1 -IncludeFiles
```

导出文件默认保存到：

```
D:\dbsource\data\exports\dbsource-YYYYMMDD-HHMMSS.tar.gz
```

### 1.3 手动导出

```powershell
cd D:\dbsource\dbsource-audio-site\cms

# 建议先停止 Strapi，保证 SQLite 快照一致
cd D:\dbsource
.\stop.ps1

$out = "D:\dbsource\data\exports\dbsource-manual"
New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null

# 只导出内容
npx strapi export --no-encrypt -f $out --only content
```

### 1.4 导出参数说明

| 参数 | 说明 |
|------|------|
| `--no-encrypt` | 不加密，便于传输（生产导入后仍安全） |
| `--only content` | 仅内容 + 结构，不含媒体文件 |
| `-f <路径>` | 输出文件名（不含扩展名），实际生成 `.tar.gz` |

### 1.5 导出成功标志

- 控制台无 Error
- `data\exports\` 下出现 `dbsource-*.tar.gz`
- 文件大小通常几 MB～几十 MB（不含图片时）

**【注意】** 不要把 `data.db`、`.env.local`、`strapi-api-token.txt` 上传到 GitHub 或公开网盘。

---

## 2. 在 ECS 创建 PostgreSQL 数据库和用户

生产环境 Strapi **必须使用 PostgreSQL**，不能直接把 SQLite 文件拷过去。

### 2.1 安装 PostgreSQL（若尚未安装）

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2.2 创建数据库和用户

SSH 登录 ECS 后执行（将 `你的强密码` 替换为实际密码，自行保管，**不要写入文档或 Git**）：

```bash
sudo -u postgres psql <<'SQL'
CREATE USER strapi WITH PASSWORD '你的强密码';
CREATE DATABASE strapi OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;
\q
SQL
```

验证连接：

```bash
psql -h 127.0.0.1 -U strapi -d strapi -c "SELECT version();"
# 按提示输入上面设置的密码
```

### 2.3 配置 Strapi 连接 PostgreSQL

编辑 `cms/.env`（Docker 部署用 `deploy/.env`，字段名略有不同）：

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=你的强密码
```

**Docker Compose 部署**时，数据库密码写在 `deploy/.env`：

```env
POSTGRES_DB=strapi
POSTGRES_USER=strapi
POSTGRES_PASSWORD=你的强密码
```

Strapi 容器会自动使用 `DATABASE_CLIENT=postgres`（见 `docker-compose.yml`）。

### 2.4 首次启动 Strapi（初始化空表）

在导入数据**之前**，先让 Strapi 连上 PostgreSQL 并建好表结构。

**PM2 部署：**

```bash
cd /var/www/dbsource/cms
npm ci
npm run build
pm2 restart dbsource-strapi
```

**Docker 部署：**

```bash
cd ~/dBsource/deploy
./scripts/deploy.sh
docker compose ps   # strapi、postgres 均为 running
```

此时数据库为空，属正常现象。

---

## 3. 把内容导入生产 Strapi

### 3.1 上传导出包到 ECS

在 Windows 开发机执行（将 `ECS_IP` 换成服务器公网 IP）：

```powershell
scp D:\dbsource\data\exports\dbsource-*.tar.gz root@ECS_IP:/root/
```

### 3.2 导入方式一：Docker 部署（推荐脚本）

```bash
cd ~/dBsource/deploy
chmod +x scripts/*.sh

./scripts/import-strapi-data.sh /root/dbsource-YYYYMMDD-HHMMSS.tar.gz
```

脚本会：复制包到 Strapi 容器 → 执行 `strapi import --force` → 清理临时文件。

### 3.3 导入方式二：PM2 裸机部署

```bash
cd /var/www/dbsource/cms

npx strapi import -f /root/dbsource-YYYYMMDD-HHMMSS.tar.gz --force
```

`--force` 表示非交互确认，覆盖已有内容。

### 3.4 导入后重启 Strapi

```bash
# PM2
pm2 restart dbsource-strapi

# Docker
cd ~/dBsource/deploy
docker compose restart strapi
```

### 3.5 配置 API Token（官网读取数据必需）

Import 会同步管理员账号，但建议**重新创建** API Token：

1. 打开 `https://cms.dbsourceaudio.com/admin`
2. 使用本地 Strapi **相同邮箱**登录
3. **Settings → API Tokens → Create new API Token**
4. 类型：**Full access**
5. 将 Token 写入环境变量（**不要提交到 Git**）：

```bash
# PM2：编辑 /var/www/dbsource/.env.production.local
STRAPI_API_TOKEN=粘贴Token

# Docker：编辑 deploy/.env
STRAPI_API_TOKEN=粘贴Token
```

6. 重启官网：

```bash
# PM2
pm2 restart dbsource-web

# Docker
docker compose restart web
```

### 3.6 导入失败常见处理

**报错：database already contains data**

```bash
# 使用 --force
npx strapi import -f /root/dbsource-*.tar.gz --force
```

**需要清空重来（会删除生产库所有数据）：**

```bash
# PM2 + 本机 PostgreSQL
sudo -u postgres psql -c "DROP DATABASE strapi;"
sudo -u postgres psql -c "CREATE DATABASE strapi OWNER strapi;"
cd /var/www/dbsource/cms && npm run build && pm2 restart dbsource-strapi
# 再执行 import

# Docker
cd ~/dBsource/deploy
docker compose down
docker volume rm deploy_postgres_data
docker compose up -d
# 等待 Strapi 启动后再 import
```

---

## 4. uploads 图片目录迁移

内容 import **不包含**图片文件时（`--only content`），必须单独迁移 `uploads`。

### 4.1 本地目录

```
D:\dbsource\data\cms\uploads\
```

约 4400 个文件、~2.8 GB。`cms/public/uploads` 是指向该目录的联接。

### 4.2 上传到 ECS

```powershell
scp -r D:\dbsource\data\cms\uploads root@ECS_IP:/root/uploads
```

大文件上传建议保持网络稳定；可使用 rsync（WSL）断点续传：

```bash
rsync -avz --progress /mnt/d/dbsource/data/cms/uploads/ root@ECS_IP:/root/uploads/
```

### 4.3 导入到 Strapi

**Docker 部署：**

```bash
cd ~/dBsource/deploy
./scripts/import-uploads.sh /root/uploads
docker compose restart strapi
```

目标路径（容器内）：`/opt/app/public/uploads/`

**PM2 部署：**

```bash
mkdir -p /var/www/dbsource/cms/public/uploads
cp -r /root/uploads/* /var/www/dbsource/cms/public/uploads/
pm2 restart dbsource-strapi
```

### 4.4 uploads 路径对照

| 环境 | uploads 物理路径 |
|------|------------------|
| 本地开发 | `D:\dbsource\data\cms\uploads\` |
| PM2 生产 | `/var/www/dbsource/cms/public/uploads/` |
| Docker 生产 | 卷 `strapi_uploads` → 容器 `/opt/app/public/uploads/` |

### 4.5 图片仍 404 时检查

- [ ] uploads 是否传完（对比文件数量）
- [ ] 是否复制到 Strapi 的 `public/uploads` 目录
- [ ] Strapi 是否已重启
- [ ] 官网 `NEXT_PUBLIC_CMS_URL` 是否指向 `https://cms.dbsourceaudio.com`
- [ ] 浏览器直接访问某张图：`https://cms.dbsourceaudio.com/uploads/xxx.jpg`

---

## 5. 迁移后验证清单

全部完成 import + uploads + Token 后，按下列项逐项检查。

### 5.1 Strapi 后台

| 检查项 | 操作 | 预期 |
|--------|------|------|
| 登录 | 打开 `cms.dbsourceaudio.com/admin` | 能用本地相同账号登录 |
| 产品数量 | Content Manager → Products | 约 **112** 条 |
| 案例数量 | Content Manager → Cases | 约 **14** 条 |
| 媒体库 | Media Library | 有大量图片记录 |
| 单条产品 | 打开任意产品 | 封面图、字段完整 |

### 5.2 官网前台

| 检查项 | URL | 预期 |
|--------|-----|------|
| 首页 | `/` | 正常，非 mock 占位内容 |
| 产品列表 | `/products` | 显示真实产品，约 112 个 |
| 产品详情 | `/products/任意ID` | 标题、参数、**图片正常** |
| 案例列表 | `/cases` | 有案例卡片 |
| 案例详情 | `/cases/任意ID` | 图片、文案完整 |
| 下载页 | `/downloads` | 文件列表正常（如有） |
| 联系页 | `/contact` | 表单可提交 |

### 5.3 内容后台（Next.js /admin）

| 检查项 | URL | 预期 |
|--------|-----|------|
| 登录 | `/admin/login` | 用 `ADMIN_TOKEN` 可登录 |
| 编辑产品 | `/admin/...` | 能读取、保存 |
| 上传图片 | 后台上传 | 成功，前台可见 |

### 5.4 API 抽查（可选）

```bash
# 将 YOUR_TOKEN 换成实际 Token，勿泄露
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  "https://cms.dbsourceaudio.com/api/products?pagination[pageSize]=1" | head -c 500
```

应返回 JSON，含 `data` 数组，而非 401/403。

### 5.5 同步状态接口（可选）

```bash
curl -s https://www.dbsourceaudio.com/api/sync/status
```

关注 `useMock` 应为 `false`，`cmsReachable` 应为 `true`。

### 5.6 验证通过标准

- [ ] 产品数量与本地一致（约 112）
- [ ] 案例数量与本地一致（约 14）
- [ ] 随机抽查 5 个产品图片正常
- [ ] 随机抽查 3 个案例图片正常
- [ ] 内容后台可编辑并保存
- [ ] 无 mock 占位数据

---

## 6. 完整操作顺序（速查）

```
① 本地 export-local-data.ps1
② ECS 创建 PostgreSQL 库和用户
③ ECS Strapi 配置 postgres 并首次启动
④ scp 导出包到 ECS
⑤ strapi import --force
⑥ scp uploads 到 ECS
⑦ 复制 uploads 到 Strapi public 目录
⑧ Strapi 后台创建 API Token → 写入环境变量
⑨ 重启 strapi + web
⑩ 按第 5 节逐项验证
```

---

## 7. 安全提醒

| 禁止操作 | 原因 |
|----------|------|
| 不要提交 `data.db`、`.sqlite` | 含全部业务数据 |
| 不要提交 `.env`、`.env.local` | 含 Token 和密码 |
| 不要提交 `uploads/` 到 Git | 体积大，且属资产 |
| 不要在文档/截图中暴露真实 Token | 会导致未授权访问 |
| 不要用 `pgloader` 直接迁 SQLite 表 | Strapi 关联结构易损坏 |

密钥与密码仅保存在：

- 服务器 `cms/.env` 或 `deploy/.env`
- 官网 `.env.production.local`
- 公司密码管理工具

---

## 8. 备选方案：Strapi Transfer（在线迁移）

适合两台 Strapi 网络互通、不想传文件时：

1. **本地** Strapi：Settings → Transfer Tokens → 生成 Push Token  
2. **生产** Strapi：Settings → Transfer Tokens → 生成 Pull Token  
3. 本地执行：

```powershell
cd D:\dbsource\dbsource-audio-site\cms
npx strapi transfer --to https://cms.dbsourceaudio.com --to-token <生产PullToken> --from-token <本地PushToken>
```

注意：数据量大时耗时长；uploads 仍需确保生产环境可访问。

---

## 9. 相关文档与脚本

| 文件 | 说明 |
|------|------|
| `deploy/scripts/export-local-data.ps1` | Windows 本地导出 |
| `deploy/scripts/import-strapi-data.sh` | Docker 环境导入 |
| `deploy/scripts/import-uploads.sh` | Docker 环境导入图片 |
| `deploy/docs/MIGRATE-SQLITE-TO-POSTGRES.md` | 迁移补充说明 |
| `deploy/docs/ECS-PM2-NGINX-DEPLOY.md` | PM2 部署 |
| `cms/.env.example` | Strapi 环境变量模板 |

---

> 文档版本：2025-06  
> 本地数据路径：`D:\dbsource\data\cms\`  
> 导出输出路径：`D:\dbsource\data\exports\`
