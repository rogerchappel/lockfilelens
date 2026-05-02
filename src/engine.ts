import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findLockfiles, isLockfilePath, loadManifest, managerForPath, parseLockfile } from './lockfiles.js';
import type { DependencyChange, DiffReport, LockfileInfo, PackageManager, ProjectInspection } from './types.js';

export function inspectProject(inputPath: string): ProjectInspection {
  const path = resolve(inputPath);
  const projectPath = isLockfilePath(path) ? resolve(path, '..') : path;
  const manifest = loadManifest(projectPath);
  const lockfilePaths = isLockfilePath(path) ? [path] : findLockfiles(projectPath);
  const lockfiles = lockfilePaths.map((lockfile) => parseLockfile(lockfile, manifest));
  const detectedManagers = [...new Set(lockfiles.map((lockfile) => lockfile.manager))];
  const packageManagerName = manifest?.packageManager?.split('@')[0] as PackageManager | undefined;
  const duplicateEcosystemSignals = collectDuplicateSignals(lockfiles, manifest?.scriptsPackageManagerSignals ?? [], packageManagerName);
  const staleOrMissingLockfiles = collectLockfileState(projectPath, lockfiles, manifest?.dependencyNames.length ?? 0);
  const drift = collectDrift(lockfiles, packageManagerName);
  const warnings = lockfiles.flatMap((lockfile) => lockfile.warnings);
  const risk = staleOrMissingLockfiles.length > 0 || duplicateEcosystemSignals.length > 0 || drift.length > 0 ? 'medium' : 'low';
  return { path: projectPath, manifest, lockfiles, detectedManagers, duplicateEcosystemSignals, staleOrMissingLockfiles, drift, risk, warnings };
}

export function diffLockfiles(basePath: string, headPath: string): DiffReport {
  const baseManifest = loadManifest(basePath);
  const headManifest = loadManifest(headPath);
  const base = parseLockfile(resolve(basePath), baseManifest);
  const head = parseLockfile(resolve(headPath), headManifest);
  const warnings = [...base.warnings, ...head.warnings];
  if (base.manager !== head.manager) warnings.push(`comparing different lockfile managers: ${base.manager} -> ${head.manager}`);

  const basePackages = byName(base);
  const headPackages = byName(head);
  const names = [...new Set([...basePackages.keys(), ...headPackages.keys()])].sort();
  const changes: DependencyChange[] = [];
  for (const name of names) {
    const before = basePackages.get(name);
    const after = headPackages.get(name);
    if (!before && after) changes.push({ name, from: null, to: after.version, type: 'added', direct: after.direct });
    else if (before && !after) changes.push({ name, from: before.version, to: null, type: 'removed', direct: before.direct });
    else if (before && after && before.version !== after.version) {
      const order = compareVersions(before.version, after.version);
      changes.push({
        name,
        from: before.version,
        to: after.version,
        type: order < 0 ? 'upgraded' : order > 0 ? 'downgraded' : 'changed',
        direct: before.direct || after.direct
      });
    }
  }
  const summary = {
    total: changes.length,
    added: changes.filter((change) => change.type === 'added').length,
    removed: changes.filter((change) => change.type === 'removed').length,
    upgraded: changes.filter((change) => change.type === 'upgraded').length,
    downgraded: changes.filter((change) => change.type === 'downgraded').length,
    changed: changes.filter((change) => change.type === 'changed').length,
    direct: changes.filter((change) => change.direct).length,
    transitive: changes.filter((change) => !change.direct).length
  };
  return {
    base: resolve(basePath),
    head: resolve(headPath),
    manager: base.manager === head.manager ? base.manager : 'unknown',
    summary,
    risk: riskForChanges(changes, warnings),
    changes,
    warnings
  };
}

function byName(lockfile: LockfileInfo): Map<string, { version: string; direct: boolean }> {
  const map = new Map<string, { version: string; direct: boolean }>();
  for (const pkg of lockfile.packages) {
    const existing = map.get(pkg.name);
    if (!existing || compareVersions(existing.version, pkg.version) < 0) map.set(pkg.name, { version: pkg.version, direct: pkg.direct || existing?.direct === true });
  }
  return map;
}

function collectDuplicateSignals(lockfiles: LockfileInfo[], scriptSignals: string[], packageManagerName?: PackageManager): string[] {
  const managers = new Set<PackageManager>(lockfiles.map((lockfile) => lockfile.manager));
  for (const signal of scriptSignals) managers.add(signal as PackageManager);
  if (packageManagerName) managers.add(packageManagerName);
  return managers.size > 1 ? [`multiple package-manager signals detected: ${[...managers].sort().join(', ')}`] : [];
}

function collectLockfileState(projectPath: string, lockfiles: LockfileInfo[], manifestDependencyCount: number): string[] {
  const issues: string[] = [];
  if (manifestDependencyCount > 0 && lockfiles.length === 0) issues.push('package.json declares dependencies but no recognized lockfile exists');
  for (const lockfile of lockfiles) {
    if (lockfile.packageCount === 0) issues.push(`${lockfile.manager} lockfile has no parsed packages: ${lockfile.path}`);
  }
  const manifestPath = join(projectPath, 'package.json');
  if (existsSync(manifestPath)) {
    const manifestMtime = statSync(manifestPath).mtimeMs;
    for (const lockfile of lockfiles) {
      if (existsSync(lockfile.path) && statSync(lockfile.path).mtimeMs + 1000 < manifestMtime) {
        issues.push(`${lockfile.manager} lockfile appears older than package.json`);
      }
    }
  }
  return issues;
}

function collectDrift(lockfiles: LockfileInfo[], packageManagerName?: PackageManager): string[] {
  const drift: string[] = [];
  if (packageManagerName && lockfiles.length > 0 && !lockfiles.some((lockfile) => lockfile.manager === packageManagerName)) {
    drift.push(`packageManager declares ${packageManagerName}, but lockfiles are ${lockfiles.map((lockfile) => lockfile.manager).join(', ')}`);
  }
  for (const lockfile of lockfiles) {
    const duplicateNames = findDuplicateNames(lockfile);
    if (duplicateNames.length > 0) drift.push(`${lockfile.manager} lockfile contains multiple resolved versions for: ${duplicateNames.slice(0, 10).join(', ')}${duplicateNames.length > 10 ? ', …' : ''}`);
  }
  return drift;
}

function findDuplicateNames(lockfile: LockfileInfo): string[] {
  const versions = new Map<string, Set<string>>();
  for (const pkg of lockfile.packages) {
    const set = versions.get(pkg.name) ?? new Set<string>();
    set.add(pkg.version);
    versions.set(pkg.name, set);
  }
  return [...versions.entries()].filter(([, value]) => value.size > 1).map(([name]) => name).sort();
}

function riskForChanges(changes: DependencyChange[], warnings: string[]): 'low' | 'medium' | 'high' {
  if (warnings.length > 0 || changes.some((change) => change.type === 'removed' || change.type === 'downgraded')) return 'high';
  if (changes.some((change) => change.direct) || changes.length >= 10) return 'medium';
  return 'low';
}

function compareVersions(a: string, b: string): number {
  const left = a.split(/[^0-9A-Za-z]+/).filter(Boolean);
  const right = b.split(/[^0-9A-Za-z]+/).filter(Boolean);
  const len = Math.max(left.length, right.length);
  for (let index = 0; index < len; index += 1) {
    const x = left[index] ?? '0';
    const y = right[index] ?? '0';
    const xn = Number(x);
    const yn = Number(y);
    if (Number.isFinite(xn) && Number.isFinite(yn) && xn !== yn) return xn - yn;
    if (x !== y) return x.localeCompare(y);
  }
  return 0;
}

export function defaultLockfile(projectPath: string): string | null {
  const lockfiles = findLockfiles(resolve(projectPath));
  return lockfiles[0] ?? null;
}

export { managerForPath };
