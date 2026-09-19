import type { RetrievalMatch } from './retrieval.js';

/**
 * Identity the existing decision path associates with a merge/equivalence outcome.
 * Deterministic adjudication compares the candidate only against matches[0]; LLM prompt uses matches[0].
 * This is NOT a separate CKES "selected identity" pointer in persistence — it is evaluation observability
 * of the canonical row that adjudication already used as the primary existing match.
 */
export type EvaluationMatchedIdentityRef =
  | {
      present: true;
      referenceKind: 'canonical_concept' | 'canonical_knowledge_object';
      canonicalId: string;
      canonicalLabel: string;
      retrievalRank: 0;
      retrievalMethod: string;
      basis: 'primary_retrieval_match_used_by_adjudication';
    }
  | {
      present: false;
      reason: 'no_retrieval_matches' | 'no_merge_identity_in_decision';
    };

const MERGE_ADJUDICATION = new Set(['EQUIVALENT', 'SUBSUMED_BY_EXISTING', 'EXTENDS_EXISTING']);
const MERGE_POLICY = new Set(['admit', 'extend_or_evidence']);

export function deriveEvaluationMatchedIdentityRef(
  matches: RetrievalMatch[],
  adjudicationClass: string,
  policyAction: string,
): EvaluationMatchedIdentityRef {
  if (!matches.length) {
    return { present: false, reason: 'no_retrieval_matches' };
  }
  const mergeDecision =
    MERGE_ADJUDICATION.has(adjudicationClass) || MERGE_POLICY.has(policyAction);
  if (!mergeDecision) {
    return { present: false, reason: 'no_merge_identity_in_decision' };
  }
  const primary = matches[0];
  return {
    present: true,
    referenceKind: primary.matchType === 'knowledge_object' ? 'canonical_knowledge_object' : 'canonical_concept',
    canonicalId: primary.id,
    canonicalLabel: primary.label,
    retrievalRank: 0,
    retrievalMethod: primary.method,
    basis: 'primary_retrieval_match_used_by_adjudication',
  };
}
