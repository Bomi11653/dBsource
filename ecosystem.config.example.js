/**
 * PM2 配置示例 — 同时启动 Next.js 官网与 Strapi CMS
 *
 * 用法（ECS / Ubuntu）:
 *   cp ecosystem.config.example.js ecosystem.config.js
 *   # 按服务器实际路径修改 cwd
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup
 *
 * 注意: ecosystem.config.js 已加入 .gitignore，请勿提交含真实路径/密钥的副本。
 */
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
