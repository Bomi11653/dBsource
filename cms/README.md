# dBsource CMS (Strapi 5)

东莞新声电子 — 官网内容管理后台，对接 [dBsource](https://github.com/Bomi11653/dBsource) 前端。

## 本地启动

```bash
npm install
cp .env.example .env   # 填写 APP_KEYS 等密钥
npm run develop
```

管理后台：http://localhost:1337/admin

## 环境变量

复制 `.env.example` 为 `.env`，生成密钥：

```bash
openssl rand -base64 16
```

| 变量 | 说明 |
|------|------|
| `WEBSITE_PUBLIC_PATH` | 前端 `public` 目录绝对路径，用于自动 seed 图片 |
| `DATABASE_FILENAME` | SQLite 库路径，默认 `.tmp/data.db` |

## 内容类型

- products / cases / downloads / scenes / qr-codes
- about-sections / contact-info / leads
- product-series-configs

## 与前端联调

前端 `.env.local`：

```
CMS_URL=http://localhost:1337
NEXT_PUBLIC_CMS_URL=http://localhost:1337
NEXT_PUBLIC_USE_MOCK_DATA=false
```

手机预览时图片经前端 `/strapi-uploads/` 代理，无需改 CMS 地址。

## 上传文件

`public/uploads/` 未纳入 Git（体积大）。新环境请：

1. 在 Strapi 后台重新上传媒体，或
2. 从旧环境复制 `public/uploads/` 与 `.tmp/data.db`，或
3. 运行 seed（`src/seed/website-seed.ts`）导入基础数据
