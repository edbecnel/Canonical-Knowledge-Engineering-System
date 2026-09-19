import { mkdir, realpath } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export async function resolveAllowlistedPath(
  roots: string[],
  userPath: string,
): Promise<string> {
  const decoded = decodeURIComponent(userPath);
  if (decoded.includes('\0')) {
    throw new Error('Invalid path');
  }
  const absolute = resolve(decoded);
  for (const root of roots) {
    const realRoot = await realpath(root);
    const candidate = resolve(realRoot, userPath.replace(/^\/+/, ''));
    const realCandidate = await realpath(dirname(candidate)).catch(() => null);
    if (realCandidate && realCandidate.startsWith(realRoot)) {
      return candidate;
    }
    if (absolute.startsWith(realRoot + '/') || absolute === realRoot) {
      return absolute;
    }
  }
  throw new Error('Path outside allowlisted roots');
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export function defaultHarnessRoots(repoPocRoot: string): string[] {
  return [
    join(repoPocRoot, 'benchmark'),
    join(repoPocRoot, 'experiments/runs'),
    join(repoPocRoot, 'experiments/reference-designations'),
    join(repoPocRoot, 'benchmark/exploratory/drafts'),
  ];
}
