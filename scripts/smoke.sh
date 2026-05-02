#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
npm run build -- --quiet >/dev/null
node dist/cli.js --help >/dev/null
node dist/cli.js inspect tests/fixtures/drift --format json | grep 'duplicateEcosystemSignals' >/dev/null
node dist/cli.js diff --base tests/fixtures/npm-a/package-lock.json --head tests/fixtures/npm-b/package-lock.json --format json | grep 'left-pad' >/dev/null
printf 'smoke ok\n'
