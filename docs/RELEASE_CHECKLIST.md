# Release checklist: lockfilelens

Publishing is conservative by default. GitHub release artifacts are allowed after review; npm and Homebrew publishing stay disabled until a maintainer explicitly approves them.

## Before tagging

- [ ] Confirm `releasebox.config.json` still has `publishNpm: false` and `updateHomebrew: false` unless publishing has been approved.
- [ ] Run `npm ci` from a clean checkout.
- [ ] Run `npm run release:check`.
- [ ] Run `node ../releasebox/bin/releasebox.js check .` when dogfooding from the local ReleaseBox checkout.
- [ ] Confirm the package smoke installs the packed tarball and exercises `lockfilelens --help` and `lockfilelens --version`.
- [ ] Review the release dry-run workflow artifact and generated release notes preview.
- [ ] Update or open a release-readiness issue for any remaining blocker.

## Tag and GitHub release

- [ ] Create an annotated `vX.Y.Z` tag only after the local and CI gates pass.
- [ ] Let the tag-gated release workflow create the GitHub release and attach the packed `.tgz` artifact.
- [ ] Verify the GitHub release body includes the checklist context and relevant commits.

## Post-release verification

- [ ] Download the attached `.tgz` artifact in a clean temp project.
- [ ] Install it and run `npx lockfilelens --help`.
- [ ] Run the README quickstart against a fixture project.
- [ ] Record any npm/Homebrew follow-up as separate reviewed issues.
