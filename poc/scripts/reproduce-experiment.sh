#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== CKES Experiment Reproduction ==="
docker compose -f db/docker-compose.yml up -d
sleep 3
npm install
npm run db:migrate
npm run bootstrap:knowledge
npm run corpus:seed
npm run pipeline:run -- --stage seed
npm run lifecycle:run
npm run pipeline:run -- --stage seed
npm run experiment:progressive
npm run evaluate
echo "=== Reproduction complete ==="
