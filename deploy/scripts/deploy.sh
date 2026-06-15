#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "[deploy] Docker not found. Install Docker first."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[deploy] Created .env from .env.example"
  echo "[deploy] Edit deploy/.env (passwords, domains, tokens) then run again."
  exit 0
fi

# shellcheck disable=SC1091
set -a && source .env && set +a

if [ -z "${POSTGRES_PASSWORD:-}" ] || [ "$POSTGRES_PASSWORD" = "change-me-db-password" ]; then
  echo "[deploy] Please set a strong POSTGRES_PASSWORD in .env"
  exit 1
fi

if [ -z "${STRAPI_API_TOKEN:-}" ]; then
  echo "[warn] STRAPI_API_TOKEN is empty — set it after first Strapi login."
fi

echo "[deploy] Building images (may take 10–20 min on first run)..."
docker compose build

echo "[deploy] Starting services..."
docker compose up -d

echo ""
echo "[deploy] Done. Check status:"
docker compose ps
echo ""
echo "  Website:  http://${SITE_DOMAIN:-www.dbsourceaudio.com}"
echo "  Admin:    http://${SITE_DOMAIN:-www.dbsourceaudio.com}/admin/login"
echo "  Strapi:   http://${CMS_DOMAIN:-cms.dbsourceaudio.com}/admin"
echo ""
echo "  Logs:     docker compose logs -f"
echo "  Stop:     docker compose down"
