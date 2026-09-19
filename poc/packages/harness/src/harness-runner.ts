import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import {
  aggregateTrialScores,
  computeProfileContentHash,
  renderBenchmarkRunResultMarkdown,
  resolveTrialCount,
  scoreScenario,
  SCORER_VERSION,
  toPipelineInput,
  validateBenchmarkPack,
  validateBenchmarkRunResult,
  type PipelineScenarioInput,
  type TrialPolicy,
} from '@ckes/benchmark';
import { runDecisionSlice, runFullPipelineSlice } from '@ckes/pipeline';
import { writeFileAtomic } from './atomic-write.js';
import { ensureDir } from './paths.js';
import { resetHarnessSandbox, HARNESS_CONCURRENCY_MAX } from './isolation.js';
import { loadPackSeedMaterial } from './pack-seeds.js';
import { buildScenarioEvaluationCapture, matchedSeedIdForScoring } from './evaluation-capture.js';
import type { RunLifecycleState } from './run-state.js';
import { isTerminalState } from './run-state.js';

export interface HarnessRunOptions {
  packPath: string;
  pack: Record<string, unknown>;
  runsDir: string;
  pool: Pool;
  scenarioIds?: string[];
  concurrency?: number;
  costCeilingUsd?: number;
  pricingSnapshotId?: string;
  openaiKey?: string;
  openaiModel?: string;
  deterministicAi?: boolean;
  gitCommit?: string;
  databaseProfile?: 'clean' | 'warm';
  retrievalMode?: string;
  runProfile?: Record<string, unknown>;
  dryRun?: boolean;
}

export interface RunEvent {
  id: number;
  type: string;
  runId: string;
  scenarioId?: string;
  message?: string;
  state?: RunLifecycleState;
}

export class HarnessRunner extends EventEmitter {
  private eventId = 0;

  private emitEvent(type: string, runId: string, extra: Partial<RunEvent> = {}): void {
    this.eventId += 1;
    const evt: RunEvent = { id: this.eventId, type, runId, ...extra };
    this.emit('event', evt);
  }

  async startRun(options: HarnessRunOptions): Promise<{ runId: string; resultPath: string }> {
    if ((options.concurrency ?? 1) > HARNESS_CONCURRENCY_MAX) {
      throw new Error(`concurrency > ${HARNESS_CONCURRENCY_MAX} is disabled in Handover 2`);
    }
    validateBenchmarkPack(options.pack);
    const runId = randomUUID();
    const state: RunLifecycleState = 'queued';
    this.emitEvent('run_state', runId, { state });

    const packMeta = options.pack.pack as Record<string, unknown>;
    const profile = options.runProfile;
    const dryRun = options.dryRun ?? (profile?.dryRun as boolean) ?? false;
    const trialPolicy = profile?.trialPolicy as TrialPolicy | undefined;
    const profileId = profile?.profileId as string | undefined;
    let profileHash: string | undefined;
    if (profile) {
      profileHash = computeProfileContentHash(profile);
    }
    const dryIds = profile?.dryRunScenarioIds as string[] | undefined;
    let scenarios = (options.pack.scenarios as Record<string, unknown>[]).filter((s) =>
      options.scenarioIds?.length ? options.scenarioIds.includes(s.scenarioId as string) : true,
    );
    if (dryRun && dryIds?.length) {
      scenarios = scenarios.filter((s) => dryIds.includes(s.scenarioId as string));
    }

    let lifecycle: RunLifecycleState = 'preparing';
    this.emitEvent('run_state', runId, { state: lifecycle });
    await resetHarnessSandbox(options.pool);
    const seedMaterial = (options.pack.canonicalSeedMaterial ?? []) as Array<{
      seedId: string;
      label: string;
      statement?: string;
    }>;
    await loadPackSeedMaterial(options.pool, seedMaterial);
    const packSeedsForMapping = seedMaterial.map((s) => ({ seedId: s.seedId, label: s.label }));

    let totalCost = 0;
    let modelCalls = 0;
    let cancelled = false;
    let runFailedOnCeiling = false;
    const scenarioResults: Record<string, unknown>[] = [];
    lifecycle = 'running';
    this.emitEvent('run_state', runId, { state: lifecycle });

    for (const scenario of scenarios) {
      if (cancelled) {
        scenarioResults.push({
          scenarioId: scenario.scenarioId,
          executionMode: scenario.executionMode,
          outcome: 'not_evaluated',
          explanation: 'Run cancelled before scenario started',
        });
        continue;
      }
      const scenarioId = scenario.scenarioId as string;
      this.emitEvent('scenario_started', runId, { scenarioId });
      await resetHarnessSandbox(options.pool);

      try {
        const projected = toPipelineInput(scenario, {
          packId: packMeta.packId as string,
          packVersion: packMeta.packVersion as string,
        });
        const ceiling =
          options.costCeilingUsd ??
          trialPolicy?.budgetUsdCeiling ??
          undefined;
        if (ceiling != null && totalCost >= ceiling) {
          lifecycle = 'cost_ceiling_reached';
          runFailedOnCeiling = trialPolicy?.onCeilingExhausted === 'fail_run';
          scenarioResults.push({
            scenarioId,
            executionMode: projected.executionMode,
            outcome: 'not_evaluated',
            explanation: 'Cost ceiling reached before dispatch',
            incompleteTrialReason: 'budget_ceiling',
          });
          if (runFailedOnCeiling) break;
          continue;
        }

        const trialsRequested = trialPolicy
          ? resolveTrialCount(trialPolicy, {
              executionMode: projected.executionMode,
              llmPolicy: scenario.llmPolicy as string | undefined,
            })
          : 1;
        const trialScores: ReturnType<typeof scoreScenario>[] = [];
        const trialRows: Record<string, unknown>[] = [];
        let trialsCompleted = 0;
        let lastSlice: Awaited<ReturnType<typeof runDecisionSlice>> | undefined;
        let scenarioEvaluationCapture: ReturnType<typeof buildScenarioEvaluationCapture> | undefined;

        for (let trialIndex = 0; trialIndex < trialsRequested; trialIndex += 1) {
          if (trialPolicy?.modelCallLimit != null && modelCalls >= trialPolicy.modelCallLimit) {
            if (trialPolicy.onCeilingExhausted === 'fail_run') {
              runFailedOnCeiling = true;
              break;
            }
            break;
          }
          const sliceResult =
            projected.executionMode === 'full_pipeline'
              ? await runFullPipelineSlice(options.pool, projected, {
                  openaiKey: options.openaiKey,
                  openaiModel: options.openaiModel,
                  deterministicAi: options.deterministicAi ?? true,
                  retrievalMode: options.retrievalMode ?? (profile?.retrievalMode as string),
                })
              : await runDecisionSlice(options.pool, projected, {
                  openaiKey: options.openaiKey,
                  openaiModel: options.openaiModel,
                  deterministicAi: options.deterministicAi ?? true,
                  retrievalMode: options.retrievalMode ?? (profile?.retrievalMode as string),
                });
          lastSlice = sliceResult;
          if (sliceResult.usedAi) modelCalls += 1;
          totalCost += sliceResult.aiCostUsd;
          trialsCompleted += 1;
          const expectations = {
            expectedDecisionClass: scenario.expectedDecisionClass as string,
            expectedIdentity: scenario.expectedIdentity as
              | import('@ckes/benchmark').ScenarioExpectations['expectedIdentity']
              | undefined,
            mustNotMatchIdentities: scenario.mustNotMatchIdentities as
              | import('@ckes/benchmark').ScenarioExpectations['mustNotMatchIdentities']
              | undefined,
            acceptableAlternatives: scenario.acceptableAlternatives as
              | import('@ckes/benchmark').ScenarioExpectations['acceptableAlternatives']
              | undefined,
            labelConfidenceClass: scenario.labelConfidenceClass as string,
          };
          const evalRef = sliceResult.evaluationMatchedIdentityRef ?? {
            present: false,
            reason: 'no_merge_identity_in_decision' as const,
          };
          const evaluationCapture = buildScenarioEvaluationCapture(
            evalRef.present
              ? { present: true, canonicalLabel: evalRef.canonicalLabel }
              : { present: false, reason: evalRef.reason },
            packSeedsForMapping,
          );
          const score = scoreScenario(expectations, {
            adjudicationClass: sliceResult.adjudicationClass,
            policyAction: sliceResult.policyAction,
            matchedSeedId: matchedSeedIdForScoring(evaluationCapture),
          });
          scenarioEvaluationCapture = evaluationCapture;
          trialScores.push(score);
          trialRows.push({
            trialIndex,
            outcome: score.outcome,
            actualDecisionClass: sliceResult.adjudicationClass,
            economics: {
              currency: 'USD',
              costKind: sliceResult.usedAi ? 'estimated' : 'zero',
              amountUsd: sliceResult.aiCostUsd,
              pricingSnapshotId: options.pricingSnapshotId ?? 'harness-default',
              latencyMs: sliceResult.latencyMs,
              latencyUnit: 'ms',
            },
          });
        }

        if (runFailedOnCeiling) break;

        const agg =
          trialScores.length > 0
            ? aggregateTrialScores(trialScores, trialPolicy?.aggregation ?? 'worst_case_safety')
            : { outcome: 'not_evaluated' as const };
        const sliceResult = lastSlice;
        if (
          trialPolicy &&
          trialsCompleted < trialsRequested &&
          trialPolicy.incompleteTrialsInvalidate === 'run'
        ) {
          runFailedOnCeiling = true;
        }

        scenarioResults.push({
          scenarioId,
          executionMode: projected.executionMode,
          outcome: agg.outcome,
          failureClassification: agg.failureClassification,
          failureLayer: sliceResult?.failureLayer,
          actualDecisionClass: sliceResult?.adjudicationClass,
          explanation: sliceResult ? `policy=${sliceResult.policyAction}` : 'no trial completed',
          trialsRequested,
          trialsCompleted,
          trials: trialRows,
          economics: sliceResult
            ? {
                currency: 'USD',
                costKind: sliceResult.usedAi ? 'estimated' : 'zero',
                amountUsd: sliceResult.aiCostUsd,
                pricingSnapshotId: options.pricingSnapshotId ?? 'harness-default',
                latencyMs: sliceResult.latencyMs,
                latencyUnit: 'ms',
              }
            : undefined,
          scoring: {
            expectedDecisionClass: scenario.expectedDecisionClass,
            expectedVersusActual: {
              expected: scenario.expectedDecisionClass,
              actual: sliceResult?.adjudicationClass,
              policyAction: sliceResult?.policyAction,
            },
          },
          evaluationCapture: scenarioEvaluationCapture,
        });
        this.emitEvent('scenario_completed', runId, { scenarioId });
      } catch (err) {
        scenarioResults.push({
          scenarioId,
          executionMode: scenario.executionMode,
          outcome: 'infrastructure_error',
          explanation: err instanceof Error ? err.message : 'unknown error',
        });
      }
    }

    if (cancelled) lifecycle = 'cancelled';
    else if (lifecycle === 'cost_ceiling_reached' || runFailedOnCeiling) lifecycle = 'completed_partial';
    else lifecycle = 'completed';

    const result = {
      schemaVersion: '1.0.0',
      run: {
        runId,
        runType: dryRun ? 'qualification' : 'experiment',
        lifecycleState: lifecycle,
        packId: packMeta.packId,
        packVersion: packMeta.packVersion,
        packContentHash: packMeta.contentHash,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        databaseProfile:
          options.databaseProfile ?? (profile?.databaseProfile as 'clean' | 'warm') ?? 'clean',
        retrievalMode:
          options.retrievalMode ??
          (profile?.retrievalMode as string) ??
          'deterministic_fixture',
        executionMode: 'decision_slice',
        gitCommit: options.gitCommit ?? (profile?.anchors as Record<string, string>)?.gitCommit ?? 'unknown',
        dryRun,
        runProfileId: profileId,
        runProfileContentHash: profileHash,
        scorerVersion: SCORER_VERSION,
        trialPolicySnapshot: trialPolicy ?? undefined,
      },
      scenarios: scenarioResults,
      aggregates: {
        passCount: scenarioResults.filter((s) => s.outcome === 'pass').length,
        failCount: scenarioResults.filter((s) => s.outcome === 'fail').length,
        falseMergeCount: scenarioResults.filter((s) => s.failureClassification === 'false_merge')
          .length,
        byExecutionMode: scenarioResults.reduce(
          (acc, s) => {
            const m = s.executionMode as string;
            acc[m] = (acc[m] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    };

    validateBenchmarkRunResult(result as Record<string, unknown>);
    await ensureDir(options.runsDir);
    const resultPath = join(options.runsDir, `${runId}.json`);
    await writeFileAtomic(resultPath, JSON.stringify(result, null, 2));
    this.emitEvent('run_state', runId, { state: lifecycle });
    return { runId, resultPath };
  }

  requestCancel(runId: string): void {
    this.emitEvent('cancel_requested', runId, { state: 'cancel_requested' });
  }

  static async loadPack(path: string): Promise<Record<string, unknown>> {
    const raw = await readFile(path, 'utf8');
    const pack = JSON.parse(raw) as Record<string, unknown>;
    validateBenchmarkPack(pack);
    return pack;
  }

  static renderResultMd(result: Record<string, unknown>, artifactId: string): string {
    const run = result.run as Record<string, unknown>;
    return renderBenchmarkRunResultMarkdown(result, {
      sourceArtifactId: artifactId,
      schemaVersion: result.schemaVersion as string,
      contentVersion: run.packVersion as string,
      contentHash: run.packContentHash as string,
    });
  }
}

export type { PipelineScenarioInput };
