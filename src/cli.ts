#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffLockfiles, inspectProject } from './engine.js';
import { renderDiff, renderInspection } from './reporters.js';

const VERSION = readPackageVersion();

type Format = 'json' | 'markdown' | 'text';

interface CliError extends Error {
  exitCode?: number;
}

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(helpText());
    return 0;
  }
  if (command === '--version' || command === '-v') {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (command === 'inspect') {
    const { args, format } = parseCommon(rest);
    if (args.length > 1) throw userError('inspect accepts at most one path');
    process.stdout.write(renderInspection(inspectProject(args[0] ?? process.cwd()), format));
    return 0;
  }
  if (command === 'diff') {
    const { args, format, base, head } = parseCommon(rest);
    rejectSurplusDiffOperands('diff', args, base, head);
    const resolvedBase = base ?? args[0];
    const resolvedHead = head ?? args[base ? 0 : 1];
    if (!resolvedBase || !resolvedHead) throw userError('diff requires --base and --head lockfile paths');
    process.stdout.write(renderDiff(diffLockfiles(resolvedBase, resolvedHead), format));
    return 0;
  }
  if (command === 'summary') {
    const { args, format, base, head } = parseCommon(rest);
    if (base || head || args.length >= 2) {
      rejectSurplusDiffOperands('summary diff mode', args, base, head);
      const resolvedBase = base ?? args[0];
      const resolvedHead = head ?? args[base ? 0 : 1];
      if (!resolvedBase || !resolvedHead) throw userError('summary diff mode requires base and head paths');
      process.stdout.write(renderDiff(diffLockfiles(resolvedBase, resolvedHead), format));
    } else {
      process.stdout.write(renderInspection(inspectProject(args[0] ?? process.cwd()), format));
    }
    return 0;
  }
  throw userError(`unknown command: ${command}`);
}

function rejectSurplusDiffOperands(command: string, args: string[], base?: string, head?: string): void {
  const availableSlots = Number(!base) + Number(!head);
  if (args.length > availableSlots) throw userError(`${command} accepts at most two lockfile paths`);
}

function parseCommon(tokens: string[]): { args: string[]; format: Format; base?: string; head?: string } {
  const args: string[] = [];
  let format: Format = 'markdown';
  let base: string | undefined;
  let head: string | undefined;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '--format') {
      const value = tokens[++index];
      if (!isFormat(value)) throw userError(`unsupported format: ${value ?? '<missing>'}`);
      format = value;
    } else if (token.startsWith('--format=')) {
      const value = token.slice('--format='.length);
      if (!isFormat(value)) throw userError(`unsupported format: ${value}`);
      format = value;
    } else if (token === '--json') {
      format = 'json';
    } else if (token === '--text') {
      format = 'text';
    } else if (token === '--base') {
      base = requireValue(tokens, ++index, '--base');
    } else if (token.startsWith('--base=')) {
      base = token.slice('--base='.length);
    } else if (token === '--head') {
      head = requireValue(tokens, ++index, '--head');
    } else if (token.startsWith('--head=')) {
      head = token.slice('--head='.length);
    } else if (token === '--help' || token === '-h') {
      process.stdout.write(helpText());
      process.exit(0);
    } else if (token.startsWith('-')) {
      throw userError(`unknown option: ${token}`);
    } else {
      args.push(token);
    }
  }
  return { args, format, base, head };
}

function requireValue(tokens: string[], index: number, flag: string): string {
  const value = tokens[index];
  if (!value || value.startsWith('-')) throw userError(`${flag} requires a value`);
  return value;
}

function isFormat(value: string | undefined): value is Format {
  return value === 'json' || value === 'markdown' || value === 'text';
}

function userError(message: string): CliError {
  const error = new Error(message) as CliError;
  error.exitCode = 2;
  return error;
}

function helpText(): string {
  return `lockfilelens ${VERSION}\n\nLocal-first lockfile drift and dependency change explainer.\n\nUsage:\n  lockfilelens inspect [project-or-lockfile] [--format markdown|json|text]\n  lockfilelens diff <base-lockfile> <head-lockfile> [--format markdown|json|text]\n  lockfilelens diff --base <lockfile> --head <lockfile> [--format markdown|json|text]\n  lockfilelens summary [project-or-lockfile] [--format markdown|json|text]\n  lockfilelens summary <base-lockfile> <head-lockfile> [--format markdown|json|text]\n  lockfilelens summary --base <lockfile> --head <lockfile> [--format markdown|json|text]\n\nExamples:\n  lockfilelens inspect . --json\n  lockfilelens diff --base fixtures/a/package-lock.json --head fixtures/b/package-lock.json\n\nSafety:\n  Core commands are read-only and never make network calls.\n`;
}

function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const packagePath = resolve(here, '..', 'package.json');
    return (JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  const cliError = error as CliError;
  process.stderr.write(`lockfilelens: ${redact(cliError.message)}\n`);
  process.exitCode = cliError.exitCode ?? 1;
}

function redact(value: string): string {
  return value.replace(/(token|password|secret|api[_-]?key)=([^\s]+)/gi, '$1=[redacted]');
}
