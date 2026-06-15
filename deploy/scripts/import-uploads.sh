#!/usr/bin/env bash
# 将本地 uploads 目录导入运行中的 Strapi 容器
# 用法: ./scripts/import-uploads.sh /path/to/uploads
set -euo pipefail

UPLOADS_SRC="${1:?Usage: $0 /path/to/uploads}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d "$UPLOADS_SRC" ]; then
  echo "[import] Directory not found: $UPLOADS_SRC"
  exit 1
fi

CID=$(docker compose ps -q strapi)
if [ -z "$CID" ]; then
  echo "[import] Strapi container not running. Run ./scripts/deploy.sh first."
  exit 1
fi

echo "[import] Copying uploads to strapi volume..."
docker cp "$UPLOADS_SRC/." "$CID:/opt/app/public/uploads/"
echo "[import] Done. Restart strapi: docker compose restart strapi"
