import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { diffLockfiles, inspectProject, parseLockfile, renderDiff } from '../dist/index.js';

const cli = new URL('../dist/cli.js', import.meta.url).pathname;
const fixture = (path) => new URL(`fixtures/${path}`, import.meta.url).pathname;

function temporaryNpmLock(version) {
  const directory = mkdtempSync(join(tmpdir(), 'lockfilelens-version-'));
  const path = join(directory, 'package-lock.json');
  writeFileSync(path, JSON.stringify({
    name: 'version-test',
    lockfileVersion: 3,
    packages: {
      '': { dependencies: { demo: version } },
      'node_modules/demo': { version }
    }
  }));
  return path;
}

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

test('diff follows SemVer precedence for releases and prereleases', () => {
  const cases = [
    ['2.0.0-beta.1', '2.0.0', 'upgraded'],
    ['2.0.0', '2.0.0-beta.1', 'downgraded'],
    ['2.0.0-beta.2', '2.0.0-beta.11', 'upgraded'],
    ['2.0.0-beta.11', '2.0.0-beta.alpha', 'upgraded'],
    ['2.0.0-beta.alpha', '2.0.0-beta.beta', 'upgraded']
  ];

  for (const [from, to, type] of cases) {
    const report = diffLockfiles(temporaryNpmLock(from), temporaryNpmLock(to));
    assert.equal(report.changes[0]?.type, type, `${from} -> ${to}`);
  }
});

test('build metadata does not affect SemVer precedence or downgrade risk', () => {
  const report = diffLockfiles(temporaryNpmLock('2.0.0+build.1'), temporaryNpmLock('2.0.0+build.2'));

  assert.equal(report.changes[0]?.type, 'changed');
  assert.equal(report.summary.upgraded, 0);
  assert.equal(report.summary.downgraded, 0);
  assert.equal(report.summary.changed, 1);
  assert.equal(report.risk, 'low');

  const json = JSON.parse(renderDiff(report, 'json'));
  assert.equal(json.changes[0].type, 'changed');
  assert.match(renderDiff(report, 'markdown'), /\| demo \| 2\.0\.0\+build\.1 \| 2\.0\.0\+build\.2 \| changed \| transitive \|/);
  assert.match(renderDiff(report, 'text'), /demo: 2\.0\.0\+build\.1 -> 2\.0\.0\+build\.2 \(changed, transitive\)/);
});

test('SemVer downgrade is reflected in summaries and risk across formats', () => {
  const report = diffLockfiles(temporaryNpmLock('2.0.0'), temporaryNpmLock('2.0.0-beta.1'));

  assert.equal(report.summary.downgraded, 1);
  assert.equal(report.risk, 'high');
  assert.deepEqual(JSON.parse(renderDiff(report, 'json')).summary, report.summary);
  assert.match(renderDiff(report, 'markdown'), /\| 0 \| 0 \| 0 \| 1 \| 0 \|/);
  assert.match(renderDiff(report, 'markdown'), /\*\*Risk:\*\* High/);
  assert.match(renderDiff(report, 'text'), /risk: high/);
  assert.match(renderDiff(report, 'text'), /changes: 1 \(\+0 -0 ↑0 ↓1\)/);
});

test('non-SemVer versions retain deterministic fallback ordering', () => {
  const report = diffLockfiles(temporaryNpmLock('release-2'), temporaryNpmLock('release-10'));
  assert.equal(report.changes[0]?.type, 'upgraded');
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

  const json = JSON.parse(renderDiff(report, 'json'));
  assert.equal(json.changes[1].fromDirect, true);
  assert.equal(json.changes[1].toDirect, false);
  assert.match(renderDiff(report, 'markdown'), /\| shared \| 3\.0\.0 \| 3\.0\.0 \| changed \| direct -> transitive \|/);
  assert.match(renderDiff(report, 'text'), /shared: 3\.0\.0 -> 3\.0\.0 \(changed, direct -> transitive\)/);
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

test('parses and diffs legacy pnpm slash-form package keys', () => {
  const basePath = fixture('pnpm-legacy-a/pnpm-lock.yaml');
  const headPath = fixture('pnpm-legacy-b/pnpm-lock.yaml');
  const lock = parseLockfile(basePath);

  assert.equal(lock.packageCount, 2);
  assert.equal(lock.directCount, 2);
  assert.deepEqual(lock.packages.map(({ name, version }) => [name, version]), [
    ['@scope/demo', '2.0.0'],
    ['left-pad', '1.3.0']
  ]);

  const inspection = inspectProject(new URL('fixtures/pnpm-legacy-a', import.meta.url).pathname);
  assert.equal(inspection.staleOrMissingLockfiles.some((item) => item.includes('no parsed packages')), false);

  const diff = diffLockfiles(basePath, headPath);
  assert.equal(diff.summary.upgraded, 1);
  assert.equal(diff.summary.added, 1);
  assert.equal(diff.changes.find((change) => change.name === 'left-pad')?.to, '1.3.1');
});

test('parses pnpm v9 package identities without snapshot version leakage', () => {
  const basePath = fixture('pnpm-v9-a/pnpm-lock.yaml');
  const headPath = fixture('pnpm-v9-b/pnpm-lock.yaml');
  const lock = parseLockfile(basePath);

  assert.equal(lock.packageCount, 2);
  assert.equal(lock.directCount, 1);
  assert.deepEqual(lock.packages.map(({ name, version, direct }) => [name, version, direct]), [
    ['bar', '2.0.0', false],
    ['foo', '1.0.0', true]
  ]);

  const inspection = inspectProject(new URL('fixtures/pnpm-v9-a', import.meta.url).pathname);
  assert.equal(inspection.risk, 'low');
  assert.equal(inspection.drift.some((item) => item.includes('multiple resolved versions')), false);

  const diff = diffLockfiles(basePath, headPath);
  assert.equal(diff.summary.total, 1);
  assert.equal(diff.summary.upgraded, 1);
  assert.equal(diff.changes[0]?.name, 'foo');
  assert.equal(diff.changes[0]?.from, '1.0.0');
  assert.equal(diff.changes[0]?.to, '1.1.0');
});

test('inspect reports duplicate ecosystem signals and package-manager drift', () => {
  const report = inspectProject(fixture('drift'));
  assert.equal(report.risk, 'medium');
  assert.ok(report.duplicateEcosystemSignals[0].includes('multiple package-manager signals'));
  assert.ok(report.drift.some((line) => line.includes('packageManager declares pnpm')));
});

test('engine rejects invalid inspect and diff inputs', () => {
  const missing = join(tmpdir(), `lockfilelens-missing-${process.pid}`);
  assert.throws(() => inspectProject(missing), /inspect input does not exist/);
  assert.throws(() => diffLockfiles(missing, fixture('npm-b/package-lock.json')), /diff base lockfile does not exist/);
  assert.throws(() => diffLockfiles(fixture('npm-a'), fixture('npm-b/package-lock.json')), /diff base lockfile is not a file/);
  assert.throws(
    () => diffLockfiles(fixture('npm-a/package-lock.json'), fixture('pnpm-a/pnpm-lock.yaml')),
    /diff lockfile managers must match: npm \(base\) and pnpm \(head\)/
  );

  const unsupported = join(mkdtempSync(join(tmpdir(), 'lockfilelens-test-')), 'custom.lock');
  writeFileSync(unsupported, 'not a supported lockfile');
  assert.throws(() => inspectProject(unsupported), /inspect input is not a recognized lockfile/);
  assert.throws(() => diffLockfiles(fixture('npm-a/package-lock.json'), unsupported), /diff head input is not a recognized lockfile/);

  const unreadable = join(mkdtempSync(join(tmpdir(), 'lockfilelens-test-')), 'yarn.lock');
  writeFileSync(unreadable, '');
  chmodSync(unreadable, 0o000);
  try {
    assert.throws(() => diffLockfiles(unreadable, fixture('yarn-b/yarn.lock')), /diff base lockfile is not readable/);
  } finally {
    chmodSync(unreadable, 0o600);
  }
});

test('CLI reports invalid inputs on stderr with a nonzero exit', () => {
  const missing = join(tmpdir(), `lockfilelens-cli-missing-${process.pid}`);
  const inspect = spawnSync(process.execPath, [cli, 'inspect', missing], { encoding: 'utf8' });
  assert.equal(inspect.status, 1);
  assert.equal(inspect.stdout, '');
  assert.match(inspect.stderr, /lockfilelens: inspect input does not exist:/);

  const diff = spawnSync(process.execPath, [cli, 'diff', '--base', fixture('npm-a'), '--head', fixture('npm-b/package-lock.json')], { encoding: 'utf8' });
  assert.equal(diff.status, 1);
  assert.equal(diff.stdout, '');
  assert.match(diff.stderr, /lockfilelens: diff base lockfile is not a file:/);

  const mixedManagers = spawnSync(process.execPath, [cli, 'diff', fixture('npm-a/package-lock.json'), fixture('pnpm-a/pnpm-lock.yaml'), '--format', 'json'], { encoding: 'utf8' });
  assert.equal(mixedManagers.status, 1);
  assert.equal(mixedManagers.stdout, '');
  assert.equal(mixedManagers.stderr, 'lockfilelens: diff lockfile managers must match: npm (base) and pnpm (head)\n');
});

test('CLI accepts positional and flag diff operands', () => {
  const base = fixture('npm-a/package-lock.json');
  const head = fixture('npm-b/package-lock.json');
  for (const args of [
    ['diff', base, head],
    ['diff', '--base', base, '--head', head],
    ['summary', base, head],
    ['summary', '--base', base, '--head', head],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args, '--format', 'json'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).summary.total, 2);
  }
});

test('CLI rejects surplus diff operands on stderr with exit code 2', () => {
  const base = fixture('npm-a/package-lock.json');
  const head = fixture('npm-b/package-lock.json');
  for (const args of [
    ['diff', base, head, 'extra'],
    ['diff', '--base', base, '--head', head, 'extra'],
    ['summary', base, head, 'extra'],
    ['summary', '--base', base, '--head', head, 'extra'],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^lockfilelens: (?:diff|summary diff mode) accepts at most two lockfile paths\n$/);
  }
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
