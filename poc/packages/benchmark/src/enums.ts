/** Provisional CKES-facing decision classes (not normative CRA). */
export const DECISION_CLASSES = [
  'match_existing',
  'related_distinct',
  'propose_new_identity',
  'qualify_existing',
  'contradict_existing',
  'revalidation_candidate',
  'defer_llm',
  'defer_human',
  'reject_source_specific',
] as const;

export type DecisionClass = (typeof DECISION_CLASSES)[number];

export const EVALUATION_OUTCOMES = [
  'pass',
  'fail',
  'acceptable_alternative',
  'infrastructure_error',
  'not_evaluated',
] as const;

export type EvaluationOutcome = (typeof EVALUATION_OUTCOMES)[number];

export const FAILURE_CLASSIFICATIONS = [
  'false_merge',
  'missed_match',
  'unnecessary_new_identity',
  'unnecessary_deferral',
  'applicability_error',
  'policy_violation',
] as const;

export type FailureClassification = (typeof FAILURE_CLASSIFICATIONS)[number];

export const PACK_STATUSES = ['draft', 'reviewed', 'released', 'retired'] as const;
export type PackStatus = (typeof PACK_STATUSES)[number];

export const SUITE_CLASSES = ['anchor', 'statistical', 'challenge'] as const;

export const LABEL_CONFIDENCE_CLASSES = [
  'deterministic_by_construction',
  'strong_expectation',
  'acceptable_result_set',
  'expected_deferral',
  'human_review_required',
  'research_unresolved',
] as const;

export function isDecisionClass(value: string): boolean {
  return (DECISION_CLASSES as readonly string[]).includes(value);
}

export function isEvaluationOutcome(value: string): boolean {
  return (EVALUATION_OUTCOMES as readonly string[]).includes(value);
}

export function isFailureClassification(value: string): boolean {
  return (FAILURE_CLASSIFICATIONS as readonly string[]).includes(value);
}

/** Schema rejects decision-layer fields misused as decision classes. */
export function assertDecisionOutcomeSeparation(expectedDecisionClass?: string): void {
  if (expectedDecisionClass && isFailureClassification(expectedDecisionClass)) {
    throw new Error(`"${expectedDecisionClass}" is a failure classification, not a decision class`);
  }
}
