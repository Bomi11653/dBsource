# dBsource 部署交接包（给 ChatGPT / 协作助手）

> **用途：** 把本文整份复制给 ChatGPT，让它在你当前进度基础上继续指导 ECS 部署。  
> **项目：** 东莞新声电子 dBsource 专业音响品牌官网  
> **GitHub：** https://github.com/Bomi11653/dBsource  
> **部署方式：** 阿里云 ECS + Ubuntu 22.04 + **PM2 + Nginx**（非 Docker）  
> **文档日期：** 2026-06-21

---

## 一、给 ChatGPT 的开场说明（可直接复制）

```
我是 dBsource 官网项目负责人，已在阿里云 ECS 上完成部分部署。
请根据下方「当前进度」和「待办清单」，逐步给我 Linux 命令，
路径以 /www/dBsource 为准，不要让我改业务代码。
优先完成：Strapi + PostgreSQL → 导入本地数据包 → uploads 图片 → API Token → 域名 HTTPS。
每次只给 1～2 步，等我反馈结果再继续。
```

---

## 二、系统架构（必须同时运行 3 块）

```
Internet
   │
   ▼
Nginx (:80 / :443)
   ├── www.dbsourceaudio.com  ──►  PM2: dbsource-web   (Next.js :3003)
   └── cms.dbsourceaudio.com  ──►  PM2: dbsource-strapi (Strapi  :1337)
                                          │
                                          ▼
                                    PostgreSQL (:5432，仅本机)
```

| 组件 | 作用 | 生产地址 |
|------|------|----------|
| **Next.js 官网** | 前台 + `/admin` 内容后台 | https://www.dbsourceaudio.com |
| **Strapi CMS** | 产品/案例/下载数据 API | https://cms.dbsourceaudio.com/admin |
| **PostgreSQL** | Strapi 生产数据库 | 127.0.0.1:5432，不对公网 |
| **uploads/** | 图片/附件（约 3GB） | 在 `cms/public/uploads/` |

**重要：** GitHub 只有代码，**没有产品和图片**。必须从 Windows 开发机上传数据包。

---

## 三、ECS 服务器信息

| 项目 | 值 |
|------|-----|
| 公网 IP | **47.119.181.44** |
| 地域 | 华南1（深圳） |
| 规格 | ecs.e-c1m2.xlarge · 4核 8G |
| 系统 | Ubuntu 22.04 64位 |
| 系统盘 | 80GB |
| 带宽 | 5Mbps |
| 登录 | SSH 密钥对 `dbsource01-01.pem` |
| 备案 | 粤ICP备2025373674号 |
| 正式域名 | www.dbsourceaudio.com / cms.dbsourceaudio.com |

**不要用：** 同一账号下旧的 Windows 北京 ECS（39.107.124.151）。

---

## 四、服务器目录与路径（实际使用）

| 路径 | 说明 |
|------|------|
| `/www/dBsource` | Git 克隆的项目根目录（Next.js） |
| `/www/dBsource/cms` | Strapi 5.12.4 |
| `/www/dBsource/.env.production.local` | 官网生产环境变量（勿提交 Git） |
| `/www/dBsource/cms/.env` | Strapi 环境变量 |
| `/www/dBsource/ecosystem.config.js` | PM2 配置 |
| `/www/dBsource/cms/public/uploads/` | Strapi 媒体目录（导入图片目标） |

> 官方文档示例路径为 `/var/www/dbsource`，**本服务器实际为 `/www/dBsource`**，所有命令请替换。

---

## 五、当前部署进度（截至 2026-06-21）

### ✅ 已完成

| 步骤 | 状态 |
|------|------|
| ECS 购买（Ubuntu 4C8G 深圳） | ✅ |
| Node 20 / npm / PM2 / Nginx 已安装 | ✅ |
| GitHub 项目已克隆 | ✅ `/www/dBsource` |
| `npm install` 成功 | ✅ |
| `npm run build` 成功 | ✅ |
| PM2 已启动 `dbsource-web` | ✅ |
| Nginx 已反代到 3003 | ✅ |
| 安全组已放行 80 / 443 | ✅ |
| 用 IP 可访问 | ✅ http://47.119.181.44 |

### ☐ 待完成（按优先级）

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | PostgreSQL 安装 + 建库 | Strapi 生产不能用 SQLite |
| P0 | `cms/.env` 配置 PostgreSQL | 见下文模板 |
| P0 | `cd /www/dBsource/cms && npm ci && npm run build` | Strapi 构建 |
| P0 | PM2 启动 `dbsource-strapi` | 目前可能只有 web，缺 strapi |
| P0 | Nginx 增加 `cms.dbsourceaudio.com` → 1337 | CMS 子域名 |
| P0 | **上传并导入本地数据包** | 见第六节 |
| P0 | **上传 uploads 文件夹（约 3GB）** | 见第七节 |
| P1 | Strapi 创建 API Token → 填入 `STRAPI_API_TOKEN` | 否则前台无真实数据 |
| P1 | 确认 `NEXT_PUBLIC_USE_MOCK_DATA=false` 并 **重新 build** | |
| P1 | 域名 A 记录 → 47.119.181.44 | www / @ / cms |
| P2 | HTTPS（Certbot 或阿里云证书） | www + cms |
| P2 | 上线检查 | 见 `PRE-LAUNCH-CHECKLIST.md` |

---

## 六、本地数据包（Windows 开发机）

### 6.1 数据在哪里

| 类型 | Windows 路径 | 说明 |
|------|----------------|------|
| SQLite 源库 | `D:\dbsource\data\cms\data.db` | 本地开发用，不上传 |
| **内容导出包** | `D:\dbsource\data\exports\dbsource-20260621-154439.tar.gz` | 约 0.2MB，Strapi export |
| **图片 uploads** | `D:\dbsource\data\cms\uploads\` | **4923 文件，约 3GB** |
| 清单说明 | `D:\dbsource\data\exports\PACKAGE-MANIFEST-20260621.txt` | |

### 6.2 导出包内容统计

- 产品 product：**108** 条  
- 案例 case：**32** 条  
- 下载 download：**22** 条  
- 上传文件记录：**1017** 条  
- 含 about / contact / scene / qr 等配置  

> tar.gz **不含**图片二进制，图片必须单独传 uploads。

### 6.3 重新导出（可选）

```powershell
cd D:\dbsource
.\stop.ps1
cd D:\dbsource\dbsource-audio-site\cms
npx strapi export --no-encrypt -f D:\dbsource\data\exports\dbsource-新时间戳 --only content
cd D:\dbsource
.\preview.ps1
```

---

## 七、上传数据包 + uploads 到 ECS

### 7.1 Windows PowerShell 上传

```powershell
# 密钥路径按实际修改
$key = "C:\Users\Administrator\Downloads\dbsource01-01.pem"
$ip  = "47.119.181.44"

# 1) 内容包（小，约 0.2MB）
scp -i $key D:\dbsource\data\exports\dbsource-20260621-154439.tar.gz root@${ip}:/root/

# 2) 图片目录（大，约 3GB，5Mbps 约需 1～2 小时，保持网络稳定）
scp -i $key -r D:\dbsource\data\cms\uploads root@${ip}:/root/uploads
```

**上传进度技巧：** uploads 很大，可先用 `rsync`（若 Windows 有）或分卷；中断后可重传 scp。

### 7.2 ECS 上导入（PM2 方式，非 Docker）

SSH 登录后：

```bash
# 前提：PostgreSQL 已装好，Strapi cms/.env 已指向 postgres，且 npm run build 已通过

# 导入内容到 PostgreSQL
cd /www/dBsource/cms
npx strapi import -f /root/dbsource-20260621-154439.tar.gz --force

# 导入图片
mkdir -p /www/dBsource/cms/public/uploads
cp -r /root/uploads/* /www/dBsource/cms/public/uploads/

# 重启
pm2 restart all
pm2 logs --lines 30
```

### 7.3 配置 API Token（导入后必做）

1. 浏览器打开：`http://47.119.181.44:1337/admin` 或 `http://cms.dbsourceaudio.com/admin`（需 Nginx 配好）  
2. 用**本地 Strapi 相同邮箱密码**登录（本地已改过密码则用新密码）  
3. **Settings → API Tokens → Create new API Token** → 类型 **Full access**  
4. 复制 Token，写入：

```bash
nano /www/dBsource/.env.production.local
# STRAPI_API_TOKEN=粘贴Token
```

5. **必须重新构建官网**（NEXT_PUBLIC_* 与 Token 相关逻辑）：

```bash
cd /www/dBsource
npm run build
pm2 restart dbsource-web
```

---

## 八、环境变量模板

### 8.1 官网 `/www/dBsource/.env.production.local`

```env
NEXT_PUBLIC_SITE_URL=https://www.dbsourceaudio.com
CMS_URL=https://cms.dbsourceaudio.com
NEXT_PUBLIC_CMS_URL=https://cms.dbsourceaudio.com
NEXT_PUBLIC_USE_MOCK_DATA=false

STRAPI_API_TOKEN=导入后填写
ADMIN_TOKEN=自行设置强密码

# 维护模式（可选）
# NEXT_PUBLIC_MAINTENANCE_MODE=true
# NEXT_PUBLIC_MAINTENANCE_MESSAGE=网站升级维护中，请稍后再试。
```

### 8.2 Strapi `/www/dBsource/cms/.env`

```env
HOST=0.0.0.0
PORT=1337

DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=你的强密码

APP_KEYS=随机1,随机2,随机3,随机4
API_TOKEN_SALT=随机值
ADMIN_JWT_SECRET=随机值
TRANSFER_TOKEN_SALT=随机值
JWT_SECRET=随机值
```

生成随机值：`openssl rand -base64 16`（多执行几次）

### 8.3 PostgreSQL 建库（若未做）

```bash
sudo -u postgres psql <<'SQL'
CREATE USER strapi WITH PASSWORD '你的强密码';
CREATE DATABASE strapi OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;
SQL
```

---

## 九、PM2 配置（路径已改为 /www/dBsource）

文件：`/www/dBsource/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: "dbsource-web",
      cwd: "/www/dBsource",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3003 -H 127.0.0.1",
      env: { NODE_ENV: "production" },
      autorestart: true,
      max_memory_restart: "1G",
    },
    {
      name: "dbsource-strapi",
      cwd: "/www/dBsource/cms",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production" },
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
```

```bash
cd /www/dBsource
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # 按提示执行输出的 sudo 命令
pm2 status    # 两个都应为 online
```

---

## 十、Nginx 要点

### 10.1 官网（已有，确认 proxy_pass）

```nginx
server {
    listen 80;
    server_name www.dbsourceaudio.com dbsourceaudio.com 47.119.181.44;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.2 CMS 子域名（待加）

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
nginx -t && systemctl reload nginx
```

### 10.3 HTTPS（待做）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d www.dbsourceaudio.com -d dbsourceaudio.com
certbot --nginx -d cms.dbsourceaudio.com
```

---

## 十一、域名解析（阿里云 DNS）

| 主机记录 | 类型 | 记录值 |
|----------|------|--------|
| www | A | 47.119.181.44 |
| @ | A | 47.119.181.44 |
| cms | A | 47.119.181.44 |

删除旧指向 Vercel 的 CNAME（若有）。

---

## 十二、两套后台账号（勿混淆）

| 后台 | 地址 | 账号 |
|------|------|------|
| **内容后台** | `/admin/login` | 仅密码 = `ADMIN_TOKEN` |
| **Strapi CMS** | `:1337/admin` | 邮箱 + 密码（本地 Strapi 管理员） |

---

## 十三、上线后访问地址

| 用途 | URL |
|------|-----|
| 官网 | https://www.dbsourceaudio.com |
| 内容后台 | https://www.dbsourceaudio.com/admin/login |
| Strapi | https://cms.dbsourceaudio.com/admin |
| 系统状态 | https://www.dbsourceaudio.com/admin/status |

---

## 十四、常见问题速查

| 现象 | 处理 |
|------|------|
| 网站能开但没有产品 | 检查数据是否 import、STRAPI_API_TOKEN、USE_MOCK_DATA=false、重新 build |
| 图片裂开 | uploads 未传完或未 cp 到 cms/public/uploads |
| 502 | `pm2 status` 看是否 online，`pm2 logs` 查错 |
| CMS 打不开 | 检查 dbsource-strapi 是否 online、Nginx cms 配置、1337 仅本机 |
| 改 NEXT_PUBLIC_* 不生效 | 必须 `npm run build` 后 `pm2 restart dbsource-web` |

---

## 十五、仓库内其他文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| 零基础飞书版（完整 11 步） | `deploy/docs/飞书-零基础部署指南.md` | 逐步操作 |
| PM2 技术文档 | `deploy/docs/ECS-PM2-NGINX-DEPLOY.md` | 详细配置 |
| 完整部署流程 | `deploy/docs/DEPLOYMENT-GUIDE.md` | 含 Docker 方案 |
| 数据迁移 | `deploy/docs/MIGRATE-SQLITE-TO-POSTGRES.md` | SQLite→PG |
| Vercel 切换 | `deploy/docs/VERCEL-TO-ALIYUN-CUTOVER.md` | DNS 切换 |
| 上线检查清单 | `deploy/docs/PRE-LAUNCH-CHECKLIST.md` | 上线前打勾 |
| Docker 部署 | `deploy/README.md` | **当前未用 Docker** |

---

## 十六、本地开发机参考

| 项目 | 值 |
|------|-----|
| 项目根目录 | `D:\dbsource\dbsource-audio-site` |
| 本地预览 | http://127.0.0.1:3003 |
| 局域网预览 | http://192.168.1.152:3003（`npm run dev:mobile`） |
| 启动 | `D:\dbsource\preview.ps1` |
| 停止 | `D:\dbsource\stop.ps1` |

---

## 十七、给 ChatGPT 的下一步建议（当前最该做）

1. 确认 `pm2 status` 是否**只有 web 没有 strapi** → 补 PostgreSQL + Strapi 构建 + PM2  
2. 配置 Nginx `cms` 子域名  
3. 指导 scp 上传 `dbsource-20260621-154439.tar.gz` 和 `uploads`  
4. SSH 执行 `strapi import` + `cp uploads`  
5. 创建 API Token → 写 `.env.production.local` → `npm run build` → 重启  
6. 域名 + HTTPS  

**请 ChatGPT 从第 1 步开始，每步等我反馈再继续。**
