#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-dev}"
DEV_BUILD="${DEV_BUILD:-0}"
DEV_RECREATE="${DEV_RECREATE:-0}"

args=(up -d --remove-orphans)

if [ "$DEV_BUILD" = "1" ]; then
  args+=(--build)
fi

if [ "$DEV_RECREATE" = "1" ]; then
  args+=(--force-recreate)
fi

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "${args[@]}"
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps

echo
echo "DEV harness is up."
echo "Postgres:  localhost:55432"
echo "Redis:     localhost:56379"
echo "RabbitMQ:  localhost:5673 (UI: http://localhost:15673, user/pass: guest/guest)"
echo "Backend:   http://localhost:4000"
