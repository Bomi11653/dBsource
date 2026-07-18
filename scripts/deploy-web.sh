#!/usr/bin/env bash
# Linux server frontend deploy for dbsource-web only.
# Does NOT restart Strapi / dbsource-strapi.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[deploy:web] cwd: $ROOT"
echo "[deploy:web] removing .next ..."
rm -rf .next

echo "[deploy:web] npm install ..."
npm install --no-audit --no-fund

echo "[deploy:web] building ..."
npm run build

echo "[deploy:web] restarting pm2 dbsource-web ..."
pm2 restart dbsource-web --update-env

echo "[deploy:web] pm2 status:"
pm2 status
