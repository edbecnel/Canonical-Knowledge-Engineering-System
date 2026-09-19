import type { ScenarioScore } from './scoring.js';
import { computeScorerContentHash, SCORER_VERSION } from './scorer-meta.js';

export interface DerivedRunReport {
  reportKind: 'derived_run_report';
  schemaVersion: '1.0.0';
  scorerVersion: string;
  scorerContentHash: string;
  sourceRunId: string;
  sourceRunResultPath: string;
  sourceRunResultHash?: string;
  generatedAt: string;
  dryRun: boolean;
  falseMergeSafety: {
    falseMergeCount: number;
    falseMergeRate: number;
    falseMergeRateCi95?: { lower: number; upper: number };
    bySeverity: Record<string, number>;
    byTransformationType: Record<string, number>;
    byDomain: Record<string, number>;
    highSeverityScenarioIds: string[];
    criticalSeverityScenarioIds: string[];
  };
  rates: {
    passRate: number;
    missedMatchRate: number;
    unnecessaryDeferralRate: number;
    infrastructureFailureRate: number;
  };
  scenarioOutcomes: Array<{
    scenarioId: string;
    outcome: string;
    failureClassification?: string;
    failureSeverity?: string;
    domain?: string;
    transformationType?: string;
  }>;
  limitations: string[];
}

function wilsonInterval(successes: number, n: number, z = 1.96): { lower: number; upper: number } | undefined {
  if (n <= 0) return undefined;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return {
    lower: Math.max(0, (center - margin) / denom),
    upper: Math.min(1, (center + margin) / denom),
  };
}

export function buildDerivedRunReport(params: {
  runResult: Record<string, unknown>;
  packScenarios?: Record<string, unknown>[];
  sourceRunResultPath: string;
  sourceRunResultHash?: string;
}): DerivedRunReport {
  const run = params.runResult.run as Record<string, unknown>;
  const scenarios = params.runResult.scenarios as Record<string, unknown>[];
  const packById = new Map(
    (params.packScenarios ?? []).map((s) => [s.scenarioId as string, s]),
  );

  const falseMerges = scenarios.filter((s) => s.failureClassification === 'false_merge');
  const evaluated = scenarios.filter((s) => s.outcome !== 'not_evaluated');
  const n = evaluated.length || 1;

  const bySeverity: Record<string, number> = {};
  const byTransformationType: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  const highIds: string[] = [];
  const criticalIds: string[] = [];

  for (const s of falseMerges) {
    const packSc = packById.get(s.scenarioId as string);
    const sev = (packSc?.failureSeverity as string) ?? 'unspecified';
    const tr = (packSc?.transformationType as string) ?? 'unspecified';
    const dom = (packSc?.domain as string) ?? 'unspecified';
    bySeverity[sev] = (bySeverity[sev] ?? 0) + 1;
    byTransformationType[tr] = (byTransformationType[tr] ?? 0) + 1;
    byDomain[dom] = (byDomain[dom] ?? 0) + 1;
    if (sev === 'high') highIds.push(s.scenarioId as string);
    if (sev === 'critical') criticalIds.push(s.scenarioId as string);
  }

  const passCount = scenarios.filter((s) => s.outcome === 'pass' || s.outcome === 'acceptable_alternative').length;
  const missed = scenarios.filter((s) => s.failureClassification === 'missed_match').length;
  const unnDef = scenarios.filter((s) => s.failureClassification === 'unnecessary_deferral').length;
  const infra = scenarios.filter((s) => s.outcome === 'infrastructure_error').length;

  return {
    reportKind: 'derived_run_report',
    schemaVersion: '1.0.0',
    scorerVersion: SCORER_VERSION,
    scorerContentHash: computeScorerContentHash(),
    sourceRunId: run.runId as string,
    sourceRunResultPath: params.sourceRunResultPath,
    sourceRunResultHash: params.sourceRunResultHash,
    generatedAt: new Date().toISOString(),
    dryRun: Boolean(run.dryRun),
    falseMergeSafety: {
      falseMergeCount: falseMerges.length,
      falseMergeRate: falseMerges.length / n,
      falseMergeRateCi95: wilsonInterval(falseMerges.length, n),
      bySeverity,
      byTransformationType,
      byDomain,
      highSeverityScenarioIds: highIds,
      criticalSeverityScenarioIds: criticalIds,
    },
    rates: {
      passRate: passCount / n,
      missedMatchRate: missed / n,
      unnecessaryDeferralRate: unnDef / n,
      infrastructureFailureRate: infra / n,
    },
    scenarioOutcomes: scenarios.map((s) => {
      const packSc = packById.get(s.scenarioId as string);
      return {
        scenarioId: s.scenarioId as string,
        outcome: s.outcome as string,
        failureClassification: s.failureClassification as string | undefined,
        failureSeverity: packSc?.failureSeverity as string | undefined,
        domain: packSc?.domain as string | undefined,
        transformationType: packSc?.transformationType as string | undefined,
      };
    }),
    limitations: [
      'POC rates are not production accuracy or prevalence estimates.',
      'Composite pass rate must not override false-merge safety findings.',
    ],
  };
}

export function renderDerivedReportMarkdown(report: DerivedRunReport): string {
  const fm = report.falseMergeSafety;
  const lines = [
    '# Derived benchmark run report',
    '',
    '> **Derived artifact** — does not modify immutable run-result JSON.',
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| sourceRunId | ${report.sourceRunId} |`,
    `| scorerVersion | ${report.scorerVersion} |`,
    `| scorerContentHash | \`${report.scorerContentHash}\` |`,
    `| dryRun | ${report.dryRun} |`,
    '',
    '## False-merge safety (primary)',
    '',
    `- **Count:** ${fm.falseMergeCount}`,
    `- **Rate:** ${(fm.falseMergeRate * 100).toFixed(2)}%`,
    fm.falseMergeRateCi95
      ? `- **95% CI:** ${(fm.falseMergeRateCi95.lower * 100).toFixed(2)}% – ${(fm.falseMergeRateCi95.upper * 100).toFixed(2)}%`
      : '',
    '',
    '### High / critical false-merge scenario IDs',
    '',
    `- critical: ${fm.criticalSeverityScenarioIds.join(', ') || '(none)'}`,
    `- high: ${fm.highSeverityScenarioIds.join(', ') || '(none)'}`,
    '',
    '## Other rates',
    '',
    `- pass: ${(report.rates.passRate * 100).toFixed(2)}%`,
    `- missed match: ${(report.rates.missedMatchRate * 100).toFixed(2)}%`,
    `- unnecessary deferral: ${(report.rates.unnecessaryDeferralRate * 100).toFixed(2)}%`,
    `- infrastructure failure: ${(report.rates.infrastructureFailureRate * 100).toFixed(2)}%`,
    '',
    '## Limitations',
    '',
    ...report.limitations.map((l) => `- ${l}`),
  ];
  return lines.filter(Boolean).join('\n');
}
