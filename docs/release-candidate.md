# Release candidate readiness

Generated: 2026-05-05T21:25:03Z
Branch: `release-candidate/readiness`
Base: `origin/main`

## Verification

Status: BLOCKED - one or more local readiness checks failed

Checks run:
- `npm run release:check`
- `bash scripts/validate.sh`
- `node releasebox check .`

## Check output summary

    ## npm run release:check
    ```
    npm run release:check
    ```
    ```text
    
    > lockfilelens@0.1.0 release:check
    > npm run check && npm test && npm run smoke && npm run package:smoke && npm pack --dry-run
    
    
    > lockfilelens@0.1.0 check
    > tsc --noEmit
    
    src/cli.ts(2,30): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/cli.ts(3,34): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/cli.ts(4,31): error TS2307: Cannot find module 'node:url' or its corresponding type declarations.
    src/cli.ts(19,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(23,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,69): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(37,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(46,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,71): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(83,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(84,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(116,52): error TS2339: Property 'url' does not exist on type 'ImportMeta'.
    src/cli.ts(125,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(125,27): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(128,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(129,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/engine.ts(1,38): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/engine.ts(2,31): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/lockfiles.ts(1,52): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/lockfiles.ts(2,50): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    ```
    RESULT: 2 (1s)
    
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
    
    src/cli.ts(2,30): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/cli.ts(3,34): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/cli.ts(4,31): error TS2307: Cannot find module 'node:url' or its corresponding type declarations.
    src/cli.ts(19,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(23,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,69): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(37,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(46,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,71): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(83,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(84,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(116,52): error TS2339: Property 'url' does not exist on type 'ImportMeta'.
    src/cli.ts(125,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(125,27): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(128,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(129,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/engine.ts(1,38): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/engine.ts(2,31): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/lockfiles.ts(1,52): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/lockfiles.ts(2,50): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    FAIL: package script: check
    
    > lockfilelens@0.1.0 test
    > npm run build -- --quiet && node --test
    
    
    > lockfilelens@0.1.0 build
    > tsc && node scripts/make-cli-executable.mjs --quiet
    
    src/cli.ts(2,30): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/cli.ts(3,34): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/cli.ts(4,31): error TS2307: Cannot find module 'node:url' or its corresponding type declarations.
    src/cli.ts(19,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(23,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,69): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(37,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(46,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,71): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(83,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(84,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(116,52): error TS2339: Property 'url' does not exist on type 'ImportMeta'.
    src/cli.ts(125,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(125,27): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(128,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(129,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/engine.ts(1,38): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/engine.ts(2,31): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/lockfiles.ts(1,52): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/lockfiles.ts(2,50): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    FAIL: package script: test
    
    > lockfilelens@0.1.0 build
    > tsc && node scripts/make-cli-executable.mjs
    
    src/cli.ts(2,30): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/cli.ts(3,34): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/cli.ts(4,31): error TS2307: Cannot find module 'node:url' or its corresponding type declarations.
    src/cli.ts(19,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(23,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(29,69): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(37,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(46,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(48,71): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(83,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(84,7): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(116,52): error TS2339: Property 'url' does not exist on type 'ImportMeta'.
    src/cli.ts(125,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(125,27): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(128,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/cli.ts(129,3): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
    src/engine.ts(1,38): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/engine.ts(2,31): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    src/lockfiles.ts(1,52): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    src/lockfiles.ts(2,50): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
    FAIL: package script: build
    NOTE: agent-qc not installed; skipping optional agent check
    
    Validation failed.
    ```
    RESULT: 1 (1s)
    
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
    
