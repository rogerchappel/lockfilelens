#!/usr/bin/env node
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const tempRoot = await mkdtemp(join(tmpdir(), 'lockfilelens-package-smoke-'));
let tarball;

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
    env: {
      ...process.env,
      npm_config_fund: 'false',
      npm_config_audit: 'false'
    }
  });
}

try {
  run('npm', ['run', 'build', '--', '--quiet'], { stdio: 'inherit' });
  const packOutput = run('npm', ['pack', '--json']);
  const [{ filename }] = JSON.parse(packOutput);
  tarball = join(repoRoot, filename);

  run('npm', ['init', '-y'], { cwd: tempRoot });
  run('npm', ['install', tarball], { cwd: tempRoot, stdio: 'inherit' });

  const help = run('npx', ['lockfilelens', '--help'], { cwd: tempRoot });
  if (!help.includes('lockfilelens') || !help.includes('Usage:')) {
    throw new Error('installed CLI help output did not look valid');
  }

  const version = run('npx', ['lockfilelens', '--version'], { cwd: tempRoot }).trim();
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`installed CLI version output did not look valid: ${version}`);
  }

  console.log(`package smoke ok (${version})`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
  if (tarball) {
    await rm(tarball, { force: true });
  }
}
