import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapEvaluationRefToBenchmarkSeedId } from '../src/seed-mapping.js';
import { deterministicConceptIdForSeed } from '../src/harness-seed-id.js';
import { scoreScenario } from '../src/scoring.js';

describe('benchmark seed mapping (G3.1)', () => {
  const seeds = [{ seedId: 'CK-CUL-01', label: 'Deep fry' }];

  it('maps canonicalId to benchmark seedId when harness UUID matches', () => {
    const cap = mapEvaluationRefToBenchmarkSeedId(
      {
        present: true,
        canonicalLabel: 'display mismatch ok',
        canonicalId: deterministicConceptIdForSeed('CK-CUL-01'),
      },
      seeds,
    );
    assert.equal(cap.identityEvidenceStatus, 'present_mapped');
    assert.equal(cap.benchmarkLocalSeedId, 'CK-CUL-01');
  });

  it('maps canonical label to benchmark seedId', () => {
    const cap = mapEvaluationRefToBenchmarkSeedId(
      { present: true, canonicalLabel: 'Deep fry' },
      seeds,
    );
    assert.equal(cap.identityEvidenceStatus, 'present_mapped');
    assert.equal(cap.benchmarkLocalSeedId, 'CK-CUL-01');
  });

  it('distinguishes absent_no_merge from absent_no_retrieval', () => {
    const a = mapEvaluationRefToBenchmarkSeedId(
      { present: false, reason: 'no_merge_identity_in_decision' },
      seeds,
    );
    const b = mapEvaluationRefToBenchmarkSeedId(
      { present: false, reason: 'no_retrieval_matches' },
      seeds,
    );
    assert.equal(a.identityEvidenceStatus, 'absent_no_merge');
    assert.equal(b.identityEvidenceStatus, 'absent_no_retrieval');
  });

  it('live-style must-not-match produces false_merge when seed mapped', () => {
    const cap = mapEvaluationRefToBenchmarkSeedId(
      { present: true, canonicalLabel: 'Deep fry' },
      seeds,
    );
    const score = scoreScenario(
      {
        expectedDecisionClass: 'related_distinct',
        mustNotMatchIdentities: [{ referenceKind: 'local', seedId: 'CK-CUL-01' }],
      },
      {
        adjudicationClass: 'EQUIVALENT',
        policyAction: 'admit',
        matchedSeedId: cap.benchmarkLocalSeedId,
      },
    );
    assert.equal(score.failureClassification, 'false_merge');
  });

  it('no fabricated seed on absent merge', () => {
    const cap = mapEvaluationRefToBenchmarkSeedId(
      { present: false, reason: 'no_merge_identity_in_decision' },
      seeds,
    );
    const score = scoreScenario(
      {
        expectedDecisionClass: 'related_distinct',
        mustNotMatchIdentities: [{ referenceKind: 'local', seedId: 'CK-CUL-01' }],
      },
      { adjudicationClass: 'DISTINCT', policyAction: 'reject', matchedSeedId: undefined },
    );
    assert.notEqual(score.failureClassification, 'false_merge');
    assert.equal(cap.benchmarkLocalSeedId, undefined);
  });
});
