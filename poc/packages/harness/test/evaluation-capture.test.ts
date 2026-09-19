import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveEvaluationMatchedIdentityRef } from '@ckes/pipeline';
import { buildScenarioEvaluationCapture, matchedSeedIdForScoring } from '../src/evaluation-capture.js';
import { scoreScenario } from '@ckes/benchmark';

describe('harness evaluation capture integration (G3.1)', () => {
  it('end-to-end path from adjudication-derived ref to false_merge score', () => {
    const matches = [
      {
        id: 'uuid-1',
        matchType: 'concept' as const,
        label: 'GPIO pin',
        score: 1,
        method: 'exact',
      },
    ];
    const evalRef = deriveEvaluationMatchedIdentityRef(matches, 'EQUIVALENT', 'admit');
    const capture = buildScenarioEvaluationCapture(
      evalRef.present
        ? { present: true, canonicalLabel: evalRef.canonicalLabel }
        : { present: false, reason: (evalRef as { reason: string }).reason },
      [{ seedId: 'CK-ELS-01', label: 'GPIO pin' }],
    );
    assert.equal(capture.identityEvidenceStatus, 'present_mapped');
    const score = scoreScenario(
      {
        expectedDecisionClass: 'related_distinct',
        mustNotMatchIdentities: [{ referenceKind: 'local', seedId: 'CK-ELS-01' }],
      },
      {
        adjudicationClass: 'EQUIVALENT',
        policyAction: 'admit',
        matchedSeedId: matchedSeedIdForScoring(capture),
      },
    );
    assert.equal(score.failureClassification, 'false_merge');
  });
});
