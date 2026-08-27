#!/usr/bin/env bash
# 在 CI（Ubuntu）里执行：构建三个产物并打进 dist-release/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-release"
# 空字符串时也要用默认值（GitHub vars 未配置时会是空）
SITE_URL="${NUXT_PUBLIC_SITE_URL:-}"
SITE_URL="${SITE_URL:-http://8.134.149.243}"
API_BASE="${NUXT_PUBLIC_API_BASE:-}"
API_BASE="${API_BASE:-http://8.134.149.243/car}"
IMAGE_DOMAINS="${NUXT_IMAGE_DOMAINS:-}"
IMAGE_DOMAINS="${IMAGE_DOMAINS:-8.134.149.243,localhost,127.0.0.1}"

# prisma generate 需要该变量存在（不必是真实库）
export DATABASE_URL="${DATABASE_URL:-file:./ci.db}"
export HUSKY=0
export CI=true

rm -rf "$OUT"
mkdir -p "$OUT"

echo "==> Build API"
cd "$ROOT/backstage-management/server"
npm ci --no-audit --no-fund
npx prisma generate
npm run build
mkdir -p "$OUT/api"
cp -R dist package.json package-lock.json prisma "$OUT/api/"

echo "==> Build Admin"
cd "$ROOT/backstage-management/admin"
cat > .env.production <<'EOF'
VITE_PUBLIC_PATH = /admin/
VITE_ROUTER_HISTORY = "hash"
VITE_API_BASE_URL = /ca
VITE_CDN = false
VITE_COMPRESSION = "none"
VITE_HIDE_HOME = false
EOF
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile || pnpm install
pnpm build
mkdir -p "$OUT/admin"
cp -R dist/. "$OUT/admin/"

echo "==> Build Website"
cd "$ROOT/official-website"
export NUXT_PUBLIC_SITE_URL="$SITE_URL"
export NUXT_PUBLIC_API_BASE="$API_BASE"
export NUXT_PUBLIC_SITE_NAME="${NUXT_PUBLIC_SITE_NAME:-上汽经创}"
export NUXT_IMAGE_DOMAINS="$IMAGE_DOMAINS"
npm ci --no-audit --no-fund
npm run build
# 去掉 Windows 专用 sharp，避免污染 Linux 产物（CI 本身是 linux，仍做一次保险）
if [ -f .output/server/package.json ]; then
  node -e '
    const fs = require("fs");
    const p = JSON.parse(fs.readFileSync(".output/server/package.json","utf8"));
    delete p.dependencies["@img/sharp-win32-x64"];
    delete p.dependencies["@takumi-rs/core-win32-x64-msvc"];
    fs.writeFileSync(".output/server/package.json", JSON.stringify(p, null, 2));
  '
fi
mkdir -p "$OUT/website"
cp -R .output "$OUT/website/"

echo "==> Pack zips"
cd "$OUT"
tar -czf api.tar.gz -C api .
tar -czf admin.tar.gz -C admin .
tar -czf website.tar.gz -C website .
rm -rf api admin website

echo "==> Done: $OUT"
ls -lh "$OUT"
