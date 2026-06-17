# dBsource 完整部署流程

东莞新声电子官网 — 从本地开发到阿里云 ECS 正式上线的全流程指南。

> **代码仓库：** https://github.com/Bomi11653/dBsource  
> **正式域名：** www.dbsourceaudio.com / cms.dbsourceaudio.com  
> **备案号：** 粤ICP备2025373674号

---

## 一、系统架构

```
                    ┌─────────────────────────────────────┐
  用户浏览器 ──────► │  Nginx (:80 / :443)                 │
                    │  www.dbsourceaudio.com  → web :3000 │
                    │  cms.dbsourceaudio.com  → strapi    │
                    └──────────┬──────────────┬───────────┘
                               │              │
                    ┌──────────▼──┐    ┌──────▼──────┐
                    │  Next.js    │    │  Strapi 5   │
                    │  官网+后台   │───►│  CMS API    │
                    └─────────────┘    └──────┬──────┘
                                              │
                                       ┌──────▼──────┐
                                       │ PostgreSQL  │
                                       └─────────────┘
```

| 组件 | 作用 | 访问地址 |
|------|------|----------|
| **web** | 官网前端 + 内容后台 `/admin` | https://www.dbsourceaudio.com |
| **strapi** | CMS 数据管理 | https://cms.dbsourceaudio.com/admin |
| **postgres** | 生产数据库 | 仅内网，不对外暴露 |
| **nginx** | 反向代理 + HTTPS | 80 / 443 |

**本地开发 vs 生产：**

| 环境 | 网站 | Strapi | 数据库 |
|------|------|--------|--------|
| 本地 | http://127.0.0.1:3003 | http://localhost:1337 | SQLite `D:\dbsource\data\cms\data.db` |
| 生产 | ECS Docker | ECS Docker | PostgreSQL |

---

## 二、部署总览（6 个阶段）

```
阶段 1  本地开发与数据准备     ← 你现在的状态
阶段 2  购买并配置阿里云 ECS
阶段 3  Docker 一键部署空环境
阶段 4  迁移本地数据到生产
阶段 5  HTTPS + 预发布验证
阶段 6  DNS 切换（Vercel → 阿里云）
```

**预计总耗时：** 首次约 4–8 小时（含数据上传）

---

## 阶段 1：本地开发与数据准备

### 1.1 目录结构

```
D:\dbsource\
├── dbsource-audio-site\     # 代码（GitHub 同步）
│   ├── app\                 # Next.js 页面
│   ├── cms\                 # Strapi 后端
│   └── deploy\              # 生产部署配置
└── data\                    # 业务数据（不在 Git 中）
    ├── cms\data.db          # SQLite 数据库
    ├── cms\uploads\         # 图片/文件 (~2.8 GB)
    └── exports\             # 导出包（迁移时生成）
```

### 1.2 本地启动

```powershell
cd D:\dbsource
.\dev.ps1
```

| 地址 | 用途 |
|------|------|
| http://127.0.0.1:3003 | 官网 |
| http://127.0.0.1:3003/admin/login | 内容后台 |
| http://localhost:1337/admin | Strapi 后台 |

停止：`.\stop.ps1`

### 1.3 确认本地数据正常

- [ ] 产品列表约 112 个
- [ ] 案例约 14 个
- [ ] 图片正常显示
- [ ] 内容后台可登录编辑

---

## 阶段 2：购买并配置阿里云 ECS

### 2.1 购买 ECS

1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/)
2. 推荐配置：

| 项目 | 推荐值 |
|------|--------|
| 地域 | 华南（深圳）或与 ICP 备案一致 |
| 规格 | 4核8G（ecs.c7.xlarge） |
| 镜像 | Ubuntu 22.04 |
| 系统盘 | 40GB+ SSD |
| 带宽 | 5Mbps 起 |

3. 分配并记下 **公网 IP**（下文用 `ECS_IP` 代替）

### 2.2 安全组

| 端口 | 协议 | 授权对象 | 说明 |
|------|------|----------|------|
| 22 | TCP | 你的办公 IP | SSH 管理 |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

### 2.3 安装 Docker

```bash
ssh root@ECS_IP

apt update && apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sh
docker compose version   # 确认 v2.x
```

### 2.4 克隆代码

```bash
git clone https://github.com/Bomi11653/dBsource.git
cd dBsource/deploy
```

---

## 阶段 3：Docker 一键部署

### 3.1 配置环境变量

```bash
cp .env.example .env
nano .env
```

**必须修改的项：**

```bash
# 域名
NEXT_PUBLIC_SITE_URL=https://www.dbsourceaudio.com
CMS_URL=https://cms.dbsourceaudio.com
NEXT_PUBLIC_CMS_URL=https://cms.dbsourceaudio.com
NEXT_PUBLIC_USE_MOCK_DATA=false

# 密码（全部改成强密码）
POSTGRES_PASSWORD=你的数据库密码
ADMIN_TOKEN=你的内容后台密码

# Strapi 密钥（各运行一次 openssl rand -base64 16）
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=随机值
ADMIN_JWT_SECRET=随机值
TRANSFER_TOKEN_SALT=随机值
JWT_SECRET=随机值

# 数据导入后再填
STRAPI_API_TOKEN=
```

生成随机密钥：

```bash
openssl rand -base64 16
```

### 3.2 执行部署

```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

首次构建约 **10–20 分钟**。

### 3.3 确认服务状态

```bash
docker compose ps
```

四个服务均应为 `running`：`postgres`、`strapi`、`web`、`nginx`。

### 3.4 首次 Strapi 初始化（若暂不导入数据）

1. 浏览器打开 `http://ECS_IP` 或临时 hosts 绑定域名
2. 访问 `http://cms.dbsourceaudio.com/admin`（需 hosts 或 DNS）
3. 创建管理员账号
4. Settings → API Tokens → 创建 **Full access** Token
5. Token 写入 `.env` 的 `STRAPI_API_TOKEN`
6. `docker compose restart web`

> **推荐：** 先完成阶段 4 数据导入，再配置 Token，避免重复操作。

---

## 阶段 4：迁移本地数据

GitHub **只有代码，没有产品和图片**，必须从开发机迁移。

### 4.1 本地导出（Windows）

```powershell
cd D:\dbsource\dbsource-audio-site\deploy\scripts
.\export-local-data.ps1
```

生成：`D:\dbsource\data\exports\dbsource-时间戳.tar.gz`

### 4.2 上传到 ECS

```powershell
scp D:\dbsource\data\exports\dbsource-*.tar.gz root@ECS_IP:/root/
scp -r D:\dbsource\data\cms\uploads root@ECS_IP:/root/uploads
```

大文件上传较慢（uploads ~2.8 GB），可用 `rsync` 断点续传：

```powershell
# 若安装了 rsync / WSL
rsync -avz --progress D:\dbsource\data\cms\uploads\ root@ECS_IP:/root/uploads/
```

### 4.3 ECS 导入

```bash
cd ~/dBsource/deploy

# 导入内容到 PostgreSQL
./scripts/import-strapi-data.sh /root/dbsource-*.tar.gz

# 导入图片
./scripts/import-uploads.sh /root/uploads

# 重启
docker compose restart strapi web
```

### 4.4 配置 API Token

1. 打开 Strapi 后台，用**本地相同邮箱**登录（import 会同步账号）
2. Settings → API Tokens → 创建 Full access Token
3. 写入 `deploy/.env` → `STRAPI_API_TOKEN=...`
4. `docker compose restart web`

### 4.5 验证数据

| 检查项 | 预期 |
|--------|------|
| 产品数量 | ~112 |
| 案例数量 | ~14 |
| 产品图片 | 正常加载 |
| 内容后台 | 可编辑保存 |

详细说明：[MIGRATE-SQLITE-TO-POSTGRES.md](MIGRATE-SQLITE-TO-POSTGRES.md)

---

## 阶段 5：HTTPS 与预发布验证

### 5.1 申请 SSL 证书

1. [阿里云 SSL 证书](https://yundun.console.aliyun.com/?p=cas) → 免费 DV 证书
2. 分别申请：`www.dbsourceaudio.com`、`cms.dbsourceaudio.com`
3. DNS 验证后下载 **Nginx** 格式

### 5.2 安装证书

```bash
# 放到 ECS 对应目录
deploy/nginx/certs/www/fullchain.pem
deploy/nginx/certs/www/privkey.pem
deploy/nginx/certs/cms/fullchain.pem
deploy/nginx/certs/cms/privkey.pem
```

### 5.3 启用 HTTPS

编辑 `deploy/nginx/conf.d/dbsource.conf`：

1. 取消 HTTPS server 块的注释
2. 建议 HTTP 自动跳转 HTTPS：

```nginx
server {
  listen 80;
  server_name www.dbsourceaudio.com dbsourceaudio.com;
  return 301 https://$host$request_uri;
}
```

```bash
docker compose restart nginx
```

### 5.4 hosts 预发布测试（不切 DNS）

Windows 编辑 `C:\Windows\System32\drivers\etc\hosts`（管理员）：

```
ECS_IP  www.dbsourceaudio.com
ECS_IP  cms.dbsourceaudio.com
```

| 检查项 | URL | 预期 |
|--------|-----|------|
| 首页 | https://www.dbsourceaudio.com | 真实产品数据 |
| 产品 | /products | ~112 个 |
| 案例 | /cases | 有数据 |
| 图片 | 任意产品页 | 正常 |
| 内容后台 | /admin/login | 可登录 |
| Strapi | https://cms.dbsourceaudio.com/admin | 可登录 |
| 联系表单 | /contact | 提交无报错 |

**全部通过后再进入阶段 6。**

---

## 阶段 6：DNS 切换（Vercel → 阿里云）

### 6.1 切换前准备

- [ ] 阶段 1–5 全部完成
- [ ] 记下 Vercel 当前 CNAME（便于回滚）
- [ ] DNS TTL 提前 24h 改为 **600** 秒

### 6.2 修改 DNS 记录

阿里云域名控制台 → `dbsourceaudio.com` → 解析设置：

| 主机记录 | 类型 | 记录值 | 说明 |
|----------|------|--------|------|
| www | A | ECS_IP | 官网 |
| cms | A | ECS_IP | Strapi |
| @ | A | ECS_IP | 根域名 |

删除指向 Vercel 的旧 CNAME。

### 6.3 切换后验证

1. 删除本机 hosts 测试条目
2. `ipconfig /flushdns`
3. 无痕窗口访问 https://www.dbsourceaudio.com
4. 手机 4G 网络测试
5. 确认页脚备案号显示正常

### 6.4 Vercel 收尾（观察 24–48h 后）

- 从 Vercel Domains 移除 `www.dbsourceaudio.com`
- 后续更新不再部署 Vercel，改在 ECS 上 `git pull` + `docker compose up -d --build`

详细说明：[VERCEL-TO-ALIYUN-CUTOVER.md](VERCEL-TO-ALIYUN-CUTOVER.md)

---

## 三、日常运维

### 代码更新发布

```bash
# 本地
git push origin main

# ECS
cd ~/dBsource
git pull origin main
cd deploy
docker compose build
docker compose up -d
```

### 仅修改网站内容

在 Strapi 或 `/admin` 后台编辑 → **无需重新构建**，刷新即可。

### 修改环境变量

改 `deploy/.env` 后：

```bash
# 改了 STRAPI_API_TOKEN 等运行时变量
docker compose restart web

# 改了 NEXT_PUBLIC_* 等构建时变量
docker compose build web && docker compose up -d web
```

### 常用命令

```bash
cd ~/dBsource/deploy

docker compose ps                 # 服务状态
docker compose logs -f web        # 网站日志
docker compose logs -f strapi     # CMS 日志
docker compose restart web        # 重启网站
docker compose down               # 停止全部
docker compose up -d --build      # 重新构建并启动
```

### 备份建议

| 内容 | 频率 | 方式 |
|------|------|------|
| PostgreSQL | 每周 | `docker compose exec postgres pg_dump -U strapi strapi > backup.sql` |
| uploads | 每月 | 打包 `strapi_uploads` 卷或 OSS 同步 |
| .env | 变更时 | 加密保存到安全位置 |

---

## 四、故障排查速查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 网站无产品，显示 mock | `USE_MOCK_DATA=true` 或 Token 空 | `.env` 设 `false` + 填 Token + restart web |
| 后台 401 | API Token 过期 | Strapi 重新生成 Token → restart web |
| 产品有数据，图片裂 | uploads 未导入 | `import-uploads.sh` |
| 构建失败 | 缓存问题 | `docker compose build --no-cache` |
| HTTPS 证书错误 | 证书路径或域名不匹配 | 检查 certs 目录和 nginx 配置 |
| 切 DNS 后仍看到旧站 | DNS 缓存 | 等 TTL 过期 / flushdns / 4G 测试 |
| Strapi 无法启动 | 数据库连接失败 | 检查 `POSTGRES_PASSWORD` 与 compose 日志 |

---

## 五、环境变量完整对照

| 变量 | 本地 `.env.local` | 生产 `deploy/.env` |
|------|-------------------|---------------------|
| `NEXT_PUBLIC_SITE_URL` | http://127.0.0.1:3003 | https://www.dbsourceaudio.com |
| `CMS_URL` | http://127.0.0.1:1337 | https://cms.dbsourceaudio.com |
| `NEXT_PUBLIC_CMS_URL` | http://127.0.0.1:1337 | https://cms.dbsourceaudio.com |
| `NEXT_PUBLIC_USE_MOCK_DATA` | false | **false** |
| `STRAPI_API_TOKEN` | 本地 Token | 生产 Token |
| `ADMIN_TOKEN` | 本地自行设置 | 强密码 |
| `POSTGRES_PASSWORD` | — | 必填 |
| `APP_KEYS` 等 Strapi 密钥 | cms/.env | deploy/.env |

---

## 六、一页纸检查清单

```
□ 本地 dev.ps1 正常，产品/案例/图片 OK
□ ECS 4核8G，80/443 已开，Docker 已装
□ git clone + deploy.sh，四容器 running
□ export-local-data.ps1 导出成功
□ scp 上传 export + uploads 到 ECS
□ import-strapi-data.sh + import-uploads.sh 完成
□ STRAPI_API_TOKEN、USE_MOCK_DATA=false 已配置
□ SSL 证书已装，HTTPS 正常
□ hosts 预发布：首页/产品/案例/后台/图片 全通过
□ DNS www/cms/@ 改 A 记录到 ECS
□ 无痕 + 手机 4G 验证通过
□ 观察 24h 后从 Vercel 移除生产域名
```

---

## 七、相关文档

| 文档 | 内容 |
|------|------|
| [飞书-零基础部署指南.md](飞书-零基础部署指南.md) | **零基础小白版（飞书粘贴）** |
| [STRAPI-DATA-MIGRATION.md](STRAPI-DATA-MIGRATION.md) | **Strapi 数据迁移（SQLite → PostgreSQL）** |
| [../README.md](../README.md) | Docker Compose 部署参考 |
| [ECS-PM2-NGINX-DEPLOY.md](ECS-PM2-NGINX-DEPLOY.md) | PM2 技术部署文档 |
| [MIGRATE-SQLITE-TO-POSTGRES.md](MIGRATE-SQLITE-TO-POSTGRES.md) | 数据迁移详细步骤 |
| [VERCEL-TO-ALIYUN-CUTOVER.md](VERCEL-TO-ALIYUN-CUTOVER.md) | Vercel 切换与回滚 |
| `deploy/.env.example` | 环境变量模板 |
| `D:\dbsource\data\README.md` | 本地数据目录说明 |

---

## 八、关键路径速查

| 用途 | 路径 |
|------|------|
| 项目代码 | `D:\dbsource\dbsource-audio-site\` |
| 本地数据库 | `D:\dbsource\data\cms\data.db` |
| 本地图片 | `D:\dbsource\data\cms\uploads\` |
| 导出脚本 | `deploy\scripts\export-local-data.ps1` |
| 部署配置 | `deploy\docker-compose.yml` |
| 生产环境变量 | `deploy\.env` |
| GitHub | https://github.com/Bomi11653/dBsource |
