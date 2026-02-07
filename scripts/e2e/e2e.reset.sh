#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.e2e.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-e2e}"
SERVICE="${E2E_SERVICE:-backend-e2e}"

export COMPOSE_FILE PROJECT_NAME SERVICE

SEED=1 scripts/db/db.reset.sh
