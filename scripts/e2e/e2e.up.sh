#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.e2e.yml}"
PROJECT_NAME="${PROJECT_NAME:-decomplex-e2e}"

E2E_BUILD="${E2E_BUILD:-0}"
E2E_RECREATE="${E2E_RECREATE:-0}"

args=(up -d --remove-orphans)

if [ "$E2E_BUILD" = "1" ]; then
  args+=(--build)
fi

if [ "$E2E_RECREATE" = "1" ]; then
  args+=(--force-recreate)
fi

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "${args[@]}"
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps

echo
echo "E2E harness is up."
echo "Postgres:  localhost:55433"
echo "Redis:     localhost:56380"
echo "RabbitMQ:  localhost:5674 (UI: http://localhost:15674, user/pass: guest/guest)"
echo "Backend:   http://localhost:4100"
