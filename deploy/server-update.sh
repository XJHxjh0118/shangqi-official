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

# 无 rsync 时用 cp 同步；可保留指定相对路径
sync_tree() {
  local src="$1"
  local dst="$2"
  shift 2
  mkdir -p "$dst"
  if command -v rsync >/dev/null 2>&1; then
    local excludes=()
    local a
    for a in "$@"; do
      excludes+=(--exclude "$a")
    done
    rsync -a --delete "${excludes[@]}" "$src/" "$dst/"
    return
  fi

  local keep_tmp
  keep_tmp="$(mktemp -d)"
  local name
  for name in "$@"; do
    if [ -e "$dst/$name" ]; then
      mkdir -p "$(dirname "$keep_tmp/$name")"
      cp -a "$dst/$name" "$keep_tmp/$name"
    fi
  done

  find "$dst" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$src"/. "$dst"/

  for name in "$@"; do
    if [ -e "$keep_tmp/$name" ]; then
      rm -rf "$dst/$name"
      mkdir -p "$(dirname "$dst/$name")"
      cp -a "$keep_tmp/$name" "$dst/$name"
    fi
  done
  rm -rf "$keep_tmp"
}

echo "==> Update from $RELEASE_DIR"

# ---- API ----
if [ -f "$RELEASE_DIR/api.tar.gz" ]; then
  echo "==> API"
  # 先停进程，避免 node_modules 被占用导致 npm ENOTEMPTY
  pm2 stop shangqi-api >/dev/null 2>&1 || true
  mkdir -p "$API_DIR"
  TMP="$(mktemp -d)"
  tar -xzf "$RELEASE_DIR/api.tar.gz" -C "$TMP"
  # 只保留运行时数据；不保留旧 node_modules
  sync_tree "$TMP" "$API_DIR" .env uploads data.db prod.db
  rm -rf "$TMP"
  cd "$API_DIR"
  if [ ! -f .env ]; then
    echo "WARNING: $API_DIR/.env missing — create it before restart"
  fi
  rm -rf node_modules
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
  pm2 stop shangqi-web >/dev/null 2>&1 || true
  mkdir -p "$WEB_DIR"
  TMP="$(mktemp -d)"
  tar -xzf "$RELEASE_DIR/website.tar.gz" -C "$TMP"
  sync_tree "$TMP" "$WEB_DIR"
  rm -rf "$TMP"
  cd "$WEB_DIR/.output/server"
  rm -rf node_modules
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
  sync_tree "$TMP" "$ADMIN_DIR"
  rm -rf "$TMP"
fi

pm2 save
pm2 status
echo "==> Deploy finished"
