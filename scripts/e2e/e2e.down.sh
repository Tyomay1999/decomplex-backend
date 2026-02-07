#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.e2e.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-e2e}"

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down --remove-orphans
