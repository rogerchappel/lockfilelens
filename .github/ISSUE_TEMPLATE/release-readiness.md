---
name: Release readiness
about: Track whether lockfilelens can safely release end-to-end
title: 'Release readiness: <version or date>'
labels: release,e2e,ci
---

## Release goal

- Target version/date:
- Release owner:
- Package/artifact targets: GitHub release tarball; npm publish remains disabled pending human review.

## Required checks

- [ ] CI is green on main
- [ ] `npm run release:check` passes locally
- [ ] Source CLI smoke passes
- [ ] Installed/package artifact smoke passes
- [ ] Realistic lockfile fixture coverage passes
- [ ] Release notes generated from merged PRs/issues
- [ ] GitHub release dry-run completed
- [ ] npm publish dry-run decision reviewed

## Blockers

- [ ] No known release blockers

## Post-release verification

- [ ] Download package artifact from GitHub release
- [ ] Run documented quickstart
- [ ] Confirm `lockfilelens --version` matches release
