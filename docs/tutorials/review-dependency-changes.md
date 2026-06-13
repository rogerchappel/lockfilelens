# Review Dependency Changes With LockfileLens

LockfileLens turns lockfile state into reviewer notes for package-manager drift and dependency resolution changes. This recipe uses the repository's test fixtures so it can run offline.

## Inspect package-manager drift

```sh
npm install
npm run build
node dist/cli.js inspect tests/fixtures/drift --format markdown > /tmp/lockfilelens-drift.md
```

The drift fixture contains duplicate ecosystem signals, so the report gives reviewers a checklist before a dependency PR merges.

## Compare two npm lockfiles

```sh
node dist/cli.js diff \
  --base tests/fixtures/npm-a/package-lock.json \
  --head tests/fixtures/npm-b/package-lock.json \
  --format markdown > /tmp/lockfilelens-npm-diff.md
```

The Markdown output summarizes added, removed, upgraded, downgraded, and changed packages, then labels direct and transitive changes when nearby package metadata is available.

## Demo shortcut

```sh
bash demo/run-lockfile-review.sh
```

The script writes both reports under `/tmp/lockfilelens-demo` and checks for the expected report headings and reviewer checklist.

## Review talking points

- Core commands are read-only and do not perform advisory lookups or telemetry.
- `inspect` is for project hygiene signals such as stale or missing lockfiles.
- `diff` is for PR review notes when a lockfile changed.
