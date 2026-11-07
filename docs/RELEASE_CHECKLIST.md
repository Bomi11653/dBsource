# dBsource 交付 / 部署 / 验收清单

## A. 变更前

- [ ] 一次只处理一个具体问题，并已定义预期结果。
- [ ] 记录本地、ECS、GitHub 的 HEAD 与 `git status`；明确代码权威源。
- [ ] 检查是否改 CMS schema、数据库数据、媒体、生产配置。
- [ ] 数据库与 uploads 近期备份可恢复，环境变量/服务配置另行安全备份。
- [ ] 记录涉及文件、依赖功能、潜在业务影响和回滚构建版本。

## B. 代码与测试

- [ ] 仅修改审计后必要的文件。
- [ ] 后台 CRUD 与 Strapi schema / API / Mapper / 前端字段一致。
- [ ] `npx tsc --noEmit` 通过。
- [ ] `npm run build` 退出码 0；`server.js` 存在。
- [ ] 若 PDF 修改：`node scripts/verify-pdf-worker.mjs` 通过 + 真实 PDF 多行导入。
- [ ] 系列固定项和 SA/FA/Unit48/DS：切换不跳全部；URL 保持；Navbar 同步。
- [ ] 后台系列增删隐藏、产品占用删除保护正确。
- [ ] 技术规格：有表无图、有表有图、无表有图、无表无图 4 个状态符合预期。
- [ ] 技术规格全删后能保存/发布并保持空，不自动恢复静态参数。
- [ ] 原图清晰、不裁切、下载能实际拿到原件。
- [ ] `/about` 销售顾问模块横排且不影响 `/contact`。
- [ ] 中文/英文、桌面/手机至少各检查对应修改功能。

## C. 部署

- [ ] 不能因 GitHub main 旧而覆盖 ECS 工作版本；只发布已核对的 release。
- [ ] `dbsource-web` / `dbsource-strapi` 启动方式、cwd、端口已核对。
- [ ] 仅前端变更不重启 Strapi；schema 改动先备份后构建 CMS。
- [ ] 生产版本有回滚方案；失败不启动坏版本。
- [ ] 如果使用手工 scp，明确每一个文件和哈希，随后补录 Git。

## D. 上线后

- [ ] `pm2 status` 都是 online 且 uptime/PID 与变更一致。
- [ ] `curl` 检查本机 Next 3003 和 Strapi 1337。
- [ ] 经过 Nginx 的四个路径 `/` `/products` `/admin/login` `cms /admin` 为 200 或正常重定向链。
- [ ] 带有效授权的 `products/cases/downloads/product-series-configs` API 正常，且无持续 401/500。
- [ ] PM2 新日志中无重复 `KnexTimeoutError` / `read ETIMEDOUT` / `HeadersTimeoutError` / `Server Action` 版本错。
- [ ] 用浏览器做相关功能冒烟测试（不能只用 curl HEAD）。
- [ ] 填写 `docs/CHANGELOG_OPERATIONS.md` 的记录模板，附测试时间/版本/回滚。

## E. 回滚条件

- Build 失败、standalone `server.js` 缺失、Strapi API 新增 500、业务内容丢失、图片不可访问、产品大量错配 → 停止发布，恢复前一已验证版本。
- 数据库 schema 或数据变更不能仅靠前端 Git 回滚：必须按经批准的数据库恢复流程执行。
- 回滚后重新做 D 段检查；保存事故证据，禁止先清日志。
