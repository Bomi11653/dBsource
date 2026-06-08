# dBsource Pro

东莞新声电子科技有限公司 — 专业音响品牌官网（Next.js 14）。

## 本地预览

```bash
npm install
npm run build
npm run start
```

浏览器打开 http://127.0.0.1:3003

Windows 可双击上级目录的 `修复预览崩溃.bat`。

## 技术栈

- Next.js 14 · TypeScript · Tailwind CSS
- Three.js / React Three Fiber（首页声波）
- Framer Motion（案例滚动叙事）
- Strapi 5 CMS（`cms/` 目录）

## CMS 后台

```bash
cd cms
npm install
cp .env.example .env   # 填写密钥
npm run develop
```

Strapi 管理：http://localhost:1337/admin  
自建内容后台：http://127.0.0.1:3003/admin/login

## 环境变量

复制 `.env.example` 为 `.env.local`（可选）。
