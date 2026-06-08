# dBsource Strapi 后台

路径：`C:\Users\Administrator\Desktop\Strapi`  
版本：**Strapi 5.12.4** + SQLite

## 已创建的 Content Types

| 类型 | API 路径 | 用途 |
|------|----------|------|
| **Product** | `/api/products` | 产品型号、参数、图集 |
| **Case** | `/api/cases` | 工程/演出案例 |
| **Download** | `/api/downloads` | 下载中心文件 |
| **Scene** | `/api/scenes` | 首页应用场景 |
| **QRCode** | `/api/qr-codes` | 服务号/抖音/视频号二维码 |
| **AboutSection** | `/api/about-sections` | 关于我们各图文区块 |

## 启动后台

```powershell
cd C:\Users\Administrator\Desktop\Strapi
npm run develop
```

浏览器打开：**http://localhost:1337/admin**

首次启动会要求创建管理员账号（请妥善保存邮箱和密码）。

## 客户如何上传图片、改文字

1. 登录 `http://localhost:1337/admin`
2. 左侧 **Content Manager** → 选择类型（如 Case）
3. **Create new entry** → 填写中英文字段 → **Upload** 上传图片
4. 点击 **Publish** 发布
5. 前台网站读取 API 后即可显示（需配置网站 `.env.local`）

## 连接 dBsource 官网

在 `dbsource-audio-site/.env.local` 添加：

```env
CMS_URL=http://localhost:1337
NEXT_PUBLIC_USE_MOCK_DATA=false
```

> 注意：官网 `fetchCMS.ts` 目前按 Mock 扁平结构读取，接上 Strapi 后还需增加一层 **数据转换**（Strapi v5 返回 `documentId` + 嵌套字段）。下一步可在官网增加 `lib/strapi-mapper.ts`。

## 字段说明速查

### Product
- `model` 型号（唯一）
- `nameZh` / `nameEn` 名称
- `productLine` / `seriesGroup` / `category` 分类枚举
- `image` / `gallery` 封面与图集

### Case
- `legacyId` 对应官网案例 ID（1–6）
- `type`：`engineering` | `performance`
- `titleZh/En`、`detailZh/En`、`highlightsZh/En`（JSON 数组）

### Download
- `fileUrl` 下载链接（可填 OSS 地址）
- `file` 也可直接上传安装包
- `subCategory` 对应下载中心子分类

### AboutSection
- `sectionKey` 唯一键：`brandIntro`、`origin`、`dbcoverHome` 等
- 每个区块一条记录，上传对应图片

## 常用命令

```powershell
npm run develop   # 开发模式（自动重载）
npm run build     # 构建管理面板
npm run start     # 生产模式
```
