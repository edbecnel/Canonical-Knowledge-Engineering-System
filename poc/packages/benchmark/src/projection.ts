import { collectForbiddenKeys } from './forbidden-keys.js';

const PIPELINE_SCENARIO_ALLOWLIST = [
  'scenarioId',
  'executionMode',
  'sourceText',
  'directCandidate',
  'candidateType',
  'context',
  'applicability',
  'objectiveMethod',
  'semanticRoles',
  'sourceMetadata',
] as const;

export type PipelineScenarioInput = {
  scenarioId: string;
  executionMode: 'full_pipeline' | 'decision_slice';
  sourceText?: string;
  directCandidate?: {
    candidateType: string;
    text: string;
  };
  candidateType?: string;
  context?: Record<string, unknown>;
  applicability?: Record<string, unknown>;
  objectiveMethod?: Record<string, unknown>;
  semanticRoles?: Record<string, unknown>;
  sourceMetadata?: Record<string, unknown>;
};

function pickAllowlisted(scenario: Record<string, unknown>): PipelineScenarioInput {
  const out: Record<string, unknown> = {};
  for (const key of PIPELINE_SCENARIO_ALLOWLIST) {
    if (key in scenario) {
      out[key] = scenario[key];
    }
  }
  if (!out.scenarioId || !out.executionMode) {
    throw new Error('scenarioId and executionMode are required for pipeline projection');
  }
  return out as PipelineScenarioInput;
}

/**
 * Allowlist projection — does not clone full scenario and delete fields.
 */
export function toPipelineInput(
  scenario: Record<string, unknown>,
  _packContext?: { packId: string; packVersion: string },
): PipelineScenarioInput {
  const projected = pickAllowlisted(scenario);
  const forbidden = collectForbiddenKeys(projected);
  if (forbidden.length > 0) {
    throw new Error(`Projected pipeline input contains forbidden keys: ${forbidden.join(', ')}`);
  }
  return projected;
}
