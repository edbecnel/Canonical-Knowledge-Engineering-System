import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPipelineInput } from '@ckes/benchmark';
import { runFullPipelineSlice } from '@ckes/pipeline';
import { resetHarnessSandbox } from '../src/isolation.js';
import {
  loadPackSeedMaterial,
  resetCanonicalCorpusForBenchmarkPack,
} from '../src/pack-seeds.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '../../..');
config({ path: join(pocRoot, '.env') });

describe('G4.1 baseline validity fixes', () => {
  it('full_pipeline ANC-0017 reaches terminal decision (not sourceText infra)', async () => {
    const pack = JSON.parse(
      readFileSync(join(pocRoot, 'benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json'), 'utf8'),
    ) as Record<string, unknown>;
    const sc = (pack.scenarios as Record<string, unknown>[]).find(
      (s) => s.scenarioId === 'ANC-0017',
    )!;
    const input = toPipelineInput(sc, { packId: 'CKES-BENCHMARK-ANCHOR-001', packVersion: '1.0.0' });
    assert.ok(input.sourceText);
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    await resetHarnessSandbox(pool);
    await resetCanonicalCorpusForBenchmarkPack(pool);
    await loadPackSeedMaterial(pool, pack.canonicalSeedMaterial as { seedId: string; label: string }[]);
    const result = await runFullPipelineSlice(pool, input, { deterministicAi: true });
    assert.ok(result.adjudicationClass);
    assert.notEqual(result.adjudicationClass, '');
    await pool.end();
  });

  it('full_pipeline ANC-0034 does not fail extraction when directCandidate present', async () => {
    const pack = JSON.parse(
      readFileSync(join(pocRoot, 'benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json'), 'utf8'),
    ) as Record<string, unknown>;
    const sc = (pack.scenarios as Record<string, unknown>[]).find(
      (s) => s.scenarioId === 'ANC-0034',
    )!;
    const input = toPipelineInput(sc, { packId: 'CKES-BENCHMARK-ANCHOR-001', packVersion: '1.0.0' });
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    await resetHarnessSandbox(pool);
    await resetCanonicalCorpusForBenchmarkPack(pool);
    await loadPackSeedMaterial(pool, pack.canonicalSeedMaterial as { seedId: string; label: string }[]);
    const result = await runFullPipelineSlice(pool, input, { deterministicAi: true });
    assert.ok(result.adjudicationClass);
    await pool.end();
  });
});
