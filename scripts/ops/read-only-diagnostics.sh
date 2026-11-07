#!/usr/bin/env bash
# Read-only diagnostic helper for Next + Strapi + Nginx on an ECS server.
# Does NOT change any service, files, configurations or tokens.
set -u

ROOT="${DBSOURCE_ROOT:-/www/dBsource}"
NEXT_URL="${DBSOURCE_NEXT_HEALTH:-http://127.0.0.1:3003/}"
CMS_URL="${DBSOURCE_CMS_HEALTH:-http://127.0.0.1:1337/admin}"

printf '=== Date / machine ===\n'
date '+%Y-%m-%d %H:%M:%S %z'
hostname
printf '\n=== Working project ===\n'
printf 'Expected root: %s\n' "$ROOT"
if [ -d "$ROOT/.git" ]; then
  (cd "$ROOT" && git status -sb && git log -1 --oneline) || true
else
  printf 'Not a git checkout: %s\n' "$ROOT"
fi

printf '\n=== PM2 status (process table only) ===\n'
if command -v pm2 >/dev/null 2>&1; then pm2 status || true; else echo 'pm2 not found'; fi

printf '\n=== Port listening ===\n'
if command -v ss >/dev/null 2>&1; then
  ss -lntp | grep -E ':(80|443|3003|1337|5432)\b' || true
else
  echo 'ss not found'
fi

printf '\n=== Resource usage ===\n'
if command -v free >/dev/null 2>&1; then free -h || true; fi
if command -v df >/dev/null 2>&1; then df -h "$ROOT" || true; fi

printf '\n=== Nginx syntax (read-only) ===\n'
if command -v nginx >/dev/null 2>&1; then
  nginx -t 2>&1 || echo 'nginx test failed or insufficient permissions'
else
  echo 'nginx not found'
fi

check_http() {
  local name="$1" url="$2"
  printf '%s: ' "$name"
  curl --silent --show-error --output /dev/null --max-time 10 \
    --write-out 'status=%{http_code} elapsed=%{time_total}s\n' "$url" || echo 'network or app failure'
}

printf '\n=== Local HTTP response checks ===\n'
if command -v curl >/dev/null 2>&1; then
  check_http 'next_root' "$NEXT_URL"
  check_http 'next_products' 'http://127.0.0.1:3003/products'
  check_http 'strapi_admin' "$CMS_URL"
else
  echo 'curl not found'
fi

printf '\n=== Security / meaning ===\n'
echo 'No tokens, credentials or private env files were read or printed.'
echo 'HTTP 200 on /admin is not a database health proof; verify CMS business APIs separately.'
echo 'pm2 online is not a health proof; investigate 5xx / read ETIMEDOUT / KnexTimeoutError with recent logs.'
echo 'No changes made.'
