#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-dev}"

if [[ "${1:-}" == "--volumes" ]]; then
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v --remove-orphans
  echo "DEV harness stopped and volumes removed."
else
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down --remove-orphans
  echo "DEV harness stopped."
fi
