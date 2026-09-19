import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { collectForbiddenKeys } from './forbidden-keys.js';
import { toPipelineInput } from './projection.js';
import { SUITE_CLASSES } from './enums.js';
import { validateBenchmarkPack } from './validate.js';

export const POC_MIN_RELEASED_SCENARIOS: Record<(typeof SUITE_CLASSES)[number], number> = {
  anchor: 40,
  statistical: 200,
  challenge: 80,
};

export interface QualifyPackOptions {
  packPath?: string;
  provenancePath?: string;
  mode?: 'import' | 'freeze';
  packRoot?: string;
}

export interface QualifyIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  scenarioId?: string;
}

export interface QualifyPackResult {
  packId: string;
  packVersion: string;
  suiteClass: string;
  packStatus: string;
  counts: {
    scenariosTotal: number;
    released: number;
    reviewed: number;
    draft: number;
    retired: number;
    disputed: number;
  };
  issues: QualifyIssue[];
  passed: boolean;
  freezeReady: boolean;
}

const UNRESOLVED_LABELS = new Set(['human_review_required', 'research_unresolved']);

export function qualifyBenchmarkPack(
  pack: Record<string, unknown>,
  options: QualifyPackOptions = {},
): QualifyPackResult {
  const issues: QualifyIssue[] = [];
  try {
    validateBenchmarkPack(pack);
  } catch (err) {
    issues.push({
      severity: 'error',
      code: 'schema_invalid',
      message: err instanceof Error ? err.message : 'validate failed',
    });
    return emptyResult(pack, issues);
  }

  const packMeta = pack.pack as Record<string, unknown>;
  const packId = packMeta.packId as string;
  const packVersion = packMeta.packVersion as string;
  const suiteClass = packMeta.suiteClass as string;
  const packStatus = packMeta.status as string;
  const scenarios = pack.scenarios as Record<string, unknown>[];

  const counts = {
    scenariosTotal: scenarios.length,
    released: 0,
    reviewed: 0,
    draft: 0,
    retired: 0,
    disputed: 0,
  };

  const scenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    const id = scenario.scenarioId as string;
    if (scenarioIds.has(id)) {
      issues.push({ severity: 'error', code: 'duplicate_scenario_id', message: `Duplicate ${id}`, scenarioId: id });
    }
    scenarioIds.add(id);

    const st = scenario.status as string;
    if (st === 'released') counts.released++;
    else if (st === 'reviewed') counts.reviewed++;
    else if (st === 'draft') counts.draft++;
    else if (st === 'retired') counts.retired++;

    const labelClass = scenario.labelConfidenceClass as string;
    if (UNRESOLVED_LABELS.has(labelClass)) {
      counts.disputed++;
      if (st === 'released' || packStatus === 'released') {
        issues.push({
          severity: 'error',
          code: 'disputed_released',
          message: `Unresolved label ${labelClass} on scenario with status ${st}`,
          scenarioId: id,
        });
      }
    }

    if (packStatus === 'released' && st !== 'released' && st !== 'retired') {
      issues.push({
        severity: 'error',
        code: 'pack_release_inconsistent',
        message: `Released pack contains scenario ${id} with status ${st}`,
        scenarioId: id,
      });
    }

    try {
      const projected = toPipelineInput(scenario, {
        packId,
        packVersion,
      });
      const forbidden = collectForbiddenKeys(projected);
      if (forbidden.length > 0) {
        issues.push({
          severity: 'error',
          code: 'leakage_projection',
          message: `Forbidden keys in pipeline projection: ${forbidden.join(', ')}`,
          scenarioId: id,
        });
      }
    } catch (err) {
      issues.push({
        severity: 'error',
        code: 'projection_failed',
        message: err instanceof Error ? err.message : 'projection failed',
        scenarioId: id,
      });
    }

    const severity = scenario.failureSeverity as string | undefined;
    const transform = scenario.transformationType as string | undefined;
    if (
      transform === 'adversarial_false_merge_candidate' &&
      !(scenario.mustNotMatchIdentities as unknown[])?.length
    ) {
      issues.push({
        severity: 'warning',
        code: 'false_merge_trap_incomplete',
        message: 'Adversarial false-merge scenario should declare mustNotMatchIdentities',
        scenarioId: id,
      });
    }
    if ((severity === 'critical' || severity === 'high') && packStatus === 'released' && st === 'released') {
      if (!options.provenancePath || !existsSync(options.provenancePath)) {
        issues.push({
          severity: 'warning',
          code: 'provenance_missing',
          message: 'High-severity released scenario without provenance file path supplied',
          scenarioId: id,
        });
      }
    }
  }

  if (options.mode === 'freeze' && packStatus === 'released') {
    const min = POC_MIN_RELEASED_SCENARIOS[suiteClass as keyof typeof POC_MIN_RELEASED_SCENARIOS];
    if (min != null && counts.released < min) {
      issues.push({
        severity: 'error',
        code: 'below_poc_minimum',
        message: `Released count ${counts.released} below POC minimum ${min} for ${suiteClass}`,
      });
    }
    if (options.provenancePath && !existsSync(options.provenancePath)) {
      issues.push({
        severity: 'error',
        code: 'provenance_required',
        message: `Provenance file missing: ${options.provenancePath}`,
      });
    } else if (options.packRoot && packId) {
      const defaultProv = join(options.packRoot, 'benchmark/generation', packId, 'provenance.json');
      if (!existsSync(defaultProv)) {
        issues.push({
          severity: 'error',
          code: 'provenance_required',
          message: `Provenance missing at ${defaultProv}`,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  return {
    packId,
    packVersion,
    suiteClass,
    packStatus,
    counts,
    issues,
    passed: errors.length === 0,
    freezeReady: errors.length === 0 && options.mode === 'freeze' && packStatus === 'released',
  };
}

function emptyResult(pack: Record<string, unknown>, issues: QualifyIssue[]): QualifyPackResult {
  const packMeta = (pack.pack ?? {}) as Record<string, unknown>;
  return {
    packId: (packMeta.packId as string) ?? 'unknown',
    packVersion: (packMeta.packVersion as string) ?? 'unknown',
    suiteClass: (packMeta.suiteClass as string) ?? 'unknown',
    packStatus: (packMeta.status as string) ?? 'draft',
    counts: {
      scenariosTotal: 0,
      released: 0,
      reviewed: 0,
      draft: 0,
      retired: 0,
      disputed: 0,
    },
    issues,
    passed: false,
    freezeReady: false,
  };
}

export function loadProvenance(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}
