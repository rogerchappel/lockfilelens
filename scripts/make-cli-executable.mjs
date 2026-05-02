import { chmodSync, existsSync } from 'node:fs';
if (existsSync('dist/cli.js')) chmodSync('dist/cli.js', 0o755);
