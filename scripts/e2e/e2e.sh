#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

WAIT_TIMEOUT_SEC="${WAIT_TIMEOUT_SEC:-180}"
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:4100}"
E2E_DOWN_AFTER="${E2E_DOWN_AFTER:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WAIT_TIMEOUT_SEC="$WAIT_TIMEOUT_SEC" E2E_BASE_URL="$E2E_BASE_URL" "$SCRIPT_DIR/e2e.ensure.sh"

"$SCRIPT_DIR/e2e.reset.sh"

"$SCRIPT_DIR/e2e.ensure.sh" >/dev/null 2>&1 || true
curl -fsS "${E2E_BASE_URL}/api/vacancies" >/dev/null 2>&1 || {
  echo "[e2e] ERROR: data-ready endpoint not reachable: ${E2E_BASE_URL}/api/vacancies"
  exit 1
}

E2E_BASE_URL="$E2E_BASE_URL" "$SCRIPT_DIR/e2e.run.sh"

if [ "$E2E_DOWN_AFTER" = "1" ]; then
  "$SCRIPT_DIR/e2e.down.sh"
fi
