#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MGMT="$ROOT/backstage-management"
FRONT="$ROOT/official-website"
API="$MGMT/server"

echo "========================================"
echo "  Official Demo - One Click Start"
echo "========================================"
echo

for dir in "$MGMT" "$FRONT"; do
  if [[ ! -d "$dir" ]]; then
    echo "[ERROR] Folder not found: $dir"
    exit 1
  fi
done

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js not found. Install from https://nodejs.org"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm not found."
  exit 1
fi

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi
  echo "[INFO] pnpm not found, enabling via corepack..."
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@latest --activate
  command -v pnpm >/dev/null 2>&1
}

if ! ensure_pnpm; then
  echo "[ERROR] pnpm not available. Run: corepack enable"
  exit 1
fi

release_dev_locks() {
  for port in 3000 3001 8848; do
    if command -v lsof >/dev/null 2>&1; then
      pids="$(lsof -ti ":$port" 2>/dev/null || true)"
      if [[ -n "$pids" ]]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
      fi
    elif command -v fuser >/dev/null 2>&1; then
      fuser -k "$port/tcp" 2>/dev/null || true
    fi
  done
  sleep 2
}

wait_port() {
  local port="$1"
  local max="${2:-60}"
  echo "      Waiting for port $port (max ${max}s)..."
  for ((i = 0; i < max; i++)); do
    if (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
      echo "      Port $port ready after ~$((i * 2))s"
      return 0
    fi
    if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 "$port" 2>/dev/null; then
      echo "      Port $port ready after ~$((i * 2))s"
      return 0
    fi
    if ((i % 5 == 0 && i > 0)); then
      echo "      still waiting... $((i * 2))s"
    fi
    sleep 2
  done
  return 1
}

release_dev_locks

echo "[1/5] Check env files..."
[[ -f "$API/.env" ]] || cp "$API/.env.example" "$API/.env"
[[ -f "$FRONT/.env" ]] || cp "$FRONT/.env.example" "$FRONT/.env"

echo "[2/5] Check backend dependencies..."
if [[ ! -d "$MGMT/node_modules/concurrently" ]]; then
  echo "      Installing backstage-management root deps..."
  (cd "$MGMT" && npm install)
fi
if [[ ! -d "$API/node_modules" ]]; then
  echo "      Installing API deps..."
  (cd "$API" && npm install)
fi
if [[ ! -d "$MGMT/admin/node_modules" ]]; then
  echo "      Installing admin deps with pnpm..."
  (cd "$MGMT/admin" && pnpm install)
fi

echo "[3/5] Check database..."
(
  cd "$API"
  if [[ ! -f node_modules/.prisma/client/index.js ]]; then
    echo "      Generating Prisma client..."
    npm run prisma:generate
  else
    echo "      Prisma client OK, skip generate."
  fi
  if [[ ! -f dev.db && ! -f prisma/dev.db ]]; then
    echo "      Initializing local database..."
    npx prisma db push --accept-data-loss
    npm run prisma:seed
  fi
)

echo "[4/5] Check frontend dependencies..."
if [[ ! -d "$FRONT/node_modules/nuxt" ]]; then
  echo "      Installing official-website deps..."
  (cd "$FRONT" && npm install)
fi

echo "[5/5] Start services..."
echo
echo "Starting backend API + admin..."
echo "  API:   http://127.0.0.1:3001/car"
echo "  Admin: http://localhost:8848"
(
  cd "$MGMT"
  npm run dev
) &
BACKEND_PID=$!

if ! wait_port 3001 90; then
  echo "[WARN] API port 3001 not ready yet. Check backend logs."
fi

echo "Starting official website..."
echo "  Web: http://localhost:3000"
(
  cd "$FRONT"
  npm run dev
) &
FRONT_PID=$!

if ! wait_port 3000 120; then
  echo "[WARN] Website port 3000 not ready yet. First compile may take 1-2 min."
else
  echo "      Website is ready."
fi

if command -v open >/dev/null 2>&1; then
  open "http://localhost:3000" || true
  sleep 2
  open "http://localhost:8848" || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:3000" || true
  sleep 2
  xdg-open "http://localhost:8848" || true
fi

echo
echo "========================================"
echo "  Start Complete"
echo "========================================"
echo "  Website:   http://localhost:3000"
echo "  Admin:     http://localhost:8848"
echo "  API Docs:  http://127.0.0.1:3001/car/docs"
echo "  Login:     admin / admin123"
echo
echo "  Press Ctrl+C to stop both services."
echo "========================================"

trap 'kill $BACKEND_PID $FRONT_PID 2>/dev/null || true; exit 0' INT TERM
wait
