---
name: E2E test gap
about: Capture a missing end-to-end confidence check
title: 'E2E gap: <scenario>'
labels: e2e,test-gap
---

## User workflow

Describe the real lockfile review path this project must prove.

## Current coverage

What exists today?

## Missing proof

- [ ] Source run smoke
- [ ] Packaged install smoke
- [ ] Fixture input/output assertion
- [ ] Failure-path assertion
- [ ] CI coverage

## Acceptance criteria

- [ ] The workflow fails before the fix or would have caught a real regression
- [ ] The workflow runs in CI
- [ ] The workflow is documented for local execution
