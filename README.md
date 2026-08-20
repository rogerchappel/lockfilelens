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

lockfilelens is distributed as a GitHub release package. npm registry publishing is
currently disabled, so `npm install lockfilelens` will not work. Install v0.1.0
directly from its release asset:

```sh
npm install https://github.com/rogerchappel/lockfilelens/releases/download/v0.1.0/lockfilelens-0.1.0.tgz
lockfilelens --help
```

Or install the current source checkout:

```sh
git clone https://github.com/rogerchappel/lockfilelens.git
cd lockfilelens
npm install
npm run build
npm link
lockfilelens --help
```

For local development from this repository:

```sh
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

The optional input must exist and be either a directory or a recognized lockfile.
Invalid, unreadable, or unsupported file inputs print an error to stderr and exit
nonzero instead of producing an empty inspection.

- recognized lockfiles: `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`
- pnpm lockfiles support modern `name@version` keys (including peer-qualified keys) and legacy pnpm 5 slash-form `/name/version` and `/@scope/name/version` keys
- package-manager drift between `packageManager`, scripts, and lockfiles
- missing lockfiles when `package.json` declares dependencies
- lockfiles older than `package.json`
- duplicate resolved package versions inside a lockfile

### `diff`

Compares two lockfiles of the same ecosystem and classifies changes as:

Both inputs must be readable files with one of the recognized lockfile names
listed above. Missing paths, directories, unreadable files, and unsupported
filenames print an error to stderr and exit nonzero.

- added
- removed
- upgraded
- downgraded
- changed

When a nearby `package.json` exists, changes are marked as direct or transitive.

Diffs compare the complete resolved-version set for each package name, rather
than only its highest version. Unchanged version/scope pairs are discarded,
equal versions with a scope change are paired, and then remaining versions are
paired in ascending version order. Surplus head or base resolutions are
reported as additions or removals. This makes multi-version changes stable and
ensures an upgrade such as `{1.0.0, 2.0.0}` to `{1.1.0, 2.0.0}` is not hidden.

Each changed resolution contributes one summary entry. A directness-only change
uses the `changed` type and renders its scope transition (for example,
`direct -> transitive`). Removals and downgrades are high risk; changes involving
a direct resolution are at least medium risk.

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

`npm run release:check` runs typecheck, tests, source smoke, local packed-package
install smoke, the documented GitHub release install smoke, and
`npm pack --dry-run`. Both install smokes run `--help` plus fixture-backed
`inspect` and `diff` commands in a disposable directory. When dogfooding with a
sibling ReleaseBox checkout, also run:

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

## Verification

Run the release-readiness checks that match this package before publishing or opening a release PR.

- `npm run package:smoke` - verify npm pack contents
