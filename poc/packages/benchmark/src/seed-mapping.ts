import { normalizeLabel } from '@ckes/adapter';
import { deterministicConceptIdForSeed } from './harness-seed-id.js';

export interface PackSeedEntry {
  seedId: string;
  label: string;
}

export type IdentityEvidenceStatus =
  | 'present_mapped'
  | 'present_unmapped'
  | 'absent_no_merge'
  | 'absent_no_retrieval';

export interface BenchmarkEvaluationCapture {
  evaluationMatchedIdentityRef: Record<string, unknown>;
  benchmarkLocalSeedId?: string;
  identityEvidenceStatus: IdentityEvidenceStatus;
}

export function mapEvaluationRefToBenchmarkSeedId(
  evaluationRef: {
    present: boolean;
    canonicalLabel?: string;
    canonicalId?: string;
    reason?: string;
  },
  seeds: PackSeedEntry[],
): BenchmarkEvaluationCapture {
  if (!evaluationRef.present) {
    const reason = evaluationRef.reason ?? 'no_merge_identity_in_decision';
    const status: IdentityEvidenceStatus =
      reason === 'no_retrieval_matches' ? 'absent_no_retrieval' : 'absent_no_merge';
    return {
      evaluationMatchedIdentityRef: evaluationRef as Record<string, unknown>,
      identityEvidenceStatus: status,
    };
  }
  if (evaluationRef.canonicalId) {
    const byId = seeds.find(
      (s) => deterministicConceptIdForSeed(s.seedId) === evaluationRef.canonicalId,
    );
    if (byId) {
      return {
        evaluationMatchedIdentityRef: evaluationRef as Record<string, unknown>,
        benchmarkLocalSeedId: byId.seedId,
        identityEvidenceStatus: 'present_mapped',
      };
    }
  }
  const labelNorm = normalizeLabel(evaluationRef.canonicalLabel ?? '');
  const hit = seeds.find((s) => normalizeLabel(s.label) === labelNorm);
  if (!hit) {
    return {
      evaluationMatchedIdentityRef: evaluationRef as Record<string, unknown>,
      identityEvidenceStatus: 'present_unmapped',
    };
  }
  return {
    evaluationMatchedIdentityRef: evaluationRef as Record<string, unknown>,
    benchmarkLocalSeedId: hit.seedId,
    identityEvidenceStatus: 'present_mapped',
  };
}
