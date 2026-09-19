/** Keys that must never appear in pipeline inputs (including nested). */
export const FORBIDDEN_PIPELINE_KEYS = new Set([
  'expectedDecisionClass',
  'expectedIdentity',
  'relatedIdentities',
  'mustNotMatchIdentities',
  'acceptableAlternatives',
  'transformationType',
  'failureSeverity',
  'scoringMetadata',
  'expectedRationale',
  'labelConfidenceClass',
  'retrievalHints',
  'ckesParRefs',
  'validationMatrixRefs',
  'generationProvenance',
  'humanReviewStatus',
  'expected',
  'groundTruth',
]);

export function collectForbiddenKeys(value: unknown, path = ''): string[] {
  const hits: string[] = [];
  if (value === null || typeof value !== 'object') return hits;
  if (Array.isArray(value)) {
    value.forEach((item, i) => hits.push(...collectForbiddenKeys(item, `${path}[${i}]`)));
    return hits;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const full = path ? `${path}.${key}` : key;
    if (FORBIDDEN_PIPELINE_KEYS.has(key)) hits.push(full);
    hits.push(...collectForbiddenKeys(child, full));
  }
  return hits;
}
