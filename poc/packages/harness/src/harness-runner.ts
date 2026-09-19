import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import {
  renderBenchmarkRunResultMarkdown,
  scoreScenario,
  toPipelineInput,
  validateBenchmarkPack,
  validateBenchmarkRunResult,
  type PipelineScenarioInput,
} from '@ckes/benchmark';
import { runDecisionSlice, runFullPipelineSlice } from '@ckes/pipeline';
import { writeFileAtomic } from './atomic-write.js';
import { ensureDir } from './paths.js';
import { resetHarnessSandbox, HARNESS_CONCURRENCY_MAX } from './isolation.js';
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
    const scenarios = (options.pack.scenarios as Record<string, unknown>[]).filter((s) =>
      options.scenarioIds?.length ? options.scenarioIds.includes(s.scenarioId as string) : true,
    );

    let lifecycle: RunLifecycleState = 'preparing';
    this.emitEvent('run_state', runId, { state: lifecycle });
    await resetHarnessSandbox(options.pool);

    let totalCost = 0;
    let cancelled = false;
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
        if (options.costCeilingUsd != null && totalCost >= options.costCeilingUsd) {
          lifecycle = 'cost_ceiling_reached';
          scenarioResults.push({
            scenarioId,
            executionMode: projected.executionMode,
            outcome: 'not_evaluated',
            explanation: 'Cost ceiling reached before dispatch',
          });
          break;
        }

        const sliceResult =
          projected.executionMode === 'full_pipeline'
            ? await runFullPipelineSlice(options.pool, projected, {
                openaiKey: options.openaiKey,
                openaiModel: options.openaiModel,
                deterministicAi: options.deterministicAi ?? true,
                retrievalMode: options.retrievalMode,
              })
            : await runDecisionSlice(options.pool, projected, {
                openaiKey: options.openaiKey,
                openaiModel: options.openaiModel,
                deterministicAi: options.deterministicAi ?? true,
                retrievalMode: options.retrievalMode,
              });

        totalCost += sliceResult.aiCostUsd;
        const score = scoreScenario(
          { expectedDecisionClass: scenario.expectedDecisionClass as string },
          {
            adjudicationClass: sliceResult.adjudicationClass,
            policyAction: sliceResult.policyAction,
          },
        );

        scenarioResults.push({
          scenarioId,
          executionMode: projected.executionMode,
          outcome: score.outcome,
          failureClassification: score.failureClassification,
          failureLayer: sliceResult.failureLayer,
          actualDecisionClass: sliceResult.adjudicationClass,
          explanation: `policy=${sliceResult.policyAction}`,
          economics: {
            currency: 'USD',
            costKind: sliceResult.usedAi ? 'estimated' : 'zero',
            amountUsd: sliceResult.aiCostUsd,
            pricingSnapshotId: options.pricingSnapshotId ?? 'harness-default',
            latencyMs: sliceResult.latencyMs,
            latencyUnit: 'ms',
          },
          scoring: {
            expectedDecisionClass: scenario.expectedDecisionClass,
            expectedVersusActual: {
              expected: scenario.expectedDecisionClass,
              actual: sliceResult.adjudicationClass,
              policyAction: sliceResult.policyAction,
            },
          },
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
    else if (lifecycle === 'cost_ceiling_reached') lifecycle = 'completed_partial';
    else lifecycle = 'completed';

    const result = {
      schemaVersion: '1.0.0',
      run: {
        runId,
        runType: 'experiment',
        lifecycleState: lifecycle,
        packId: packMeta.packId,
        packVersion: packMeta.packVersion,
        packContentHash: packMeta.contentHash,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        databaseProfile: options.databaseProfile ?? 'clean',
        retrievalMode: options.retrievalMode ?? 'deterministic_fixture',
        executionMode: 'decision_slice',
        gitCommit: options.gitCommit ?? 'unknown',
        lifecycleState: lifecycle,
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
