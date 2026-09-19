import type { DecisionClass, EvaluationOutcome, FailureClassification } from './enums.js';
import type { TrialAggregation } from './trial-policy.js';

export interface IdentityRef {
  referenceKind?: string;
  seedId?: string;
  externalId?: string;
}

export interface ScenarioExpectations {
  expectedDecisionClass?: DecisionClass | string;
  expectedIdentity?: IdentityRef;
  mustNotMatchIdentities?: IdentityRef[];
  acceptableAlternatives?: Array<{ decisionClass?: string; identity?: IdentityRef }>;
  labelConfidenceClass?: string;
}

export interface ScenarioActuals {
  adjudicationClass?: string;
  policyAction?: string;
  provisionalDecisionClass?: string;
  matchedSeedId?: string;
  infrastructureError?: boolean;
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

function isDeferAction(policy: string): boolean {
  return policy === 'defer' || policy === 'escalate' || policy === 'queue_human';
}

function matchedForbiddenIdentity(
  actual: ScenarioActuals,
  mustNot: IdentityRef[],
): boolean {
  if (!mustNot.length || !actual.matchedSeedId) return false;
  return mustNot.some((m) => m.referenceKind === 'local' && m.seedId === actual.matchedSeedId);
}

function matchesAcceptableAlternative(
  expectations: ScenarioExpectations,
  actuals: ScenarioActuals,
): boolean {
  const alts = expectations.acceptableAlternatives ?? [];
  if (!alts.length) return false;
  const merged = mapsToMerge(actuals.adjudicationClass ?? '', actuals.policyAction ?? '');
  for (const alt of alts) {
    if (alt.decisionClass && alt.decisionClass === expectations.expectedDecisionClass) {
      if (expectations.expectedDecisionClass === 'match_existing' && merged) return true;
    }
    if (alt.identity?.seedId && alt.identity.seedId === actuals.matchedSeedId) return true;
  }
  if (expectations.labelConfidenceClass === 'acceptable_result_set' && merged) {
    return true;
  }
  return false;
}

export function scoreScenario(
  expectations: ScenarioExpectations,
  actuals: ScenarioActuals,
): ScenarioScore {
  if (actuals.infrastructureError) {
    return { outcome: 'infrastructure_error', failureLayer: 'extraction' };
  }

  const expected = expectations.expectedDecisionClass;
  const adj = actuals.adjudicationClass ?? '';
  const policy = actuals.policyAction ?? '';
  const merged = mapsToMerge(adj, policy);

  if (matchedForbiddenIdentity(actuals, expectations.mustNotMatchIdentities ?? [])) {
    return {
      outcome: 'fail',
      failureClassification: 'false_merge',
      failureLayer: 'decision_slice_outcome',
    };
  }

  if (matchesAcceptableAlternative(expectations, actuals)) {
    return { outcome: 'acceptable_alternative', failureLayer: 'decision_slice_outcome' };
  }

  if (expected === 'match_existing') {
    if (merged || adj === 'EQUIVALENT') {
      if (expectations.labelConfidenceClass === 'acceptable_result_set') {
        return { outcome: 'acceptable_alternative', failureLayer: 'decision_slice_outcome' };
      }
      return { outcome: 'pass', failureLayer: 'decision_slice_outcome' };
    }
    return {
      outcome: 'fail',
      failureClassification: 'missed_match',
      failureLayer: 'decision_slice_outcome',
    };
  }

  if (expected === 'related_distinct' || expected === 'propose_new_identity') {
    if (merged) {
      return {
        outcome: 'fail',
        failureClassification: 'false_merge',
        failureLayer: 'decision_slice_outcome',
      };
    }
    if (expected === 'propose_new_identity' && (policy === 'admit' || adj === 'NEW')) {
      return { outcome: 'pass', failureLayer: 'decision_slice_outcome' };
    }
    if (expected === 'related_distinct' && !merged && (policy === 'reject' || adj === 'DISTINCT')) {
      return { outcome: 'pass', failureLayer: 'decision_slice_outcome' };
    }
    if (expected === 'propose_new_identity' && !merged) {
      return { outcome: 'pass', failureLayer: 'decision_slice_outcome' };
    }
    return {
      outcome: 'fail',
      failureClassification: expected === 'propose_new_identity' ? 'unnecessary_deferral' : 'missed_match',
      failureLayer: 'decision_slice_outcome',
    };
  }

  if (expected === 'defer_llm' || expected === 'defer_human') {
    if (isDeferAction(policy)) {
      return { outcome: 'pass', failureLayer: 'policy' };
    }
    if (merged) {
      return {
        outcome: 'fail',
        failureClassification: 'false_merge',
        failureLayer: 'policy',
      };
    }
    return {
      outcome: 'fail',
      failureClassification: 'unnecessary_deferral',
      failureLayer: 'policy',
    };
  }

  if (expected === 'qualify_existing') {
    if (policy === 'extend_or_evidence' || adj === 'QUALIFIED') {
      return { outcome: 'pass', failureLayer: 'policy' };
    }
    if (merged && !isDeferAction(policy)) {
      return { outcome: 'fail', failureClassification: 'false_merge', failureLayer: 'policy' };
    }
    return { outcome: 'fail', failureLayer: 'decision_slice_outcome' };
  }

  if (expected === 'contradict_existing') {
    if (adj === 'CONTRADICTS' || policy === 'escalate') {
      return { outcome: 'pass', failureLayer: 'adjudication' };
    }
    if (merged) {
      return { outcome: 'fail', failureClassification: 'false_merge', failureLayer: 'adjudication' };
    }
    return { outcome: 'fail', failureLayer: 'adjudication' };
  }

  if (expected === 'revalidation_candidate') {
    if (adj === 'REVALIDATION' || policy === 'escalate' || isDeferAction(policy)) {
      return { outcome: 'pass', failureLayer: 'policy' };
    }
    if (merged) {
      return { outcome: 'fail', failureClassification: 'false_merge', failureLayer: 'policy' };
    }
    return { outcome: 'fail', failureLayer: 'policy' };
  }

  if (expected === 'reject_source_specific') {
    if (policy === 'reject' || adj === 'REJECT') {
      return { outcome: 'pass', failureLayer: 'policy' };
    }
    return { outcome: 'fail', failureLayer: 'policy' };
  }

  if (!expected) {
    return { outcome: 'not_evaluated', failureLayer: 'decision_slice_outcome' };
  }

  return { outcome: 'fail', failureLayer: 'decision_slice_outcome' };
}

export function aggregateTrialScores(
  scores: ScenarioScore[],
  method: TrialAggregation,
): ScenarioScore {
  if (!scores.length) {
    return { outcome: 'not_evaluated', failureLayer: 'decision_slice_outcome' };
  }
  if (method === 'worst_case_safety') {
    const falseMerge = scores.find((s) => s.failureClassification === 'false_merge');
    if (falseMerge) return falseMerge;
    const infra = scores.find((s) => s.outcome === 'infrastructure_error');
    if (infra) return infra;
    const fail = scores.find((s) => s.outcome === 'fail');
    if (fail) return fail;
    const pass = scores.every((s) => s.outcome === 'pass' || s.outcome === 'acceptable_alternative');
    if (pass) return scores[0];
    return scores.find((s) => s.outcome !== 'pass') ?? scores[0];
  }
  const passCount = scores.filter((s) => s.outcome === 'pass' || s.outcome === 'acceptable_alternative').length;
  if (passCount > scores.length / 2) {
    return scores.find((s) => s.outcome === 'pass' || s.outcome === 'acceptable_alternative') ?? scores[0];
  }
  const fail = scores.find((s) => s.outcome === 'fail' || s.outcome === 'infrastructure_error');
  return fail ?? scores[0];
}
