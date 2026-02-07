#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:?}"
PROJECT_NAME="${PROJECT_NAME:?}"
SERVICE="${SERVICE:?}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T "$SERVICE" sh -lc "$*"
