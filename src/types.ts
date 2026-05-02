export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

export interface PackageInfo {
  name: string;
  version: string;
  direct: boolean;
  source: string;
}

export interface ManifestInfo {
  path: string | null;
  packageManager: string | null;
  dependencyNames: string[];
  scriptsPackageManagerSignals: string[];
}

export interface LockfileInfo {
  path: string;
  manager: PackageManager;
  packageCount: number;
  directCount: number;
  packages: PackageInfo[];
  warnings: string[];
}

export interface ProjectInspection {
  path: string;
  manifest: ManifestInfo | null;
  lockfiles: LockfileInfo[];
  detectedManagers: PackageManager[];
  duplicateEcosystemSignals: string[];
  staleOrMissingLockfiles: string[];
  drift: string[];
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
}

export type ChangeType = 'added' | 'removed' | 'upgraded' | 'downgraded' | 'changed';

export interface DependencyChange {
  name: string;
  from: string | null;
  to: string | null;
  type: ChangeType;
  direct: boolean;
}

export interface DiffReport {
  base: string;
  head: string;
  manager: PackageManager;
  summary: {
    total: number;
    added: number;
    removed: number;
    upgraded: number;
    downgraded: number;
    changed: number;
    direct: number;
    transitive: number;
  };
  risk: 'low' | 'medium' | 'high';
  changes: DependencyChange[];
  warnings: string[];
}

export interface RenderOptions {
  format: 'json' | 'markdown' | 'text';
}
