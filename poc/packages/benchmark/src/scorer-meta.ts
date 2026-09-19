import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Identifies scorer implementation for derived reports and rescoring. */
export const SCORER_VERSION = '1.0.0-g1';

export function computeScorerContentHash(): string {
  const scoringPath = join(__dirname, 'scoring.js');
  try {
    const src = readFileSync(scoringPath, 'utf8');
    return createHash('sha256').update(src, 'utf8').digest('hex');
  } catch {
    const tsPath = join(__dirname, 'scoring.ts');
    const src = readFileSync(tsPath, 'utf8');
    return createHash('sha256').update(src, 'utf8').digest('hex');
  }
}
