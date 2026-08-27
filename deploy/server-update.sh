#!/usr/bin/env bash
# 在服务器上执行：用最新产物覆盖运行目录并重启 PM2
# 产物应已含 node_modules（由 CI 在 Linux 打好），本机尽量不再 npm install
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

# 1G 机器兜底：没有 swap 就建 2G（只做一次）
ensure_swap() {
  if swapon --show 2>/dev/null | grep -q .; then
    return 0
  fi
  if [ -f /swapfile ]; then
    swapon /swapfile 2>/dev/null || true
    return 0
  fi
  echo "==> Creating 2G swap (one-time, for low-memory VPS)"
  if fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none; then
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile || true
    grep -q '/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
}

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

ensure_swap

# 释放内存：更新前先停站
pm2 stop shangqi-api >/dev/null 2>&1 || true
pm2 stop shangqi-web >/dev/null 2>&1 || true

echo "==> Update from $RELEASE_DIR"

# ---- API ----
if [ -f "$RELEASE_DIR/api.tar.gz" ]; then
  echo "==> API"
  mkdir -p "$API_DIR"
  TMP="$(mktemp -d)"
  tar -xzf "$RELEASE_DIR/api.tar.gz" -C "$TMP"
  # 保留运行时数据；node_modules 用 CI 产物覆盖
  sync_tree "$TMP" "$API_DIR" .env uploads data.db prod.db
  rm -rf "$TMP"
  cd "$API_DIR"
  if [ ! -f .env ]; then
    echo "WARNING: $API_DIR/.env missing — create it before restart"
  fi
  if [ ! -d node_modules ]; then
    echo "WARNING: api node_modules missing in release; fallback install (may OOM on 1G)"
    npm install --omit=dev --no-fund --no-audit --maxsockets 1
  fi
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
  sync_tree "$TMP" "$WEB_DIR"
  rm -rf "$TMP"
  cd "$WEB_DIR/.output/server"
  if [ ! -d node_modules ]; then
    echo "WARNING: website node_modules missing; fallback install"
    if command -v yarn >/dev/null 2>&1; then
      yarn install --production
    else
      npm install --omit=dev --no-fund --no-audit --maxsockets 1 || true
    fi
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
