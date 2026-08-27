#!/usr/bin/env bash
# 在服务器上执行：用最新产物覆盖运行目录并重启 PM2
# 用法：
#   bash /www/wwwroot/shangqi/deploy/server-update.sh /www/wwwroot/shangqi/releases/latest
set -euo pipefail

RELEASE_DIR="${1:-/www/wwwroot/shangqi/releases/latest}"
APP_ROOT="${APP_ROOT:-/www/wwwroot/shangqi}"
API_DIR="$APP_ROOT/api"
WEB_DIR="$APP_ROOT/website"
ADMIN_DIR="$APP_ROOT/admin"

if [ ! -d "$RELEASE_DIR" ]; then
  echo "Release dir not found: $RELEASE_DIR"
  exit 1
fi

echo "==> Update from $RELEASE_DIR"

# ---- API ----
if [ -f "$RELEASE_DIR/api.tar.gz" ]; then
  echo "==> API"
  mkdir -p "$API_DIR"
  # 保留运行时数据
  TMP="$(mktemp -d)"
  tar -xzf "$RELEASE_DIR/api.tar.gz" -C "$TMP"
  rsync -a --delete \
    --exclude '.env' \
    --exclude 'uploads' \
    --exclude 'data.db' \
    --exclude 'prod.db' \
    --exclude 'node_modules' \
    "$TMP/" "$API_DIR/"
  rm -rf "$TMP"
  cd "$API_DIR"
  if [ ! -f .env ]; then
    echo "WARNING: $API_DIR/.env missing — create it before restart"
  fi
  npm install --omit=dev --no-fund --no-audit
  npx prisma generate
  npx prisma migrate deploy
  mkdir -p uploads
  pm2 describe shangqi-api >/dev/null 2>&1 \
    && pm2 restart shangqi-api --update-env \
    || pm2 start dist/main.js --name shangqi-api --cwd "$API_DIR"
fi

# ---- Website ----
if [ -f "$RELEASE_DIR/website.tar.gz" ]; then
  echo "==> Website"
  mkdir -p "$WEB_DIR"
  TMP="$(mktemp -d)"
  tar -xzf "$RELEASE_DIR/website.tar.gz" -C "$TMP"
  rsync -a --delete "$TMP/" "$WEB_DIR/"
  rm -rf "$TMP"
  cd "$WEB_DIR/.output/server"
  # 优先 yarn（你之前在服务器上用它绕过了 npm edgesOut）
  if command -v yarn >/dev/null 2>&1; then
    yarn install --production
  else
    npm install --omit=dev --no-fund --no-audit || true
  fi
  pm2 describe shangqi-web >/dev/null 2>&1 \
    && pm2 restart shangqi-web --update-env \
    || PORT=3000 HOST=0.0.0.0 pm2 start index.mjs --name shangqi-web --cwd "$WEB_DIR/.output/server"
fi

# ---- Admin ----
if [ -f "$RELEASE_DIR/admin.tar.gz" ]; then
  echo "==> Admin"
  mkdir -p "$ADMIN_DIR"
  TMP="$(mktemp -d)"
  tar -xzf "$RELEASE_DIR/admin.tar.gz" -C "$TMP"
  rsync -a --delete "$TMP/" "$ADMIN_DIR/"
  rm -rf "$TMP"
fi

pm2 save
pm2 status
echo "==> Deploy finished"
