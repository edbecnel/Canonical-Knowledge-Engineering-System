import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveEvaluationMatchedIdentityRef } from '../src/evaluation-identity.js';
import type { RetrievalMatch } from '../src/retrieval.js';

const match: RetrievalMatch = {
  id: 'concept-uuid-1',
  matchType: 'concept',
  label: 'Deep fry',
  score: 1,
  method: 'exact',
};

describe('evaluation identity (G3.1)', () => {
  it('captures primary match on EQUIVALENT + admit', () => {
    const r = deriveEvaluationMatchedIdentityRef([match], 'EQUIVALENT', 'admit');
    assert.equal(r.present, true);
    if (r.present) {
      assert.equal(r.canonicalId, 'concept-uuid-1');
      assert.equal(r.basis, 'primary_retrieval_match_used_by_adjudication');
    }
  });

  it('absent when no retrieval matches', () => {
    const r = deriveEvaluationMatchedIdentityRef([], 'DISTINCT', 'reject');
    assert.equal(r.present, false);
    if (!r.present) assert.equal(r.reason, 'no_retrieval_matches');
  });

  it('absent on DISTINCT despite matches (no fabricated identity)', () => {
    const r = deriveEvaluationMatchedIdentityRef([match], 'DISTINCT', 'reject');
    assert.equal(r.present, false);
    if (!r.present) assert.equal(r.reason, 'no_merge_identity_in_decision');
  });

  it('absent on defer without merge policy', () => {
    const r = deriveEvaluationMatchedIdentityRef([match], 'UNCERTAIN', 'defer');
    assert.equal(r.present, false);
  });
});
