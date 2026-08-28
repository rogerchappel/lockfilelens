import { readFileSync, existsSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type { LockfileInfo, ManifestInfo, PackageInfo, PackageManager } from './types.js';

const LOCKFILE_MANAGERS: Record<string, PackageManager> = {
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lock': 'bun',
  'bun.lockb': 'bun'
};

export function managerForPath(path: string): PackageManager {
  return LOCKFILE_MANAGERS[basename(path)] ?? 'unknown';
}

export function isLockfilePath(path: string): boolean {
  return managerForPath(path) !== 'unknown';
}

export function findLockfiles(projectPath: string): string[] {
  return Object.keys(LOCKFILE_MANAGERS)
    .map((file) => join(projectPath, file))
    .filter((file) => existsSync(file) && statSync(file).isFile());
}

export function loadManifest(projectOrLockPath: string): ManifestInfo | null {
  const dir = isLockfilePath(projectOrLockPath) ? dirname(projectOrLockPath) : projectOrLockPath;
  const manifestPath = join(dir, 'package.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
    const deps = collectManifestDependencyNames(manifest);
    const scriptsSignals = Object.values((manifest.scripts as Record<string, string> | undefined) ?? {})
      .flatMap((script) => detectPackageManagerMentions(script));
    return {
      path: manifestPath,
      packageManager: typeof manifest.packageManager === 'string' ? manifest.packageManager : null,
      dependencyNames: [...deps].sort(),
      scriptsPackageManagerSignals: [...new Set(scriptsSignals)].sort()
    };
  } catch (error) {
    return {
      path: manifestPath,
      packageManager: null,
      dependencyNames: [],
      scriptsPackageManagerSignals: [`unreadable package.json: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

export function collectManifestDependencyNames(manifest: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const section = manifest[key];
    if (section && typeof section === 'object' && !Array.isArray(section)) {
      for (const name of Object.keys(section)) names.add(name);
    }
  }
  return names;
}

export function parseLockfile(path: string, manifest = loadManifest(path)): LockfileInfo {
  const manager = managerForPath(path);
  const warnings: string[] = [];
  let packages: PackageInfo[] = [];
  if (manager === 'unknown') warnings.push(`unknown lockfile type: ${basename(path)}`);
  if (manager === 'bun' && basename(path) === 'bun.lockb') warnings.push('binary bun.lockb is detected but cannot be parsed; prefer text bun.lock for V1');

  const content = existsSync(path) && basename(path) !== 'bun.lockb' ? readFileSync(path, 'utf8') : '';
  try {
    if (manager === 'npm') packages = parseNpmLock(content, path, manifest);
    if (manager === 'pnpm') packages = parsePnpmLock(content, path, manifest);
    if (manager === 'yarn') {
      packages = parseYarnLock(content, path, manifest);
      if (packages.length === 0 && isModernYarnLock(content)) {
        warnings.push('failed to parse yarn.lock: modern Yarn lockfile has no package entries with versions');
      }
    }
    if (manager === 'bun' && basename(path) === 'bun.lock') packages = parseBunLock(content, path, manifest);
  } catch (error) {
    warnings.push(`failed to parse ${basename(path)}: ${error instanceof Error ? error.message : String(error)}`);
  }
  packages = dedupePackages(packages);
  return {
    path: resolve(path),
    manager,
    packageCount: packages.length,
    directCount: packages.filter((pkg) => pkg.direct).length,
    packages,
    warnings
  };
}

function parseNpmLock(content: string, source: string, manifest: ManifestInfo | null): PackageInfo[] {
  const lock = JSON.parse(content) as Record<string, unknown>;
  const direct = new Set(manifest?.dependencyNames ?? []);
  const packages: PackageInfo[] = [];
  const packageMap = lock.packages as Record<string, Record<string, unknown>> | undefined;
  if (packageMap) {
    for (const [location, info] of Object.entries(packageMap)) {
      if (!location || !location.includes('node_modules/')) continue;
      const name = location.slice(location.lastIndexOf('node_modules/') + 'node_modules/'.length);
      const version = typeof info.version === 'string' ? info.version : null;
      if (name && version) packages.push({ name, version, direct: direct.has(name), source });
    }
    return packages;
  }
  const deps = lock.dependencies as Record<string, Record<string, unknown>> | undefined;
  if (deps) collectNpmDependencies(deps, direct, packages, source);
  return packages;
}

function collectNpmDependencies(deps: Record<string, Record<string, unknown>>, direct: Set<string>, packages: PackageInfo[], source: string): void {
  for (const [name, info] of Object.entries(deps)) {
    if (typeof info.version === 'string') packages.push({ name, version: info.version, direct: direct.has(name), source });
    if (info.dependencies && typeof info.dependencies === 'object' && !Array.isArray(info.dependencies)) {
      collectNpmDependencies(info.dependencies as Record<string, Record<string, unknown>>, direct, packages, source);
    }
  }
}

function parsePnpmLock(content: string, source: string, manifest: ManifestInfo | null): PackageInfo[] {
  const direct = new Set(manifest?.dependencyNames ?? []);
  const packages: PackageInfo[] = [];
  const packageLine = /^\s{2}(?:'|")?(\/|@?[^\s'":][^'":]*@)([^'":]+)(?:'|")?:\s*$/;
  let section: string | null = null;
  for (const line of content.split(/\r?\n/)) {
    const sectionMatch = line.match(/^([^\s][^:]*):\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    if (section !== 'packages') continue;
    const match = line.match(packageLine);
    if (match && line.startsWith('  ') && !line.startsWith('    ')) {
      const key = line.trim().replace(/^['"]|['"]:?$/g, '').replace(/:$/, '');
      const parsed = parsePnpmPackageKey(key);
      if (parsed) packages.push({ name: parsed.name, version: parsed.version, direct: direct.has(parsed.name), source });
    }
  }
  return packages;
}

function parsePnpmPackageKey(key: string): { name: string; version: string } | null {
  const clean = key.replace(/^\//, '').split('(')[0];
  const slash = clean.startsWith('@') ? clean.indexOf('/', clean.indexOf('/') + 1) : clean.indexOf('/');
  if (slash > 0) {
    const name = clean.slice(0, slash);
    const version = clean.slice(slash + 1);
    return name && version ? { name, version } : null;
  }
  const at = clean.startsWith('@') ? clean.indexOf('@', 1) : clean.lastIndexOf('@');
  if (at <= 0) return null;
  return { name: clean.slice(0, at), version: clean.slice(at + 1) };
}

function parseYarnLock(content: string, source: string, manifest: ManifestInfo | null): PackageInfo[] {
  const direct = new Set(manifest?.dependencyNames ?? []);
  const packages: PackageInfo[] = [];
  let currentNames: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (line && !line.startsWith(' ') && line.endsWith(':')) {
      currentNames = line.slice(0, -1).split(/,\s*/).map(packageNameFromYarnSelector).filter(Boolean) as string[];
      continue;
    }
    const version = line.match(/^\s{2}version(?:\s+|:\s*)"?([^"\s]+)"?\s*$/)?.[1];
    if (version) {
      for (const name of currentNames) packages.push({ name, version, direct: direct.has(name), source });
    }
  }
  return packages;
}

function isModernYarnLock(content: string): boolean {
  return /^__metadata:\s*$/m.test(content) || /^\s{2}version:\s*/m.test(content);
}

function packageNameFromYarnSelector(selector: string): string | null {
  const clean = selector.trim().replace(/^"|"$/g, '');
  if (clean.startsWith('@')) {
    const secondAt = clean.indexOf('@', 1);
    return secondAt > 0 ? clean.slice(0, secondAt) : null;
  }
  const at = clean.indexOf('@');
  return at > 0 ? clean.slice(0, at) : null;
}

function parseBunLock(content: string, source: string, manifest: ManifestInfo | null): PackageInfo[] {
  const direct = new Set(manifest?.dependencyNames ?? []);
  const packages: PackageInfo[] = [];
  try {
    const lock = JSON.parse(content) as Record<string, unknown>;
    const pkg = lock.packages;
    if (pkg && typeof pkg === 'object' && !Array.isArray(pkg)) {
      for (const [name, value] of Object.entries(pkg as Record<string, unknown>)) {
        const tuple = Array.isArray(value) ? value : [];
        const version = typeof tuple[0] === 'string' ? tuple[0].replace(/^npm:/, '') : null;
        if (version) packages.push({ name, version, direct: direct.has(name), source });
      }
    }
  } catch {
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*"?(@?[^"@\s]+(?:\/[^"@\s]+)?)"?\s*=\s*"?([^"\s]+)"?/);
      if (match) packages.push({ name: match[1], version: match[2].replace(/^npm:/, ''), direct: direct.has(match[1]), source });
    }
  }
  return packages;
}

function dedupePackages(packages: PackageInfo[]): PackageInfo[] {
  const seen = new Map<string, PackageInfo>();
  for (const pkg of packages) {
    const key = `${pkg.name}@${pkg.version}`;
    const existing = seen.get(key);
    seen.set(key, existing ? { ...pkg, direct: existing.direct || pkg.direct } : pkg);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

function detectPackageManagerMentions(script: string): string[] {
  return ['npm', 'pnpm', 'yarn', 'bun'].filter((manager) => new RegExp(`(^|\\s)${manager}(\\s|$)`).test(script));
}
