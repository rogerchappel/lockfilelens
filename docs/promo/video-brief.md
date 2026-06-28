# Video Brief: Turn Lockfile Noise Into Reviewer Notes

## Angle

Show the difference between staring at raw lockfile churn and reading a concise local report for dependency review.

## Grounded Demo Assets

- Demo wrapper: `demo/run-lockfile-review.sh`
- Drift fixture: `tests/fixtures/drift`
- Base npm lockfile: `tests/fixtures/npm-a/package-lock.json`
- Head npm lockfile: `tests/fixtures/npm-b/package-lock.json`
- Tutorial: `docs/tutorials/review-dependency-changes.md`

## 60-Second Flow

1. Run `bash demo/run-lockfile-review.sh`.
2. Open `/tmp/lockfilelens-demo/drift-inspection.md` and point out package-manager drift signals.
3. Open `/tmp/lockfilelens-demo/npm-diff.md` and point out changed dependency rows.
4. Show the reviewer checklist generated for the dependency diff.
5. Close on the safety model: read-only local files, no advisory lookup, no package upgrades.

## Claims To Avoid

- Do not claim it proves a dependency update is secure.
- Do not claim it replaces `npm audit`, tests, or human review.
- Do not imply it mutates lockfiles or upgrades packages.
