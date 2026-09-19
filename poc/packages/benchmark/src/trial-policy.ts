export type TrialAggregation = 'majority_pass' | 'worst_case_safety';
export type OnCeilingExhausted = 'fail_scenario' | 'fail_run';
export type IncompleteTrialsInvalidate = 'scenario' | 'run';

export interface ExecutionClassTrialRule {
  executionMode: 'decision_slice' | 'full_pipeline';
  llmPolicy?: 'required' | 'allowed' | 'not_required' | 'prohibited';
  trials: number;
}

export interface TrialPolicy {
  defaultTrials: number;
  byExecutionClass?: ExecutionClassTrialRule[];
  modelCallLimit?: number;
  tokenCeiling?: number;
  budgetUsdCeiling?: number;
  timeoutMsPerTrial?: number;
  maxRetriesPerTrial?: number;
  onCeilingExhausted: OnCeilingExhausted;
  incompleteTrialsInvalidate: IncompleteTrialsInvalidate;
  aggregation: TrialAggregation;
}

export function resolveTrialCount(
  policy: TrialPolicy,
  scenario: { executionMode?: string; llmPolicy?: string },
): number {
  const mode = scenario.executionMode as 'decision_slice' | 'full_pipeline' | undefined;
  const llm = scenario.llmPolicy as ExecutionClassTrialRule['llmPolicy'] | undefined;
  for (const rule of policy.byExecutionClass ?? []) {
    if (rule.executionMode === mode) {
      if (!rule.llmPolicy || rule.llmPolicy === llm) return rule.trials;
    }
  }
  return policy.defaultTrials;
}
