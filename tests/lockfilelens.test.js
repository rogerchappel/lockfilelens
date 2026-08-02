import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { diffLockfiles, inspectProject, parseLockfile, renderDiff } from '../dist/index.js';

const cli = new URL('../dist/cli.js', import.meta.url).pathname;
const fixture = (path) => new URL(`fixtures/${path}`, import.meta.url).pathname;

test('parses npm package-lock and marks manifest dependencies direct', () => {
  const lock = parseLockfile(fixture('npm-b/package-lock.json'));
  assert.equal(lock.manager, 'npm');
  assert.equal(lock.packageCount, 3);
  assert.equal(lock.packages.find((pkg) => pkg.name === 'left-pad')?.direct, true);
});

test('diff classifies added and upgraded direct dependencies', () => {
  const report = diffLockfiles(fixture('npm-a/package-lock.json'), fixture('npm-b/package-lock.json'));
  assert.equal(report.summary.total, 2);
  assert.equal(report.summary.added, 1);
  assert.equal(report.summary.upgraded, 1);
  assert.equal(report.changes.find((change) => change.name === 'left-pad')?.type, 'upgraded');
  assert.equal(report.changes.find((change) => change.name === 'is-number')?.direct, true);
});

test('diff compares every resolved version and directness deterministically', () => {
  const report = diffLockfiles(fixture('npm-multi-a/package-lock.json'), fixture('npm-multi-b/package-lock.json'));

  assert.deepEqual(report.changes, [
    { name: 'foo', from: '1.0.0', to: '1.1.0', type: 'upgraded', direct: false, fromDirect: false, toDirect: false },
    { name: 'shared', from: '3.0.0', to: '3.0.0', type: 'changed', direct: true, fromDirect: true, toDirect: false }
  ]);
  assert.deepEqual(report.summary, {
    total: 2,
    added: 0,
    removed: 0,
    upgraded: 1,
    downgraded: 0,
    changed: 1,
    direct: 1,
    transitive: 1
  });
  assert.equal(report.risk, 'medium');
});

test('parses pnpm, yarn, and bun fixtures', () => {
  const pnpm = diffLockfiles(fixture('pnpm-a/pnpm-lock.yaml'), fixture('pnpm-b/pnpm-lock.yaml'));
  assert.equal(pnpm.manager, 'pnpm');
  assert.equal(pnpm.summary.added, 1);
  assert.equal(pnpm.summary.upgraded, 1);

  const yarn = diffLockfiles(fixture('yarn-a/yarn.lock'), fixture('yarn-b/yarn.lock'));
  assert.equal(yarn.manager, 'yarn');
  assert.equal(yarn.summary.upgraded, 1);

  const bun = parseLockfile(fixture('bun/bun.lock'));
  assert.equal(bun.manager, 'bun');
  assert.equal(bun.packageCount, 2);
  assert.equal(bun.packages.find((pkg) => pkg.name === 'zod')?.direct, true);
});

test('inspect reports duplicate ecosystem signals and package-manager drift', () => {
  const report = inspectProject(fixture('drift'));
  assert.equal(report.risk, 'medium');
  assert.ok(report.duplicateEcosystemSignals[0].includes('multiple package-manager signals'));
  assert.ok(report.drift.some((line) => line.includes('packageManager declares pnpm')));
});

test('renders stable markdown reviewer checklist', () => {
  const report = diffLockfiles(fixture('npm-a/package-lock.json'), fixture('npm-b/package-lock.json'));
  const markdown = renderDiff(report, 'markdown');
  assert.match(markdown, /# LockfileLens Dependency Review/);
  assert.match(markdown, /\| left-pad \| 1.1.3 \| 1.3.0 \| upgraded \| direct \|/);
  assert.match(markdown, /Reviewer checklist/);
});

test('CLI emits JSON and redacts secret-like error values', () => {
  const json = execFileSync(process.execPath, [cli, 'diff', '--base', fixture('npm-a/package-lock.json'), '--head', fixture('npm-b/package-lock.json'), '--format', 'json'], { encoding: 'utf8' });
  assert.equal(JSON.parse(json).summary.total, 2);

  let stderr = '';
  try {
    execFileSync(process.execPath, [cli, '--bad', 'token=super-secret'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    stderr = error.stderr.toString();
  }
  assert.doesNotMatch(stderr, /super-secret/);
});
