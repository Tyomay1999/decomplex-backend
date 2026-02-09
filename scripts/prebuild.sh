#!/usr/bin/env bash
set -euo pipefail

echo "==> prebuild: install deps"
npm ci

echo "==> prebuild: checks (lint + typecheck)"
npm run check

echo "==> prebuild: tests"
npm run test

echo "==> prebuild: build dist"
rm -rf dist
npm run build

if [[ ! -f "dist/server.js" ]]; then
  echo "ERROR: dist/server.js not found after build."
  exit 1
fi

echo "==> prebuild: OK (dist ready)"
