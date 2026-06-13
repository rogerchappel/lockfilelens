#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build >/dev/null

out_dir="${TMPDIR:-/tmp}/lockfilelens-demo"
mkdir -p "$out_dir"

node dist/cli.js inspect tests/fixtures/drift \
  --format markdown > "$out_dir/drift-inspection.md"

node dist/cli.js diff \
  --base tests/fixtures/npm-a/package-lock.json \
  --head tests/fixtures/npm-b/package-lock.json \
  --format markdown > "$out_dir/npm-diff.md"

grep -q 'LockfileLens Inspection' "$out_dir/drift-inspection.md"
grep -q 'LockfileLens Dependency Review' "$out_dir/npm-diff.md"
grep -q 'Reviewer checklist' "$out_dir/npm-diff.md"

printf 'wrote %s/drift-inspection.md and %s/npm-diff.md\n' "$out_dir" "$out_dir"
