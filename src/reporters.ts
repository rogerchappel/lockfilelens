import type { DiffReport, ProjectInspection } from './types.js';

export function renderInspection(report: ProjectInspection, format: 'json' | 'markdown' | 'text'): string {
  if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`;
  if (format === 'text') {
    const lines = [
      `lockfilelens inspect: ${report.path}`,
      `risk: ${report.risk}`,
      `managers: ${report.detectedManagers.join(', ') || 'none'}`,
      `lockfiles: ${report.lockfiles.length}`
    ];
    for (const issue of [...report.duplicateEcosystemSignals, ...report.staleOrMissingLockfiles, ...report.drift, ...report.warnings]) lines.push(`- ${issue}`);
    return `${lines.join('\n')}\n`;
  }
  const lines = [
    '# LockfileLens Inspection',
    '',
    `- **Path:** ${report.path}`,
    `- **Risk:** ${riskLabel(report.risk)}`,
    `- **Detected managers:** ${report.detectedManagers.join(', ') || 'none'}`,
    `- **Lockfiles:** ${report.lockfiles.length}`,
    ''
  ];
  lines.push('## Lockfiles', '');
  if (report.lockfiles.length === 0) lines.push('_No recognized lockfiles found._', '');
  for (const lockfile of report.lockfiles) {
    lines.push(`- \`${lockfile.manager}\` ${lockfile.packageCount} packages (${lockfile.directCount} direct): ${lockfile.path}`);
  }
  lines.push('', '## Findings', '');
  const findings = [...report.duplicateEcosystemSignals, ...report.staleOrMissingLockfiles, ...report.drift, ...report.warnings];
  if (findings.length === 0) lines.push('- No package-manager drift, missing lockfiles, or duplicate ecosystem signals found.');
  else for (const finding of findings) lines.push(`- ${finding}`);
  lines.push('', '## Reviewer checklist', '', '- Confirm the intended package manager is documented.', '- Regenerate the lockfile with the intended package manager if drift is present.', '- Review duplicate resolved versions before merging.');
  return `${lines.join('\n')}\n`;
}

export function renderDiff(report: DiffReport, format: 'json' | 'markdown' | 'text'): string {
  if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`;
  if (format === 'text') {
    const lines = [
      `lockfilelens diff: ${report.manager}`,
      `risk: ${report.risk}`,
      `changes: ${report.summary.total} (+${report.summary.added} -${report.summary.removed} ↑${report.summary.upgraded} ↓${report.summary.downgraded})`
    ];
    for (const change of report.changes) lines.push(`- ${change.name}: ${change.from ?? '∅'} -> ${change.to ?? '∅'} (${change.type}, ${scopeLabel(change.fromDirect, change.toDirect)})`);
    for (const warning of report.warnings) lines.push(`warning: ${warning}`);
    return `${lines.join('\n')}\n`;
  }
  const lines = [
    '# LockfileLens Dependency Review',
    '',
    `- **Base:** ${report.base}`,
    `- **Head:** ${report.head}`,
    `- **Manager:** ${report.manager}`,
    `- **Risk:** ${riskLabel(report.risk)}`,
    `- **Changes:** ${report.summary.total} total; ${report.summary.direct} direct, ${report.summary.transitive} transitive`,
    '',
    '## Summary',
    '',
    `| Added | Removed | Upgraded | Downgraded | Other |`,
    `|---:|---:|---:|---:|---:|`,
    `| ${report.summary.added} | ${report.summary.removed} | ${report.summary.upgraded} | ${report.summary.downgraded} | ${report.summary.changed} |`,
    '',
    '## Changes',
    ''
  ];
  if (report.changes.length === 0) lines.push('_No dependency resolution changes found._');
  else {
    lines.push('| Package | From | To | Type | Scope |', '|---|---|---|---|---|');
    for (const change of report.changes) lines.push(`| ${escapePipes(change.name)} | ${change.from ?? '—'} | ${change.to ?? '—'} | ${change.type} | ${scopeLabel(change.fromDirect, change.toDirect)} |`);
  }
  if (report.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const warning of report.warnings) lines.push(`- ${warning}`);
  }
  lines.push('', '## Reviewer checklist', '', '- Confirm direct dependency changes match the PR intent.', '- Pay special attention to removals, downgrades, and package-manager drift.', '- Run the project test suite before merging.');
  return `${lines.join('\n')}\n`;
}

function riskLabel(risk: string): string {
  return risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low';
}

function escapePipes(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function scopeLabel(from: boolean | null, to: boolean | null): string {
  const before = from === null ? null : from ? 'direct' : 'transitive';
  const after = to === null ? null : to ? 'direct' : 'transitive';
  if (before === null) return after!;
  if (after === null) return before;
  return before === after ? before : `${before} -> ${after}`;
}
