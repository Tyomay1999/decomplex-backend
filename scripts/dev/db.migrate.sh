#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-dev}"
SERVICE="${SERVICE:-backend}"

export COMPOSE_FILE PROJECT_NAME SERVICE

scripts/db/db.migrate.sh