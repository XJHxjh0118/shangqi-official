#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  Official Demo - Stop All"
echo "========================================"
echo

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti ":$port" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      echo "Killing port $port (PIDs: $pids)"
      echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "$port/tcp" 2>/dev/null || true
  fi
}

for port in 3000 3001 8848; do
  kill_port "$port"
done

echo "Done."
echo "If dev servers were started in other terminals, stop them with Ctrl+C."
echo "========================================"
