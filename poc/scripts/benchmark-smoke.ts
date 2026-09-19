import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectForbiddenKeys,
  toPipelineInput,
  validateBenchmarkPack,
  validateBenchmarkRunResult,
} from '@ckes/benchmark';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function load(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, rel), 'utf8')) as Record<string, unknown>;
}

function main(): void {
  const pack = load('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
  validateBenchmarkPack(pack);
  for (const scenario of pack.scenarios as Record<string, unknown>[]) {
    const input = toPipelineInput(scenario, {
      packId: (pack.pack as { packId: string }).packId,
      packVersion: (pack.pack as { packVersion: string }).packVersion,
    });
    const forbidden = collectForbiddenKeys(input);
    if (forbidden.length > 0) {
      throw new Error(`Smoke failed: forbidden keys in projection: ${forbidden.join(', ')}`);
    }
  }
  validateBenchmarkRunResult(load('benchmark/examples/CKES-EXAMPLE-RUN-RESULT-001.json'));
  console.log('benchmark:smoke OK (contract only; no pipeline execution)');
}

main();
