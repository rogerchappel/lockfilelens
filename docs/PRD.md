# PRD: lockfilelens

Status: ready
Decision: build now

## Scorecard

Total: 86/100
Band: build now
Last scored: 2026-05-02
Scored by: Atlas

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 17/20 | Clear pain in high-throughput agentic development workflows. |
| Demand signal | 18/20 | Strong internal OSS sprint need plus adjacent public tooling demand. |
| V1 buildability | 18/20 | Feasible as a deterministic local-first CLI with fixtures and smoke tests. |
| Differentiation | 13/15 | Focused on agent handoff/review gaps rather than broad platform replacement. |
| Agentic workflow leverage | 14/15 | Directly improves agent dispatch, supervision, verification, or handoff quality. |
| Distribution potential | 6/10 | Easy to demo with real repo/PR workflows and build-in-public examples. |

## Pitch

A dependency-change explainer that turns lockfile diffs into concise risk notes for PRs and agent handoffs.

## Why It Matters

Package lock diffs are huge and easy to ignore. Agent PRs often upgrade transitive packages without clearly stating risk. LockfileLens summarizes added, removed, upgraded, downgraded, and suspicious dependency changes in a review-friendly format.

## Qualification

### Pub Test

“A dependency-change explainer that turns lockfile diffs into concise risk notes for PRs and agent handoffs.” is understandable in one sentence by a developer who has used coding agents, CI, or multi-branch OSS workflows.

### Competitors / Adjacent Tools

- Dependabot/Renovate — automate upgrades and surface advisories, but do not produce lightweight local PR explanations for arbitrary lock diffs.
- npm/yarn/pnpm audit — security-focused, not holistic dependency review.
- GitHub dependency review — useful but platform-bound.

### Star / Demand Signal

Agent coding workflows, CI-heavy repos, and local OSS factories repeatedly need better proof, isolation, reproducibility, and review affordances. The recent sprint pipeline already has `repoctx`, `taskbrief`, `branchbrief`, `qualitygate`, `prpack`, `tooltrace`, `stackforge`, and `crewcmd`; this idea fills a neighboring gap without replacing those projects.

### Real Problem

Roger's OSS sprint is pushing multiple agents, repos, branches, checks, and handoffs at once. This project removes one recurring source of ambiguity or failure from that pipeline while remaining useful to any developer team adopting coding agents.

### V1 Buildability

V1 can be implemented as a TypeScript CLI using deterministic filesystem/git/process operations, fixture repos, and Markdown/JSON output. It does not require a hosted backend, hidden LLM calls, or privileged credentials.

## V1 Scope

- Parse npm `package-lock.json`, `pnpm-lock.yaml`, and Yarn lockfiles enough for V1 summaries.
- Compare base/head lockfiles from git refs or file paths.
- Classify direct vs transitive changes when package manifests are present.
- Emit Markdown and JSON risk summary.
- Optional advisory enrichment only when explicitly requested; offline mode default.
- PR snippet with reviewer checklist.

## Out of Scope

- No automatic dependency changes.
- No mandatory network audit.
- No full SBOM platform.

## CLI/API Sketch

```bash
lockfilelens diff main..HEAD
lockfilelens diff --base ./fixtures/a/pnpm-lock.yaml --head ./fixtures/b/pnpm-lock.yaml
lockfilelens summary --format markdown > LOCKFILE_REVIEW.md
```

## Verification

- Fixture tests for npm, pnpm, and Yarn lock diff classification.
- Golden Markdown snapshots.
- Offline default test with network disabled/mocked.
- CLI exit code tests for high-risk changes.

## Agent Prompt

Build `lockfilelens`, a local-first CLI that explains dependency lockfile changes for reviewers. Start with deterministic parsers, clear JSON/Markdown output, and conservative risk classification without hidden network calls.
