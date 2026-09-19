import type { DecisionClass, EvaluationOutcome, FailureClassification } from './enums.js';

export interface ScenarioExpectations {
  expectedDecisionClass?: DecisionClass | string;
  mustNotMatchIdentities?: unknown[];
}

export interface ScenarioActuals {
  adjudicationClass?: string;
  policyAction?: string;
  provisionalDecisionClass?: string;
}

export interface ScenarioScore {
  outcome: EvaluationOutcome;
  failureClassification?: FailureClassification;
  failureLayer?: 'extraction' | 'retrieval' | 'adjudication' | 'policy' | 'decision_slice_outcome';
}

function mapsToMerge(adj: string, policy: string): boolean {
  return (
    policy === 'admit' ||
    policy === 'extend_or_evidence' ||
    adj === 'EQUIVALENT' ||
    adj === 'SUBSUMED_BY_EXISTING'
  );
}

export function scoreScenario(
  expectations: ScenarioExpectations,
  actuals: ScenarioActuals,
): ScenarioScore {
  const expected = expectations.expectedDecisionClass;
  const adj = actuals.adjudicationClass ?? '';
  const policy = actuals.policyAction ?? '';
  const merged = mapsToMerge(adj, policy);

  if (expected === 'related_distinct' || expected === 'propose_new_identity') {
    if (merged) {
      return { outcome: 'fail', failureClassification: 'false_merge', failureLayer: 'decision_slice_outcome' };
    }
  }

  if (expected === 'match_existing' && (merged || adj === 'EQUIVALENT')) {
    return { outcome: 'pass', failureLayer: 'decision_slice_outcome' };
  }

  if (expected === 'defer_llm' || expected === 'defer_human') {
    if (policy === 'defer' || policy === 'escalate') {
      return { outcome: 'pass', failureLayer: 'decision_slice_outcome' };
    }
    return { outcome: 'fail', failureClassification: 'unnecessary_deferral', failureLayer: 'policy' };
  }

  if (!expected) {
    return { outcome: 'not_evaluated', failureLayer: 'decision_slice_outcome' };
  }

  return { outcome: 'fail', failureLayer: 'decision_slice_outcome' };
}
