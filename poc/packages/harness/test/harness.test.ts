import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toBrowserPackView, validateBenchmarkPack, collectForbiddenKeys } from '@ckes/benchmark';
import { HARNESS_CONCURRENCY_MAX } from '../src/isolation.js';
import { compareRunCompatibility } from '../src/compare.js';

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
