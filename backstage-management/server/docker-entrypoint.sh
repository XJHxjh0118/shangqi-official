#!/bin/sh
set -e

echo "[api] waiting for database..."
node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const maxAttempts = 60;
(async () => {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await prisma.$connect();
      await prisma.$disconnect();
      console.log('[api] database is ready');
      process.exit(0);
    } catch (err) {
      console.log(`[api] db not ready (${i}/${maxAttempts}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error('[api] database connection timed out');
  process.exit(1);
})();
EOF

echo "[api] syncing schema (prisma db push)..."
npx prisma db push

if [ "${RUN_DB_SEED}" = "true" ]; then
  echo "[api] seeding database..."
  # seed 依赖 ts-node，仅在显式开启时尝试；失败不阻断启动
  npm install ts-node typescript --no-save >/dev/null 2>&1 || true
  npx prisma db seed || echo "[api] seed skipped or failed (non-fatal)"
fi

echo "[api] starting NestJS..."
exec node dist/main.js
