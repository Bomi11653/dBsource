# 阿里云 ECS + Ubuntu + Nginx + PM2 部署文档

> 适用项目：`dbsource-audio-site`（东莞新声电子官网）  
> 部署方式：裸机 Node.js + PM2 进程管理 + Nginx 反向代理  
> **本文档不修改业务代码，仅描述部署方案。**

---

## 一、项目检查结果

### 1. 框架类型

| 项目 | 结论 |
|------|------|
| **官网前端** | **Next.js 14.2.28**（App Router，非 Vite） |
| **CMS 后端** | **Strapi 5.12.4**（`cms/` 子目录，独立 Node 应用） |
| **是否 Vite** | 否。主站无 `vite.config`；仅 Strapi 管理面板内部使用 Vite |

官网是 **SSR/SSG 混合的 Next.js 全栈应用**，包含：

- 服务端 API 路由（`/api/admin/*`、`/api/leads`、`/api/ai/*` 等）
- Middleware（后台鉴权）
- 动态页面与静态预渲染（构建时生成 91 个页面）

**不能**当作纯静态 `dist` 网站部署，必须通过 Node.js 运行 `next start`（或 standalone `server.js`）。

### 2. package.json scripts 检查

**官网根目录 `package.json`：**

| 脚本 | 命令 | 状态 |
|------|------|------|
| `build` | `next build` | ✅ 存在 |
| `start` | `next start -p 3003 -H 127.0.0.1` | ✅ 存在 |
| `dev` | `next dev -p 3003 -H 127.0.0.1` | 开发用 |

**CMS 子目录 `cms/package.json`：**

| 脚本 | 命令 | 状态 |
|------|------|------|
| `build` | `strapi build` | ✅ 存在 |
| `start` | `strapi start` | ✅ 存在 |
| `develop` | `strapi develop` | 开发用 |

### 3. 生产构建验证

已在本地执行 `npm run build`，**构建成功**：

- Next.js 14.2.28 编译通过
- TypeScript / Lint 检查通过
- 生成 91 个静态页面 + 多个动态 API 路由
- `next.config.js` 已配置 `output: "standalone"`（可选 standalone 启动方式）

> `npm run start` 需在 `build` 之后运行。本地 `start` 监听 `127.0.0.1:3003`，适合 Nginx 反代。

### 4. 是否适合部署到阿里云 ECS

**结论：适合。**

| 维度 | 评估 |
|------|------|
| 框架兼容性 | Next.js + Strapi 均支持 Linux + Node.js |
| 构建脚本 | 具备完整 `build` / `start` |
| 生产构建 | 已验证 `npm run build` 可通过 |
| 运行要求 | 需 Node.js 18–20（推荐 20 LTS） |
| 依赖服务 | 生产需 **PostgreSQL**（Strapi）+ **Strapi 进程** |
| 备案 | 域名 `dbsourceaudio.com` 需解析到大陆 ECS |

**注意：** 官网单独部署不够，必须同时部署 **Strapi CMS**，否则只能显示 mock 数据。

---

## 二、架构说明

```
Internet
   │
   ▼
Nginx (:80 / :443)
   ├── www.dbsourceaudio.com  ──►  PM2: dbsource-web   (Next.js :3003)
   └── cms.dbsourceaudio.com  ──►  PM2: dbsource-strapi (Strapi  :1337)
                                          │
                                          ▼
                                    PostgreSQL (:5432)
```

| 服务 | 目录 | 端口 | PM2 名称 |
|------|------|------|----------|
| 官网 + 内容后台 | `/var/www/dbsource` | 3003 | `dbsource-web` |
| Strapi CMS | `/var/www/dbsource/cms` | 1337 | `dbsource-strapi` |
| 数据库 | 本机或 RDS | 5432 | — |

---

## 三、服务器环境安装（Ubuntu 22.04）

以 root 或 sudo 用户登录 ECS 后执行：

### 3.1 系统更新

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw
```

### 3.2 安装 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # 应显示 v20.x
npm -v
```

### 3.3 安装 PM2

```bash
sudo npm install -g pm2
pm2 -v
```

### 3.4 安装 PostgreSQL（Strapi 生产数据库）

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

创建数据库和用户：

```bash
sudo -u postgres psql <<'SQL'
CREATE USER strapi WITH PASSWORD '你的强密码';
CREATE DATABASE strapi OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;
SQL
```

### 3.5 防火墙

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> 安全组也需开放 **80、443**；**不要**对公网开放 3003、1337、5432。

### 3.6 创建部署目录

```bash
sudo mkdir -p /var/www/dbsource
sudo chown -R $USER:$USER /var/www/dbsource
```

---

## 四、项目上传方式

任选一种：

### 方式 A：Git 克隆（推荐）

```bash
cd /var/www
git clone https://github.com/Bomi11653/dBsource.git dbsource
cd dbsource
```

> 仓库根目录即 Next.js 项目；`cms/` 为 Strapi 子项目。

### 方式 B：本地上传 zip

```powershell
# Windows 开发机（排除 node_modules）
cd D:\dbsource\dbsource-audio-site
# 打包后 scp 上传
scp dbsource.zip root@ECS_IP:/var/www/
```

```bash
# ECS 上
cd /var/www
unzip dbsource.zip -d dbsource
```

### 方式 C：rsync 增量同步

```bash
rsync -avz --exclude node_modules --exclude .next \
  ./dbsource-audio-site/ root@ECS_IP:/var/www/dbsource/
```

**不要上传：** `node_modules`、`.next`、`data.db`、本地 `uploads`（数据单独迁移，见文末）。

---

## 五、环境变量配置

### 5.1 官网 `.env.production.local`

复制模板并编辑（**不要提交真实值到 Git**）：

```bash
cp /var/www/dbsource/.env.production.local.example /var/www/dbsource/.env.production.local
nano /var/www/dbsource/.env.production.local
```

```env
# 正式域名
NEXT_PUBLIC_SITE_URL=https://www.dbsourceaudio.com
CMS_URL=https://cms.dbsourceaudio.com
NEXT_PUBLIC_CMS_URL=https://cms.dbsourceaudio.com
NEXT_PUBLIC_USE_MOCK_DATA=false

# Strapi API Token（Strapi 后台创建后填入）
STRAPI_API_TOKEN=你的FullAccessToken

# 内容后台 /admin/login 密码
ADMIN_TOKEN=你的强密码

# 可选
DEEPSEEK_API_KEY=
LEAD_WEBHOOK_URL=
NEXT_PUBLIC_GA_ID=
```

> **重要：** 修改 `NEXT_PUBLIC_*` 后必须重新 `npm run build`；仅改 `STRAPI_API_TOKEN` 时 `pm2 restart dbsource-web` 即可。

### 5.2 Strapi `cms/.env`

```bash
nano /var/www/dbsource/cms/.env
```

```env
HOST=0.0.0.0
PORT=1337

# 生产必须用 PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=你的强密码

# 密钥（openssl rand -base64 16 各生成一个）
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=随机值
ADMIN_JWT_SECRET=随机值
TRANSFER_TOKEN_SALT=随机值
JWT_SECRET=随机值
```

生成密钥：

```bash
openssl rand -base64 16
```

---

## 六、安装依赖与构建

### 6.1 官网（Next.js）

```bash
cd /var/www/dbsource
npm ci
npm run build
```

构建成功后生成 `.next/` 目录。

验证构建（可选，前台测试后 Ctrl+C 停止）：

```bash
npm run start
# 另开终端: curl -I http://127.0.0.1:3003
```

### 6.2 Strapi CMS

```bash
cd /var/www/dbsource/cms
npm ci
npm run build
```

首次启动前需导入数据，或启动后在 `https://cms.dbsourceaudio.com/admin` 创建管理员。

---

## 七、PM2 启动

### 7.1 创建 PM2 配置文件

```bash
nano /var/www/dbsource/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: "dbsource-web",
      cwd: "/var/www/dbsource",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3003 -H 127.0.0.1",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
    },
    {
      name: "dbsource-strapi",
      cwd: "/var/www/dbsource/cms",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
```

### 7.2 启动并设置开机自启

```bash
cd /var/www/dbsource
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# 按提示执行输出的 sudo 命令
```

### 7.3 常用 PM2 命令

```bash
pm2 status
pm2 logs dbsource-web
pm2 logs dbsource-strapi
pm2 restart dbsource-web
pm2 restart all
pm2 stop all
```

### 7.4 可选：Standalone 启动方式

项目已配置 `output: "standalone"`。若希望减少内存占用，可改用：

```bash
# build 后
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cd .next/standalone
PORT=3003 HOSTNAME=127.0.0.1 node server.js
```

PM2 中把 `script` 改为 `.next/standalone/server.js` 即可。默认 `npm run start` 方式更简单，**推荐先用默认方式**。

---

## 八、Nginx 配置

### 8.1 官网（www）与根域名跳转

根域名 `dbsourceaudio.com` 统一跳转到 `www`；`www` 反代 Next.js（3003）。

```bash
sudo nano /etc/nginx/sites-available/dbsource-web
```

```nginx
# 根域名 → www
server {
    listen 80;
    server_name dbsourceaudio.com;
    return 301 http://www.dbsourceaudio.com$request_uri;
}

# 官网
server {
    listen 80;
    server_name www.dbsourceaudio.com;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 8.2 Strapi CMS（cms 子域）

```bash
sudo nano /etc/nginx/sites-available/dbsource-cms
```

```nginx
server {
    listen 80;
    server_name cms.dbsourceaudio.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 8.3 启用配置

```bash
sudo ln -sf /etc/nginx/sites-available/dbsource-web /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/dbsource-cms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 九、域名解析说明

在阿里云域名控制台 → `dbsourceaudio.com` → 解析设置：

| 主机记录 | 记录类型 | 记录值 | TTL |
|----------|----------|--------|-----|
| `www` | A | ECS 公网 IP | 600 |
| `@` | A | ECS 公网 IP | 600 |
| `cms` | A | ECS 公网 IP | 600 |

说明：

- **备案网站**需解析到**大陆** ECS IP（粤ICP备2025373674号）
- 切换 DNS 前可用 **hosts 文件**预发布测试
- 从 Vercel 迁移时，将 CNAME 改为 A 记录指向 ECS

验证解析：

```bash
dig www.dbsourceaudio.com +short
dig cms.dbsourceaudio.com +short
```

---

## 十、HTTPS 配置说明

### 10.1 申请证书（阿里云免费 DV）

1. [SSL 证书服务](https://yundun.console.aliyun.com/?p=cas) 申请免费证书
2. 域名：`www.dbsourceaudio.com`、`cms.dbsourceaudio.com`
3. DNS 验证通过后下载 **Nginx** 格式

### 10.2 安装 Certbot（Let's Encrypt 备选）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.dbsourceaudio.com -d dbsourceaudio.com
sudo certbot --nginx -d cms.dbsourceaudio.com
```

### 10.3 手动配置 HTTPS（阿里云证书）

将证书放到：

```
/etc/nginx/ssl/www/fullchain.pem
/etc/nginx/ssl/www/privkey.pem
/etc/nginx/ssl/cms/fullchain.pem
/etc/nginx/ssl/cms/privkey.pem
```

**官网（www + 根域名跳转）HTTPS：**

```nginx
# HTTP → HTTPS
server {
    listen 80;
    server_name www.dbsourceaudio.com dbsourceaudio.com;
    return 301 https://www.dbsourceaudio.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dbsourceaudio.com;
    ssl_certificate     /etc/nginx/ssl/www/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/www/privkey.pem;
    return 301 https://www.dbsourceaudio.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.dbsourceaudio.com;

    ssl_certificate     /etc/nginx/ssl/www/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/www/privkey.pem;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Strapi CMS（cms 子域）HTTPS：**

将以下内容写入 `/etc/nginx/sites-available/dbsource-cms`（或合并到同一文件）：

```nginx
server {
    listen 80;
    server_name cms.dbsourceaudio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cms.dbsourceaudio.com;

    ssl_certificate     /etc/nginx/ssl/cms/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/cms/privkey.pem;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 十一、首次上线检查清单

```
□ Node 20 + PM2 + Nginx + PostgreSQL 已安装
□ 代码已上传到 /var/www/dbsource
□ .env.production.local 和 cms/.env 已配置
□ npm run build（官网）成功
□ npm run build（cms）成功
□ pm2 status 两个进程均为 online
□ Strapi 数据已导入（export/import + uploads）
□ STRAPI_API_TOKEN 已填入并 pm2 restart dbsource-web
□ Nginx 反代 www / cms 正常
□ HTTPS 证书已配置
□ DNS 已指向 ECS
□ 产品/案例/图片/后台 全部验证通过
```

---

## 十二、日常更新发布

```bash
cd /var/www/dbsource
git pull origin main

# 官网
npm ci
npm run build
pm2 restart dbsource-web

# 若 cms 有变更
cd cms && npm ci && npm run build
pm2 restart dbsource-strapi
```

仅 Strapi 后台改内容：**无需 rebuild**，刷新即可。

---

## 十三、常见报错与解决方法

| 报错 / 现象 | 原因 | 解决方法 |
|-------------|------|----------|
| `npm run build` 失败 TypeScript 错误 | 代码或依赖问题 | 本地先 `npm run build` 通过再部署；`npm ci` 确保 lock 一致 |
| `EADDRINUSE :3003` | 端口被占用 | `pm2 stop dbsource-web` 或 `lsof -i:3003` 查进程 |
| 网站无产品，显示 mock | `USE_MOCK_DATA=true` 或无 Token | `.env.production.local` 设 `false` 并填 `STRAPI_API_TOKEN`，`pm2 restart` |
| 后台 `/admin` 401 | API Token 无效 | Strapi 重新生成 Token，更新 env 并重启 web |
| 图片 404 | uploads 未迁移 | 将 `data/cms/uploads` 复制到 `cms/public/uploads` |
| Strapi 启动失败 `ECONNREFUSED 5432` | PostgreSQL 未运行 | `sudo systemctl start postgresql` |
| Strapi `better-sqlite3` 报错 | 生产用了 SQLite | `cms/.env` 改 `DATABASE_CLIENT=postgres` |
| Nginx 502 Bad Gateway | PM2 进程未启动 | `pm2 status`；`pm2 logs` 查错 |
| Nginx 413 Request Entity Too Large | 上传文件过大 | 增大 `client_max_body_size` |
| `sharp` 安装失败 | 缺少系统库 | `sudo apt install -y libvips-dev` 后重装 |
| 内存不足 build 被杀 | ECS 内存小 | 加 swap 或升级到 4核8G：`sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| HTTPS 混合内容警告 | CMS URL 用了 http | 环境变量统一用 `https://` |
| 切 DNS 后仍看到旧站 | DNS 缓存 | 等 TTL / `ipconfig /flushdns` / 手机 4G 测试 |

### 查看日志

```bash
pm2 logs dbsource-web --lines 100
pm2 logs dbsource-strapi --lines 100
sudo tail -f /var/log/nginx/error.log
```

---

## 十四、数据迁移（本地 → 生产）

GitHub 不含业务数据，需从开发机迁移：

```powershell
# Windows 导出
cd D:\dbsource\dbsource-audio-site\deploy\scripts
.\export-local-data.ps1
scp D:\dbsource\data\exports\dbsource-*.tar.gz root@ECS_IP:/root/
scp -r D:\dbsource\data\cms\uploads root@ECS_IP:/var/www/dbsource/cms/public/
```

```bash
# ECS 导入（Strapi 需先 build 并首次 start 初始化库表）
cd /var/www/dbsource/cms
npx strapi import -f /root/dbsource-*.tar.gz --force
pm2 restart dbsource-strapi
```

详细步骤：[MIGRATE-SQLITE-TO-POSTGRES.md](MIGRATE-SQLITE-TO-POSTGRES.md)

---

## 十五、PM2 方案 vs Docker 方案

本项目仓库同时提供两套部署方式：

| 对比 | PM2（本文档） | Docker（deploy/docker-compose.yml） |
|------|---------------|-------------------------------------|
| 上手难度 | 较低，传统运维熟悉 | 需 Docker 知识 |
| 进程隔离 | 较弱 | 容器隔离 |
| 环境一致性 | 依赖手动装 Node/PG | 镜像统一 |
| 适用场景 | 单台 ECS、快速上线 | 企业级、易扩展 |

两种方式可任选其一，**不要混用同一端口**。

---

## 十六、相关文档

| 文档 | 说明 |
|------|------|
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | 全流程总览 |
| [MIGRATE-SQLITE-TO-POSTGRES.md](MIGRATE-SQLITE-TO-POSTGRES.md) | 数据迁移 |
| [VERCEL-TO-ALIYUN-CUTOVER.md](VERCEL-TO-ALIYUN-CUTOVER.md) | Vercel 切换 |
| [../README.md](../README.md) | Docker Compose 部署 |
