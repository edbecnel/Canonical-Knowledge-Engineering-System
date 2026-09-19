import { mapEvaluationRefToBenchmarkSeedId, type PackSeedEntry } from '@ckes/benchmark';

export function buildScenarioEvaluationCapture(
  evaluationRef: { present: boolean; canonicalLabel?: string; reason?: string },
  seeds: PackSeedEntry[],
) {
  return mapEvaluationRefToBenchmarkSeedId(evaluationRef, seeds);
}

export function matchedSeedIdForScoring(
  capture: ReturnType<typeof mapEvaluationRefToBenchmarkSeedId>,
): string | undefined {
  if (capture.identityEvidenceStatus === 'present_mapped') {
    return capture.benchmarkLocalSeedId;
  }
  return undefined;
}
