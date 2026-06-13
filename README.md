# lockfilelens

lockfilelens is a local-first CLI that turns package manager lockfile state and dependency resolution diffs into concise reviewer notes.

It inspects npm, pnpm, Yarn, and Bun project signals for package-manager drift, stale or missing lockfiles, duplicate ecosystem signals, and dependency changes. Core commands are read-only and make no network calls.

## 60-second demo

```sh
npm install
npm test

# Inspect a project for package-manager drift and stale/missing lockfiles.
node dist/cli.js inspect tests/fixtures/drift --format markdown

# Explain a lockfile change for a PR or agent handoff.
node dist/cli.js diff \
  --base tests/fixtures/npm-a/package-lock.json \
  --head tests/fixtures/npm-b/package-lock.json \
  --format markdown
```

Generate both demo reports in one pass:

```sh
bash demo/run-lockfile-review.sh
```

See [Review Dependency Changes With LockfileLens](docs/tutorials/review-dependency-changes.md) for the fixture-backed walkthrough.

## Install

```sh
npm install lockfilelens
lockfilelens --help
```

For local development from this repository:

```sh
npm install
npm run check
npm test
npm run build
npm run smoke
```

## CLI reference

```sh
lockfilelens inspect [project-or-lockfile] [--format markdown|json|text]
lockfilelens diff --base <lockfile> --head <lockfile> [--format markdown|json|text]
lockfilelens summary [project-or-lockfile] [--format markdown|json|text]
```

### `inspect`

Reports project-level dependency hygiene:

- recognized lockfiles: `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`
- package-manager drift between `packageManager`, scripts, and lockfiles
- missing lockfiles when `package.json` declares dependencies
- lockfiles older than `package.json`
- duplicate resolved package versions inside a lockfile

### `diff`

Compares two lockfiles of the same ecosystem and classifies changes as:

- added
- removed
- upgraded
- downgraded
- changed

When a nearby `package.json` exists, changes are marked as direct or transitive.

### Formats

- `markdown` — reviewer-oriented PR summary and checklist
- `json` — stable machine-readable report for agents and CI
- `text` — compact terminal summary

## Example agent handoff snippet

```md
## Lockfile review

Generated with:

lockfilelens diff --base main/package-lock.json --head HEAD/package-lock.json --format markdown

Key points:
- Direct dependency changes match the task intent.
- No package-manager drift detected.
- Reviewer should focus on removals, downgrades, and duplicate resolved versions.
```

## Safety model

- Read-only core commands.
- Offline by default; no hidden advisory lookups, telemetry, or hosted service calls.
- Structured errors redact obvious token/password/secret/API-key values.
- No destructive filesystem or Git operations.

## Non-goals

- No automatic dependency upgrades.
- No mandatory network audit.
- No full SBOM platform.
- No publish, merge, or PR automation.

## Verify

Run the local validation script before opening a pull request:

```sh
npm run release:check
bash scripts/validate.sh
```

`npm run release:check` runs typecheck, tests, source smoke, packed-package install smoke, and `npm pack --dry-run`. When dogfooding with a sibling ReleaseBox checkout, also run:

```sh
node ../releasebox/bin/releasebox.js check .
```

## Documentation

- [Product requirements](docs/PRD.md)
- [Task breakdown](docs/TASKS.md)
- [Orchestration plan](docs/ORCHESTRATION.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

MIT
