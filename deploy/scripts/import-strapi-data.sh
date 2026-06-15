#!/usr/bin/env bash
# Import a Strapi export archive into the running Docker Strapi (PostgreSQL).
# Usage: ./scripts/import-strapi-data.sh /path/to/dbsource-YYYYMMDD-HHMMSS.tar.gz
set -euo pipefail

IMPORT_SRC="${1:?Usage: $0 /path/to/export.tar.gz}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f "$IMPORT_SRC" ]; then
  echo "[import] File not found: $IMPORT_SRC"
  exit 1
fi

CID=$(docker compose ps -q strapi)
if [ -z "$CID" ]; then
  echo "[import] Strapi container not running. Run ./scripts/deploy.sh first."
  exit 1
fi

BASENAME=$(basename "$IMPORT_SRC")
CONTAINER_PATH="/tmp/$BASENAME"

echo "[import] Copying $IMPORT_SRC → strapi:$CONTAINER_PATH"
docker cp "$IMPORT_SRC" "$CID:$CONTAINER_PATH"

echo "[import] Running strapi import (PostgreSQL)..."
docker compose exec -T strapi npx strapi import -f "$CONTAINER_PATH" --force

echo "[import] Cleaning up container temp file..."
docker compose exec -T strapi rm -f "$CONTAINER_PATH"

echo ""
echo "[import] Done."
echo "  1. If you used --only content export, run: ./scripts/import-uploads.sh /path/to/uploads"
echo "  2. Create API Token in Strapi admin → set STRAPI_API_TOKEN in .env"
echo "  3. docker compose restart web"
