#!/usr/bin/env bash
set -euo pipefail

E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:4100}"

export E2E_BASE_URL
export E2E_MODE=docker
export E2E_USE_EXISTING_SERVER=true

npm run test:e2e:docker