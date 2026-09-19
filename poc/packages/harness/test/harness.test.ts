import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toBrowserPackView, validateBenchmarkPack, collectForbiddenKeys } from '@ckes/benchmark';
import { HARNESS_CONCURRENCY_MAX } from '../src/isolation.js';
import { compareRunCompatibility } from '../src/compare.js';
import {
  assertDesignatableReferenceBaseline,
  verifyScenarioLeakage,
} from '../src/run-integrity.js';
import { designateReference } from '../src/reference-designation.js';
import { qualifyBenchmarkPack } from '@ckes/benchmark';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('harness handover 2', () => {
  it('smoke pack validates', () => {
    const pack = JSON.parse(
      readFileSync(join(root, 'benchmark/fixtures/CKES-SMOKE-HARNESS-001.json'), 'utf8'),
    ) as Record<string, unknown>;
    validateBenchmarkPack(pack);
  });

  it('browser projection excludes expected fields', () => {
    const pack = JSON.parse(
      readFileSync(join(root, 'benchmark/fixtures/CKES-SMOKE-HARNESS-001.json'), 'utf8'),
    ) as Record<string, unknown>;
    const view = toBrowserPackView(pack);
    const forbidden = collectForbiddenKeys(view);
    assert.equal(forbidden.length, 0);
    const scenarios = view.scenarios as Record<string, unknown>[];
    assert.equal('expectedDecisionClass' in scenarios[0], false);
  });

  it('concurrency max is 1', () => {
    assert.equal(HARNESS_CONCURRENCY_MAX, 1);
  });

  it('qualify smoke pack passes import mode', () => {
    const pack = JSON.parse(
      readFileSync(join(root, 'benchmark/fixtures/CKES-SMOKE-HARNESS-001.json'), 'utf8'),
    ) as Record<string, unknown>;
    const q = qualifyBenchmarkPack(pack, { mode: 'import', packRoot: root });
    assert.equal(q.passed, true);
  });

  it('leakage check passes on smoke pack', () => {
    const pack = JSON.parse(
      readFileSync(join(root, 'benchmark/fixtures/CKES-SMOKE-HARNESS-001.json'), 'utf8'),
    ) as Record<string, unknown>;
    const r = verifyScenarioLeakage(pack);
    assert.equal(r.passed, true);
  });

  it('dry run cannot be designated reference baseline', () => {
    assert.throws(() =>
      assertDesignatableReferenceBaseline({
        run: { dryRun: true, lifecycleState: 'completed', runType: 'qualification' },
        scenarios: [],
        aggregates: {},
      }),
    );
  });

  it('reference_baseline_001 blocked without G5 flag', async () => {
    await assert.rejects(() =>
      designateReference({
        designationsDir: join(root, 'experiments/reference-designations'),
        runId: 'test',
        runResultHash: 'a'.repeat(64),
        label: 'reference_baseline_001',
        designatedBy: 'test',
        runTerminalState: 'completed',
      }),
    );
  });

  it('compare detects pack hash mismatch', () => {
    const a = {
      run: { packContentHash: 'a'.repeat(64), packId: 'P', gitCommit: '1', retrievalMode: 'deterministic_fixture', databaseProfile: 'clean' },
    };
    const b = {
      run: { packContentHash: 'b'.repeat(64), packId: 'P', gitCommit: '1', retrievalMode: 'deterministic_fixture', databaseProfile: 'clean' },
    };
    const c = compareRunCompatibility(a as Record<string, unknown>, b as Record<string, unknown>);
    assert.equal(c.comparable, false);
  });
});
