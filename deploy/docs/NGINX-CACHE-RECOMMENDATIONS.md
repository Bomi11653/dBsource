# Nginx 静态资源缓存建议（dBsource 官网）

> **说明：** 本文档仅提供配置建议，不直接修改服务器。请在 ECS 上编辑  
> `/etc/nginx/sites-available/dbsource`（或当前启用的站点配置）后执行  
> `nginx -t && systemctl reload nginx`。

## 1. `/strapi-uploads/` — Strapi 媒体反代

**作用：** 浏览器缓存产品图、案例图、下载封面等 CMS 图片，减少重复请求 Strapi。

**配置位置：** `server { ... }` 内，放在 `location /` 之前。

```nginx
location /strapi-uploads/ {
    proxy_pass http://127.0.0.1:1337/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # 图片可长期缓存（后台换图会生成新文件名）
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
}
```

**风险：**

- 若 Strapi 对**同一路径**覆盖上传而不改文件名，用户可能看到旧图，需等缓存过期或改文件名。
- 不要对 HTML/API 使用 `immutable`。

---

## 2. `/_next/static/` — Next.js 构建产物

**作用：** JS/CSS 带 content hash，可长期缓存，显著加快二次访问。

**配置位置：** 同上。

```nginx
location /_next/static/ {
    proxy_pass http://127.0.0.1:3003;
    expires 365d;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**风险：** 部署新版本后，旧 hash 文件自然失效；不要手动清 CDN 时误删当前构建目录。

---

## 3. `/public` 常规图片（`/images/`、`/brand/` 等）

**作用：** 本地静态图（下载 Banner、Logo 兜底等）浏览器缓存。

```nginx
location ~* ^/(images|brand|favicon\.png) {
    proxy_pass http://127.0.0.1:3003;
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
}
```

**风险：** 若直接覆盖同名文件，需改文件名或缩短 `max-age`。

---

## 4. 不要缓存的路径

| 路径 | 原因 |
|------|------|
| `/` 及页面 HTML | ISR/SSR 内容由 Next 控制 |
| `/api/*` | 动态接口 |
| `/admin/*` | 后台 |

保持现有 `location / { proxy_pass http://127.0.0.1:3003; }` 即可，**不要**给 HTML 加长期 `expires`。

---

## 5. 与项目机制的关系

- 官网图片 URL 统一为 `/strapi-uploads/...`（Next rewrite + 可选 Nginx 反代）。
- 后台保存后由 Next `revalidatePath` 刷新页面 HTML；图片 URL 变更时靠新文件名 + 上表缓存策略。
- LKG 文件缓存在服务器 `.data/cms-cache/`，与 Nginx 无关。

---

## 6. 验收

```bash
curl -I http://127.0.0.1/strapi-uploads/<某张图>.jpg
# 期望：Cache-Control: public, max-age=...

curl -I http://127.0.0.1/_next/static/chunks/<某文件>.js
# 期望：长期 immutable
```
