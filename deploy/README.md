# dBsource 阿里云 ECS 企业级部署

Docker Compose 一键部署：**Next.js 官网 + 内容后台 + Strapi + PostgreSQL + Nginx**。

## 架构

```
Internet → Nginx (:80/:443)
            ├── www.dbsourceaudio.com  → web (Next.js :3000)
            └── cms.dbsourceaudio.com  → strapi (:1337) → PostgreSQL
```

## 服务器要求

- 阿里云 ECS：**4核8G** 起（Ubuntu 22.04 / Alibaba Cloud Linux）
- 已开放安全组：**80、443**
- 已安装 [Docker](https://docs.docker.com/engine/install/) + Docker Compose v2
- 域名 DNS 已指向 ECS 公网 IP

## 一键部署

```bash
# 1. 克隆代码
git clone https://github.com/Bomi11653/dBsource.git
cd dBsource/deploy

# 2. 配置环境变量
cp .env.example .env
nano .env   # 修改密码、域名、密钥

# 3. 修改 Nginx 域名（如不是 dbsourceaudio.com）
nano nginx/conf.d/dbsource.conf

# 4. 部署
chmod +x scripts/*.sh
./scripts/deploy.sh
```

## 访问地址

| 用途 | 地址 |
|------|------|
| 官网 | `http://www.dbsourceaudio.com` |
| 内容后台 | `http://www.dbsourceaudio.com/admin/login` |
| Strapi | `http://cms.dbsourceaudio.com/admin` |

## 首次配置 Strapi

1. 打开 `http://cms.dbsourceaudio.com/admin` 创建管理员
2. Settings → API Tokens → 创建 **Full access** Token
3. 将 Token 填入 `.env` 的 `STRAPI_API_TOKEN`
4. 重启网站：`docker compose restart web`

```bash
docker compose restart web
```

## 导入本地数据

GitHub **不包含**产品和图片，需从开发机迁移：

### 图片（uploads）

```bash
# 在 ECS 上，从本机 scp 上传后执行：
./scripts/import-uploads.sh /root/uploads
```

或从 Windows 开发机：

```powershell
scp -r D:\dbsource\data\cms\uploads root@你的ECS_IP:/root/uploads
```

### 数据库（SQLite → PostgreSQL）

1. 在 Strapi 后台使用 **Settings → Transfer Tokens** 导出/导入，或
2. 使用 Strapi CLI `strapi export` / `strapi import`，或
3. 联系技术支持用 `pgloader` 从 SQLite 迁移

本地数据路径：`D:\dbsource\data\cms\data.db`

## HTTPS（阿里云免费证书）

1. 在阿里云 SSL 证书服务申请免费 DV 证书
2. 下载 Nginx 格式，放到：
   ```
   deploy/nginx/certs/www/fullchain.pem
   deploy/nginx/certs/www/privkey.pem
   deploy/nginx/certs/cms/fullchain.pem
   deploy/nginx/certs/cms/privkey.pem
   ```
3. 取消 `nginx/conf.d/dbsource.conf` 中 HTTPS 块的注释
4. `docker compose restart nginx`

## 常用命令

```bash
cd dBsource/deploy

docker compose ps              # 状态
docker compose logs -f web       # 网站日志
docker compose logs -f strapi    # Strapi 日志
docker compose restart web       # 重启网站
docker compose down              # 停止
docker compose up -d --build     # 更新代码后重新构建
```

## 更新发布

```bash
cd dBsource
git pull origin main
cd deploy
docker compose build
docker compose up -d
```

## 环境变量说明

见 `.env.example` 完整列表。生产必改项：

- `POSTGRES_PASSWORD`
- `APP_KEYS` / `JWT_SECRET` 等 Strapi 密钥
- `ADMIN_TOKEN`（内容后台密码）
- `STRAPI_API_TOKEN`（Strapi API Token）

生成随机密钥：

```bash
openssl rand -base64 16
```

## 故障排查

| 问题 | 处理 |
|------|------|
| 网站无产品数据 | 检查 `STRAPI_API_TOKEN`、`USE_MOCK_DATA=false`、Strapi 是否运行 |
| 后台 401 | 重新生成 API Token 并 `docker compose restart web` |
| 上传失败 | 检查 Nginx `client_max_body_size`、Strapi 磁盘空间 |
| 构建失败 | `docker compose build --no-cache` |
