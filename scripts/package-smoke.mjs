#!/usr/bin/env node
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const tempRoot = await mkdtemp(join(tmpdir(), 'lockfilelens-package-smoke-'));
let tarball;
const releaseUrl =
  'https://github.com/rogerchappel/lockfilelens/releases/download/v0.1.0/lockfilelens-0.1.0.tgz';
const installSource = process.argv.includes('--release') ? releaseUrl : undefined;

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
  if (!installSource) {
    run('npm', ['run', 'build', '--', '--quiet'], { stdio: 'inherit' });
    const packOutput = run('npm', ['pack', '--json']);
    const [{ filename }] = JSON.parse(packOutput);
    tarball = join(repoRoot, filename);
  }

  run('npm', ['init', '-y'], { cwd: tempRoot });
  run('npm', ['install', installSource ?? tarball], { cwd: tempRoot, stdio: 'inherit' });
  await cp(join(repoRoot, 'tests', 'fixtures'), join(tempRoot, 'fixtures'), {
    recursive: true
  });

  const help = run('npx', ['lockfilelens', '--help'], { cwd: tempRoot });
  if (!help.includes('lockfilelens') || !help.includes('Usage:')) {
    throw new Error('installed CLI help output did not look valid');
  }

  const version = run('npx', ['lockfilelens', '--version'], { cwd: tempRoot }).trim();
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`installed CLI version output did not look valid: ${version}`);
  }

  const inspect = run(
    'npx',
    ['lockfilelens', 'inspect', 'fixtures/drift', '--format', 'markdown'],
    { cwd: tempRoot }
  );
  if (!inspect.includes('LockfileLens') || !inspect.includes('yarn.lock')) {
    throw new Error('fixture-backed inspect output did not look valid');
  }

  const diff = run(
    'npx',
    [
      'lockfilelens',
      'diff',
      '--base',
      'fixtures/npm-a/package-lock.json',
      '--head',
      'fixtures/npm-b/package-lock.json',
      '--format',
      'markdown'
    ],
    { cwd: tempRoot }
  );
  if (!diff.includes('LockfileLens Dependency Review') || !diff.includes('left-pad')) {
    throw new Error('fixture-backed diff output did not look valid');
  }

  console.log(
    `package smoke ok (${version}, ${installSource ? 'GitHub release' : 'local pack'})`
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
  if (tarball) {
    await rm(tarball, { force: true });
  }
}
