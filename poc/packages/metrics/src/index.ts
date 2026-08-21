export interface RunMetrics {
  corpusStage: string;
  inputChanges: number;
  skippedUnchanged: number;
  analyzed: number;
  mappedToExisting: number;
  evidenceOnly: number;
  deferred: number;
  conflicts: number;
  newConceptsProposed: number;
  newRelationshipsProposed: number;
  newKnowledgeObjects: number;
  automaticallyAdmitted: number;
  escalated: number;
  aiCalls: number;
  aiTokens: number;
  aiCostUsd: number;
  avgCandidateSetSize: number;
  processingTimeMs: number;
}

export function emptyMetrics(corpusStage: string): RunMetrics {
  return {
    corpusStage,
    inputChanges: 0,
    skippedUnchanged: 0,
    analyzed: 0,
    mappedToExisting: 0,
    evidenceOnly: 0,
    deferred: 0,
    conflicts: 0,
    newConceptsProposed: 0,
    newRelationshipsProposed: 0,
    newKnowledgeObjects: 0,
    automaticallyAdmitted: 0,
    escalated: 0,
    aiCalls: 0,
    aiTokens: 0,
    aiCostUsd: 0,
    avgCandidateSetSize: 0,
    processingTimeMs: 0,
  };
}

export function formatRunReport(metrics: RunMetrics): string {
  return [
    'CKES CALS Canonicalization Run',
    '',
    `Corpus stage: ${metrics.corpusStage}`,
    `Input source changes: ${metrics.inputChanges}`,
    `Skipped (unchanged hash): ${metrics.skippedUnchanged}`,
    `Analyzed: ${metrics.analyzed}`,
    `Mapped to existing knowledge: ${metrics.mappedToExisting}`,
    `Evidence only: ${metrics.evidenceOnly}`,
    `Deferred: ${metrics.deferred}`,
    `Conflicts: ${metrics.conflicts}`,
    `New concepts proposed: ${metrics.newConceptsProposed}`,
    `New relationships proposed: ${metrics.newRelationshipsProposed}`,
    `New canonical knowledge objects: ${metrics.newKnowledgeObjects}`,
    `Automatically admitted: ${metrics.automaticallyAdmitted}`,
    `Escalated: ${metrics.escalated}`,
    `AI calls: ${metrics.aiCalls}`,
    `AI tokens: ${metrics.aiTokens}`,
    `AI cost (USD): ${metrics.aiCostUsd.toFixed(4)}`,
    `Avg candidate set size: ${metrics.avgCandidateSetSize.toFixed(2)}`,
    `Processing time (ms): ${metrics.processingTimeMs}`,
  ].join('\n');
}

export interface GrowthMetrics {
  corpusStage: string;
  sourceItemCount: number;
  newConceptsPer1000: number;
  newRelationshipsPer1000: number;
  newKnowledgeObjectsPer1000: number;
  mappingRate: number;
  evidenceOnlyRate: number;
  aiCostPerSourceItem: number;
}

export function computeGrowthMetrics(
  stage: string,
  sourceCount: number,
  metrics: RunMetrics,
  totalConcepts: number,
  totalRelationships: number,
  totalKos: number,
): GrowthMetrics {
  const perK = sourceCount > 0 ? 1000 / sourceCount : 0;
  return {
    corpusStage: stage,
    sourceItemCount: sourceCount,
    newConceptsPer1000: metrics.newConceptsProposed * perK,
    newRelationshipsPer1000: metrics.newRelationshipsProposed * perK,
    newKnowledgeObjectsPer1000: metrics.newKnowledgeObjects * perK,
    mappingRate: metrics.analyzed > 0 ? metrics.mappedToExisting / metrics.analyzed : 0,
    evidenceOnlyRate: metrics.analyzed > 0 ? metrics.evidenceOnly / metrics.analyzed : 0,
    aiCostPerSourceItem: sourceCount > 0 ? metrics.aiCostUsd / sourceCount : 0,
  };
}
