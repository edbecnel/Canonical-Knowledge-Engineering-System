import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateTrialScores,
  scoreScenario,
  type ScenarioExpectations,
  type ScenarioActuals,
} from '../src/scoring.js';

function score(exp: ScenarioExpectations, act: ScenarioActuals) {
  return scoreScenario(exp, act);
}

describe('scorer qualification (Handover 3 G1)', () => {
  it('match_existing passes on equivalent merge', () => {
    const r = score({ expectedDecisionClass: 'match_existing' }, { adjudicationClass: 'EQUIVALENT', policyAction: 'admit' });
    assert.equal(r.outcome, 'pass');
  });

  it('match_existing fails missed_match when not merged', () => {
    const r = score({ expectedDecisionClass: 'match_existing' }, { adjudicationClass: 'DISTINCT', policyAction: 'reject' });
    assert.equal(r.outcome, 'fail');
    assert.equal(r.failureClassification, 'missed_match');
  });

  it('acceptable alternative via acceptable_result_set', () => {
    const r = score(
      { expectedDecisionClass: 'match_existing', labelConfidenceClass: 'acceptable_result_set' },
      { adjudicationClass: 'EQUIVALENT', policyAction: 'admit' },
    );
    assert.equal(r.outcome, 'acceptable_alternative');
  });

  it('related_distinct fails false_merge on admit', () => {
    const r = score({ expectedDecisionClass: 'related_distinct' }, { adjudicationClass: 'EQUIVALENT', policyAction: 'admit' });
    assert.equal(r.outcome, 'fail');
    assert.equal(r.failureClassification, 'false_merge');
  });

  it('propose_new_identity passes when not merged', () => {
    const r = score({ expectedDecisionClass: 'propose_new_identity' }, { adjudicationClass: 'NEW', policyAction: 'reject' });
    assert.equal(r.outcome, 'pass');
  });

  it('propose_new_identity fails false_merge on admit', () => {
    const r = score({ expectedDecisionClass: 'propose_new_identity' }, { adjudicationClass: 'EQUIVALENT', policyAction: 'admit' });
    assert.equal(r.outcome, 'fail');
    assert.equal(r.failureClassification, 'false_merge');
  });

  it('defer_llm passes on defer', () => {
    const r = score({ expectedDecisionClass: 'defer_llm' }, { policyAction: 'defer' });
    assert.equal(r.outcome, 'pass');
  });

  it('defer_llm fails when admit merges instead of deferring', () => {
    const r = score({ expectedDecisionClass: 'defer_llm' }, { policyAction: 'admit', adjudicationClass: 'EQUIVALENT' });
    assert.equal(r.outcome, 'fail');
    assert.equal(r.failureClassification, 'false_merge');
  });

  it('defer false_merge when merged despite defer expectation', () => {
    const r = score({ expectedDecisionClass: 'defer_human' }, { policyAction: 'admit', adjudicationClass: 'EQUIVALENT' });
    assert.equal(r.failureClassification, 'false_merge');
  });

  it('qualify_existing passes extend_or_evidence', () => {
    const r = score({ expectedDecisionClass: 'qualify_existing' }, { policyAction: 'extend_or_evidence' });
    assert.equal(r.outcome, 'pass');
  });

  it('contradict_existing passes CONTRADICTS', () => {
    const r = score({ expectedDecisionClass: 'contradict_existing' }, { adjudicationClass: 'CONTRADICTS' });
    assert.equal(r.outcome, 'pass');
  });

  it('contradict_existing fails false_merge on merge', () => {
    const r = score({ expectedDecisionClass: 'contradict_existing' }, { adjudicationClass: 'EQUIVALENT', policyAction: 'admit' });
    assert.equal(r.failureClassification, 'false_merge');
  });

  it('revalidation_candidate passes escalate', () => {
    const r = score({ expectedDecisionClass: 'revalidation_candidate' }, { policyAction: 'escalate' });
    assert.equal(r.outcome, 'pass');
  });

  it('must-not-match identity triggers false_merge', () => {
    const r = score(
      { expectedDecisionClass: 'related_distinct', mustNotMatchIdentities: [{ referenceKind: 'local', seedId: 'CK-1' }] },
      { adjudicationClass: 'EQUIVALENT', policyAction: 'reject', matchedSeedId: 'CK-1' },
    );
    assert.equal(r.failureClassification, 'false_merge');
  });

  it('infrastructure_error separated from decision failure', () => {
    const r = score({ expectedDecisionClass: 'match_existing' }, { infrastructureError: true });
    assert.equal(r.outcome, 'infrastructure_error');
    assert.equal(r.failureClassification, undefined);
  });

  it('multi-trial worst_case_safety prefers false_merge', () => {
    const agg = aggregateTrialScores(
      [
        { outcome: 'pass' },
        { outcome: 'fail', failureClassification: 'false_merge' },
        { outcome: 'pass' },
      ],
      'worst_case_safety',
    );
    assert.equal(agg.failureClassification, 'false_merge');
  });

  it('multi-trial majority_pass', () => {
    const agg = aggregateTrialScores(
      [{ outcome: 'pass' }, { outcome: 'pass' }, { outcome: 'fail', failureClassification: 'missed_match' }],
      'majority_pass',
    );
    assert.equal(agg.outcome, 'pass');
  });
});
