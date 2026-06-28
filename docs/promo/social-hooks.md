# LockfileLens Social Hooks

## Short hooks

- Lockfile diffs are noisy. LockfileLens turns them into reviewer notes: what changed, whether it was direct or transitive, and what to check before merging.
- Before a dependency PR merges, run one local command for package-manager drift and another for the lockfile diff.
- Demo idea: inspect a drift fixture, then compare two npm lockfiles and show the generated reviewer checklist.
- The demo writes `/tmp/lockfilelens-demo/drift-inspection.md` and `/tmp/lockfilelens-demo/npm-diff.md`, so a screen recording can show the generated reports without editing repo files.

## Demo CTA

```sh
npm run build
bash demo/run-lockfile-review.sh
```

Open the two generated Markdown reports and highlight the inspection heading, dependency review heading, and reviewer checklist.

## Launch note draft

LockfileLens is a local-first CLI for dependency review. It inspects npm, pnpm, Yarn, and Bun project signals for lockfile hygiene, then explains lockfile diffs in Markdown, JSON, or text. It is designed for PR review, agent handoffs, and release notes where reviewers need concise evidence from files already in the repository.

Limitations: LockfileLens does not upgrade packages, run network audits, or replace the project test suite. It explains local lockfile state so a human can review dependency intent.
