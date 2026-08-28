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
  echo "ERROR: Release dir not found: $RELEASE_DIR"
  exit 1
fi

run_step() {
  local title="$1"
  shift
  echo ""
  echo "==> $title"
  if "$@"; then
    echo "OK: $title"
    return 0
  fi
  local code=$?
  echo "FAILED ($code): $title"
  echo "Command: $*"
  return "$code"
}

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

is_protected_name() {
  local name="$1"
  shift
  local item
  for item in "$@"; do
    if [ "$name" = "$item" ]; then
      return 0
    fi
  done
  return 1
}

sync_tree() {
  local src="$1"
  local dst="$2"
  shift 2
  local -a protected=("$@")
  mkdir -p "$dst"

  if command -v rsync >/dev/null 2>&1; then
    local rsync_args=(-a --delete)
    local name
    for name in "${protected[@]}"; do
      # exclude: 不从源同步；protect: 目标端已有文件不被 --delete 删掉
      rsync_args+=(--exclude "$name" --filter "P $name")
    done
    rsync "${rsync_args[@]}" "$src/" "$dst/"
    return
  fi

  local item base
  shopt -s dotglob nullglob
  for item in "$dst"/*; do
    [ -e "$item" ] || continue
    base="$(basename "$item")"
    if is_protected_name "$base" "${protected[@]}"; then
      echo "Keep protected file: $dst/$base"
      continue
    fi
    rm -rf "$item" 2>/dev/null || true
  done

  for item in "$src"/* "$src"/.[!.]* "$src"/..?*; do
    [ -e "$item" ] || continue
    base="$(basename "$item")"
    if is_protected_name "$base" "${protected[@]}"; then
      continue
    fi
    cp -a "$item" "$dst/$base"
  done
  shopt -u dotglob nullglob
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
  run_step "Extract api.tar.gz" tar -xzf "$RELEASE_DIR/api.tar.gz" -C "$TMP"
  # 保留运行时数据；node_modules 用 CI 产物覆盖
  run_step "Sync API files" sync_tree "$TMP" "$API_DIR" .env uploads data.db prod.db
  rm -rf "$TMP"
  cd "$API_DIR"
  if [ ! -f .env ]; then
    echo "WARNING: $API_DIR/.env missing — create it before restart"
  else
    echo "DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2- || true)"
  fi
  if [ ! -d node_modules ]; then
    echo "WARNING: api node_modules missing in release; fallback install (may OOM on 1G)"
    run_step "Install API dependencies" npm install --omit=dev --no-fund --no-audit --maxsockets 1
  fi
  run_step "Prisma generate" npx prisma generate
  run_step "Prisma migrate deploy" npx prisma migrate deploy
  run_step "Ensure uploads dir" mkdir -p uploads
  if pm2 describe shangqi-api >/dev/null 2>&1; then
    run_step "Restart shangqi-api" pm2 restart shangqi-api --update-env
  else
    run_step "Start shangqi-api" pm2 start dist/main.js --name shangqi-api --cwd "$API_DIR"
  fi
fi

# ---- Website ----
if [ -f "$RELEASE_DIR/website.tar.gz" ]; then
  echo "==> Website"
  mkdir -p "$WEB_DIR"
  TMP="$(mktemp -d)"
  run_step "Extract website.tar.gz" tar -xzf "$RELEASE_DIR/website.tar.gz" -C "$TMP"
  run_step "Sync website files" sync_tree "$TMP" "$WEB_DIR"
  rm -rf "$TMP"
  cd "$WEB_DIR/.output/server"
  if [ ! -d node_modules ]; then
    echo "WARNING: website node_modules missing; fallback install"
    if command -v yarn >/dev/null 2>&1; then
      run_step "Install website dependencies (yarn)" yarn install --production
    else
      run_step "Install website dependencies (npm)" npm install --omit=dev --no-fund --no-audit --maxsockets 1
    fi
  fi
  if pm2 describe shangqi-web >/dev/null 2>&1; then
    run_step "Restart shangqi-web" pm2 restart shangqi-web --update-env
  else
    run_step "Start shangqi-web" env PORT=3000 HOST=0.0.0.0 pm2 start index.mjs --name shangqi-web --cwd "$WEB_DIR/.output/server"
  fi
fi

# ---- Admin ----
if [ -f "$RELEASE_DIR/admin.tar.gz" ]; then
  echo "==> Admin"
  mkdir -p "$ADMIN_DIR"
  TMP="$(mktemp -d)"
  run_step "Extract admin.tar.gz" tar -xzf "$RELEASE_DIR/admin.tar.gz" -C "$TMP"
  # 保留宝塔 .user.ini（常带不可变属性，强删会失败）
  run_step "Sync admin files" sync_tree "$TMP" "$ADMIN_DIR" .user.ini
  rm -rf "$TMP"
fi

run_step "PM2 save" pm2 save
pm2 status
echo "==> Deploy finished"
