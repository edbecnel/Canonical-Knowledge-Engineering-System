import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPackContentHash,
  assertValidStatusTransition,
  collectForbiddenKeys,
  computePackContentHash,
  isScenarioScoreEligible,
  stripNonDeterministicMarkdown,
  toPipelineInput,
  validateBenchmarkPack,
  validateBenchmarkRunProfile,
  validateBenchmarkRunResult,
  assertDecisionOutcomeSeparation,
  renderBenchmarkPackMarkdown,
} from '../src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, rel), 'utf8')) as Record<string, unknown>;
}

describe('benchmark handover 1', () => {
  it('validates example pack and hash', () => {
    const pack = loadJson('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
    assertPackContentHash(pack);
    validateBenchmarkPack(pack);
  });

  it('validates example run result', () => {
    const result = loadJson('benchmark/examples/CKES-EXAMPLE-RUN-RESULT-001.json');
    validateBenchmarkRunResult(result);
  });

  it('rejects unsupported schema version', () => {
    const pack = loadJson('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
    pack.schemaVersion = '9.9.9';
    assert.throws(() => validateBenchmarkPack(pack), /Unsupported pack schemaVersion/);
  });

  it('rejects duplicate scenario IDs', () => {
    const pack = loadJson('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
    const scenarios = pack.scenarios as Record<string, unknown>[];
    scenarios.push({ ...scenarios[0] });
    pack.pack = { ...(pack.pack as object), contentHash: '0'.repeat(64) };
    assert.throws(() => validateBenchmarkPack(pack), /Duplicate scenarioId/);
  });

  it('rejects dangling local identity reference', () => {
    const pack = loadJson('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
    const scenarios = pack.scenarios as Record<string, unknown>[];
    scenarios[0] = {
      ...scenarios[0],
      expectedIdentity: { referenceKind: 'local', seedId: 'MISSING' },
    };
    assert.throws(() => validateBenchmarkPack(pack), /Dangling/);
  });

  it('hash stable across key reorder', () => {
    const a = loadJson('benchmark/schemas/hash-test-vectors/pack-minimal-a.json');
    const b = JSON.parse(readFileSync(join(root, 'benchmark/schemas/hash-test-vectors/pack-minimal-a.json'), 'utf8'));
    const reordered = {
      scenarios: b.scenarios,
      pack: b.pack,
      schemaVersion: b.schemaVersion,
      canonicalSeedMaterial: b.canonicalSeedMaterial,
      executionRequirements: b.executionRequirements,
    };
    assert.equal(computePackContentHash(a), computePackContentHash(reordered));
  });

  it('hash vector matches expected', () => {
    const expected = loadJson('benchmark/schemas/hash-test-vectors/expected-hashes.json');
    const pack = loadJson('benchmark/schemas/hash-test-vectors/pack-minimal-a.json');
    const vector = (expected.vectors as { file: string; contentHash: string }[])[0];
    assert.equal((pack.pack as { contentHash: string }).contentHash, vector.contentHash);
    assertPackContentHash(pack);
  });

  it('hash changes when scored content changes', () => {
    const pack = loadJson('benchmark/schemas/hash-test-vectors/pack-minimal-a.json');
    const before = computePackContentHash(pack);
    const scenarios = pack.scenarios as Record<string, unknown>[];
    scenarios[0] = { ...scenarios[0], title: 'Changed' };
    const after = computePackContentHash(pack);
    assert.notEqual(before, after);
  });

  it('strict projection excludes forbidden fields', () => {
    const pack = loadJson('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
    const scenario = (pack.scenarios as Record<string, unknown>[])[0];
    const projected = toPipelineInput(scenario);
    const forbidden = collectForbiddenKeys(projected);
    assert.equal(forbidden.length, 0);
    assert.equal('expectedDecisionClass' in projected, false);
  });

  it('rejects false_merge as decision class', () => {
    assert.throws(() => assertDecisionOutcomeSeparation('false_merge'), /failure classification/);
  });

  it('scoring eligibility by status', () => {
    assert.equal(isScenarioScoreEligible('draft', 'released'), 'none');
    assert.equal(isScenarioScoreEligible('reviewed', 'reviewed'), 'qualification');
    assert.equal(isScenarioScoreEligible('released', 'released'), 'official');
  });

  it('invalid status transition released to draft', () => {
    assert.throws(() => assertValidStatusTransition('released', 'draft'));
  });

  it('deterministic markdown rendering', () => {
    const pack = loadJson('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
    const md1 = stripNonDeterministicMarkdown(
      renderBenchmarkPackMarkdown(pack, {
        sourceArtifactId: 'CKES-EXAMPLE-PACK-001.json',
        schemaVersion: '1.0.0',
        contentVersion: '1.0.0',
        contentHash: (pack.pack as { contentHash: string }).contentHash,
        generatedAt: '2026-09-19T00:00:00Z',
      }),
    );
    const md2 = stripNonDeterministicMarkdown(
      renderBenchmarkPackMarkdown(pack, {
        sourceArtifactId: 'CKES-EXAMPLE-PACK-001.json',
        schemaVersion: '1.0.0',
        contentVersion: '1.0.0',
        contentHash: (pack.pack as { contentHash: string }).contentHash,
        generatedAt: '2026-09-20T00:00:00Z',
      }),
    );
    assert.equal(md1, md2);
    assert.match(md1, /Do not edit directly/);
  });

  it('validates run profile schema', () => {
    const profile = loadJson('experiments/run-profiles/CKES-BENCHMARK-RUN-PROFILE-001.json');
    validateBenchmarkRunProfile(profile);
  });

  it('pipeline modules do not reference evaluator ground truth table', () => {
    const pipelineDir = join(root, 'packages/pipeline/src');
    const files = readdirSync(pipelineDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const src = readFileSync(join(pipelineDir, file), 'utf8');
      assert.equal(src.includes('evaluator_ground_truth'), false, `${file} must not query evaluator GT`);
    }
  });
});
