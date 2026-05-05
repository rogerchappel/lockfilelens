# Release candidate readiness

Generated: 2026-05-05T21:27:44Z
Branch: `release-candidate/readiness`
Base: `main`

## Verification

Status: PASS

Checks run:
- `npm ci`
- `npm run release:check`
- `bash scripts/validate.sh`
- `node releasebox check .`

## Check output summary

    ## npm ci
    ```
    npm ci
    ```
    ```text
    
    added 3 packages, and audited 4 packages in 721ms
    
    found 0 vulnerabilities
    ```
    RESULT: 0 (0s)
    
    ## npm run release:check
    ```
    npm run release:check
    ```
    ```text
    
    > lockfilelens@0.1.0 release:check
    > npm run check && npm test && npm run smoke && npm run package:smoke && npm pack --dry-run
    
    
    > lockfilelens@0.1.0 check
    > tsc --noEmit
    
    
    > lockfilelens@0.1.0 test
    > npm run build -- --quiet && node --test
    
    
    > lockfilelens@0.1.0 build
    > tsc && node scripts/make-cli-executable.mjs --quiet
    
    ✔ parses npm package-lock and marks manifest dependencies direct (7.71575ms)
    ✔ diff classifies added and upgraded direct dependencies (1.123667ms)
    ✔ parses pnpm, yarn, and bun fixtures (1.465042ms)
    ✔ inspect reports duplicate ecosystem signals and package-manager drift (0.696042ms)
    ✔ renders stable markdown reviewer checklist (1.611958ms)
    ✔ CLI emits JSON and redacts secret-like error values (219.119583ms)
    ℹ tests 6
    ℹ suites 0
    ℹ pass 6
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 325.646833
    
    > lockfilelens@0.1.0 smoke
    > bash scripts/smoke.sh
    
    smoke ok
    
    > lockfilelens@0.1.0 package:smoke
    > node scripts/package-smoke.mjs
    
    
    > lockfilelens@0.1.0 build
    > tsc && node scripts/make-cli-executable.mjs --quiet
    
    
    added 1 package in 142ms
    package smoke ok (0.1.0)
    npm notice
    npm notice package: lockfilelens@0.1.0
    npm notice Tarball Contents
    npm notice 1.1kB LICENSE
    npm notice 3.4kB README.md
    npm notice 31B dist/cli.d.ts
    npm notice 5.3kB dist/cli.js
    npm notice 383B dist/engine.d.ts
    npm notice 7.6kB dist/engine.js
    npm notice 267B dist/index.d.ts
    npm notice 234B dist/index.js
    npm notice 570B dist/lockfiles.d.ts
    npm notice 9.1kB dist/lockfiles.js
    npm notice 282B dist/reporters.d.ts
    npm notice 4.5kB dist/reporters.js
    npm notice 1.6kB dist/types.d.ts
    npm notice 11B dist/types.js
    npm notice 1.4kB package.json
    npm notice Tarball Details
    npm notice name: lockfilelens
    npm notice version: 0.1.0
    npm notice filename: lockfilelens-0.1.0.tgz
    npm notice package size: 10.0 kB
    npm notice unpacked size: 35.6 kB
    npm notice shasum: 584e9118517fbac878ca806fad065db9c88545b6
    npm notice integrity: sha512-mvFoHSA8EVQUr[...]iagTMvtMmmI3w==
    npm notice total files: 15
    npm notice
    lockfilelens-0.1.0.tgz
    ```
    RESULT: 0 (5s)
    
    ## bash scripts/validate.sh
    ```
    bash scripts/validate.sh
    ```
    ```text
    Checking lockfilelens required files...
    PASS: required file exists: README.md
    PASS: required file exists: AGENTS.md
    PASS: required file exists: CONTRIBUTING.md
    PASS: required file exists: SECURITY.md
    PASS: required file exists: .github/pull_request_template.md
    PASS: required file exists: scripts/validate.sh
    
    Checking lockfilelens required directories...
    PASS: required directory exists: .github
    PASS: required directory exists: docs
    PASS: required directory exists: scripts
    
    Running local project checks where present...
    NOTE: using package manager: npm
    
    > lockfilelens@0.1.0 check
    > tsc --noEmit
    
    PASS: package script: check
    
    > lockfilelens@0.1.0 test
    > npm run build -- --quiet && node --test
    
    
    > lockfilelens@0.1.0 build
    > tsc && node scripts/make-cli-executable.mjs --quiet
    
    ✔ parses npm package-lock and marks manifest dependencies direct (6.379167ms)
    ✔ diff classifies added and upgraded direct dependencies (0.378625ms)
    ✔ parses pnpm, yarn, and bun fixtures (1.844625ms)
    ✔ inspect reports duplicate ecosystem signals and package-manager drift (0.809416ms)
    ✔ renders stable markdown reviewer checklist (0.338125ms)
    ✔ CLI emits JSON and redacts secret-like error values (107.016958ms)
    ℹ tests 6
    ℹ suites 0
    ℹ pass 6
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 191.449166
    PASS: package script: test
    
    > lockfilelens@0.1.0 build
    > tsc && node scripts/make-cli-executable.mjs
    
    PASS: package script: build
    NOTE: agent-qc not installed; skipping optional agent check
    
    Validation passed.
    ```
    RESULT: 0 (2s)
    
    ## ReleaseBox check
    ```
    node '/Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js' check .
    ```
    ```text
    ✅ releasebox config: node-cli
    ✅ ci workflow: .github/workflows/ci.yml
    ✅ release dry run workflow: .github/workflows/release-dry-run.yml
    ✅ task breakdown: docs/TASKS.md
    ✅ orchestration plan: docs/ORCHESTRATION.md
    ✅ dependabot config: .github/dependabot.yml
    ✅ npm test script: npm run build -- --quiet && node --test
    ✅ build script: tsc && node scripts/make-cli-executable.mjs
    ✅ smoke script: bash scripts/smoke.sh
    ✅ bin entry: {"lockfilelens":"./dist/cli.js"}
    ```
    RESULT: 0 (0s)
    
