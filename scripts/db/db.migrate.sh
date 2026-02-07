#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-dev}"
SERVICE="${SERVICE:-backend}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

COMPOSE_FILE="$COMPOSE_FILE" PROJECT_NAME="$PROJECT_NAME" SERVICE="$SERVICE" \
  "$SCRIPT_DIR/db.exec.sh" "node dist/database/runMigrations.js"
