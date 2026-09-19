import { collectForbiddenKeys } from '@ckes/benchmark';
import { toPipelineInput } from '@ckes/benchmark';

export interface IntegrityCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export function verifyScenarioLeakage(
  pack: Record<string, unknown>,
  scenarioIds?: string[],
): IntegrityCheckResult {
  const errors: string[] = [];
  const packMeta = pack.pack as Record<string, unknown>;
  const scenarios = (pack.scenarios as Record<string, unknown>[]).filter((s) =>
    scenarioIds?.length ? scenarioIds.includes(s.scenarioId as string) : true,
  );
  for (const scenario of scenarios) {
    try {
      const projected = toPipelineInput(scenario, {
        packId: packMeta.packId as string,
        packVersion: packMeta.packVersion as string,
      });
      const hits = collectForbiddenKeys(projected);
      if (hits.length) {
        errors.push(`${scenario.scenarioId}: forbidden keys ${hits.join(', ')}`);
      }
    } catch (err) {
      errors.push(`${scenario.scenarioId}: ${err instanceof Error ? err.message : 'projection error'}`);
    }
  }
  return { passed: errors.length === 0, errors, warnings: [] };
}

export function verifyRunCompleteness(
  pack: Record<string, unknown>,
  runResult: Record<string, unknown>,
  intendedScenarioIds?: string[],
): IntegrityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const packScenarios = pack.scenarios as Record<string, unknown>[];
  const intended =
    intendedScenarioIds ??
    packScenarios
      .filter((s) => s.status === 'released' || !intendedScenarioIds)
      .map((s) => s.scenarioId as string);
  const results = runResult.scenarios as Record<string, unknown>[];
  const resultIds = new Set(results.map((r) => r.scenarioId as string));
  for (const id of intended) {
    if (!resultIds.has(id)) {
      errors.push(`Missing terminal result for scenario ${id}`);
    }
  }
  for (const r of results) {
    if (!r.outcome) {
      errors.push(`Scenario ${r.scenarioId} missing outcome`);
    }
    if (r.outcome === 'infrastructure_error') {
      warnings.push(`Infrastructure error on ${r.scenarioId}`);
    }
  }
  return { passed: errors.length === 0, errors, warnings };
}

export function assertDesignatableReferenceBaseline(runResult: Record<string, unknown>): void {
  const run = runResult.run as Record<string, unknown>;
  if (run.dryRun) {
    throw new Error('Dry runs cannot receive reference_baseline_001 designation');
  }
  if (run.runType === 'dry_run') {
    throw new Error('Dry run type cannot be designated as reference baseline');
  }
  if (run.lifecycleState !== 'completed') {
    throw new Error('Only completed runs may be designated');
  }
}
