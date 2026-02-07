#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.e2e.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-e2e}"
WAIT_TIMEOUT_SEC="${WAIT_TIMEOUT_SEC:-180}"
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:4100}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

wait_http() {
  local url="$1"
  local start_ts now_ts elapsed
  start_ts="$(date +%s)"

  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    now_ts="$(date +%s)"
    elapsed="$((now_ts - start_ts))"
    if [ "$elapsed" -ge "$WAIT_TIMEOUT_SEC" ]; then
      echo "[e2e] ERROR: timeout waiting for HTTP: $url"
      return 1
    fi

    sleep 0.5
  done
}

stack_exists() {
  local ids
  ids="$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps -q 2>/dev/null || true)"
  [ -n "${ids}" ]
}

echo "[e2e] ensure: checking stack..."
if stack_exists; then
  echo "[e2e] ensure: stack exists, probing ${E2E_BASE_URL}/health..."
  if wait_http "${E2E_BASE_URL}/health"; then
    echo "[e2e] ensure: already up"
    exit 0
  fi
  echo "[e2e] ensure: stack exists but backend not reachable, running up..."
fi

E2E_BUILD=0 E2E_RECREATE=0 "$SCRIPT_DIR/e2e.up.sh"

echo "[e2e] ensure: waiting backend..."
wait_http "${E2E_BASE_URL}/health"
echo "[e2e] ensure: OK"