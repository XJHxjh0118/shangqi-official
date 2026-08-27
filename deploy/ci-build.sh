#!/usr/bin/env bash
# 在 CI（Ubuntu）里执行：构建三个产物并打进 dist-release/
# 产物内含 Linux 生产依赖，1G 服务器无需再 npm install
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-release"
SITE_URL="${NUXT_PUBLIC_SITE_URL:-}"
SITE_URL="${SITE_URL:-http://8.134.149.243}"
API_BASE="${NUXT_PUBLIC_API_BASE:-}"
API_BASE="${API_BASE:-http://8.134.149.243/car}"
IMAGE_DOMAINS="${NUXT_IMAGE_DOMAINS:-}"
IMAGE_DOMAINS="${IMAGE_DOMAINS:-8.134.149.243,localhost,127.0.0.1}"

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
# 重新装仅生产依赖（含 prisma CLI，供服务器 migrate）
rm -rf node_modules
npm ci --omit=dev --no-audit --no-fund
npm install prisma@6.19.0 --no-save --no-audit --no-fund
npx prisma generate
mkdir -p "$OUT/api"
cp -R dist package.json package-lock.json prisma node_modules "$OUT/api/"

echo "==> Build Admin"
cd "$ROOT/backstage-management/admin"
cat > .env.production <<'EOF'
VITE_PUBLIC_PATH = /admin/
VITE_ROUTER_HISTORY = "hash"
VITE_API_BASE_URL = /car
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
if [ -f .output/server/package.json ]; then
  node -e '
    const fs = require("fs");
    const p = JSON.parse(fs.readFileSync(".output/server/package.json","utf8"));
    delete p.dependencies["@img/sharp-win32-x64"];
    delete p.dependencies["@takumi-rs/core-win32-x64-msvc"];
    fs.writeFileSync(".output/server/package.json", JSON.stringify(p, null, 2));
  '
  # nitro 生成的 package.json 用 npm 常报 edgesOut；改用 yarn（与线上一致）
  corepack enable
  corepack prepare yarn@1.22.22 --activate
  (cd .output/server && yarn install --production --ignore-engines)
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
