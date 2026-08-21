import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type AdjudicationClass =
  | 'EQUIVALENT'
  | 'SUBSUMED_BY_EXISTING'
  | 'MORE_SPECIFIC_THAN_EXISTING'
  | 'MORE_GENERAL_THAN_EXISTING'
  | 'PARTIALLY_OVERLAPS'
  | 'EXTENDS_EXISTING'
  | 'CONTRADICTS'
  | 'DISTINCT'
  | 'UNCERTAIN';

export type PolicyAction =
  | 'reuse_existing'
  | 'reject_new_identity'
  | 'extend_or_evidence'
  | 'evidence_only'
  | 'propose_extension'
  | 'preserve_conflict'
  | 'evaluate_new_identity'
  | 'defer'
  | 'escalate'
  | 'reject';

export interface PolicyDocument {
  version: string;
  rules: {
    conceptCreation: Record<string, boolean>;
    knowledgeAdmission: Record<string, boolean | string[]>;
    semanticActions: Record<AdjudicationClass, PolicyAction>;
    canonicalEconomy: { maxNewConceptsPerThousandSourceItems: number; warnLinearGrowth: boolean };
    riskTiers: Record<string, string[]>;
  };
  thresholds: Record<string, number>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadPolicy(): PolicyDocument {
  const raw = readFileSync(join(__dirname, '..', 'cals-policy.v1.json'), 'utf8');
  return JSON.parse(raw) as PolicyDocument;
}

export interface PolicyEvaluationInput {
  adjudicationClass: AdjudicationClass;
  confidence: number;
  isSyntheticProvenance: boolean;
  riskCategory?: string;
  newConceptsThisRun: number;
  sourceItemsThisStage: number;
}

export interface PolicyEvaluationResult {
  action: PolicyAction;
  admit: boolean;
  escalate: boolean;
  rationale: string;
}

export function evaluatePolicy(
  policy: PolicyDocument,
  input: PolicyEvaluationInput,
): PolicyEvaluationResult {
  const baseAction = policy.rules.semanticActions[input.adjudicationClass] ?? 'defer';

  if (input.isSyntheticProvenance && input.riskCategory && policy.rules.riskTiers.high.includes(input.riskCategory)) {
    return {
      action: 'escalate',
      admit: false,
      escalate: true,
      rationale: 'Synthetic provenance blocks auto-admit for high-risk category',
    };
  }

  if (input.confidence < (policy.thresholds.deferBelow ?? 0.6)) {
    return {
      action: 'defer',
      admit: false,
      escalate: false,
      rationale: `Confidence ${input.confidence} below defer threshold`,
    };
  }

  const conceptsPerK =
    input.sourceItemsThisStage > 0
      ? (input.newConceptsThisRun / input.sourceItemsThisStage) * 1000
      : 0;
  if (conceptsPerK > policy.rules.canonicalEconomy.maxNewConceptsPerThousandSourceItems) {
    if (baseAction === 'evaluate_new_identity') {
      return {
        action: 'defer',
        admit: false,
        escalate: true,
        rationale: `Canonical economy limit exceeded (${conceptsPerK.toFixed(1)} concepts/1000 items)`,
      };
    }
  }

  const admit =
    baseAction === 'reuse_existing' ||
    baseAction === 'extend_or_evidence' ||
    baseAction === 'propose_extension' ||
    baseAction === 'evaluate_new_identity' ||
    baseAction === 'preserve_conflict';

  if (input.isSyntheticProvenance && baseAction === 'evaluate_new_identity') {
    return {
      action: baseAction,
      admit: policy.rules.knowledgeAdmission.autoAdmitSyntheticProvenance === true,
      escalate: false,
      rationale: 'Synthetic provenance — experimental admission only when policy permits',
    };
  }

  return {
    action: baseAction,
    admit: admit && baseAction !== 'reject_new_identity',
    escalate: baseAction === 'preserve_conflict',
    rationale: `Policy mapped ${input.adjudicationClass} → ${baseAction}`,
  };
}
