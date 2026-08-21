import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { computeGrowthMetrics, emptyMetrics } from '../packages/metrics/src/index.js';
import type { CorpusManifest } from '../packages/corpus/src/manifest.js';
import { generateCorpusForStage } from '../packages/corpus/src/generator.js';
import { runLifecycleSimulation } from '../packages/corpus/src/lifecycle.js';
import { evaluateGroundTruth } from '../packages/corpus/src/ground-truth.js';
import { runPipeline } from '../packages/pipeline/src/runner.js';
import { getPool, runMigrations } from './db-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stages = ['seed', 'poc1', 'poc2', 'poc3'] as const;

async function main(): Promise<void> {
  const pool = getPool();
  const manifestPath = join(__dirname, '../experiments/manifests/CALS-POC-001.yaml');
  const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as CorpusManifest;
  const resultsDir = join(__dirname, '../experiments/results', new Date().toISOString().slice(0, 10));
  mkdirSync(resultsDir, { recursive: true });

  const summary: Record<string, unknown>[] = [];

  for (const stage of stages) {
    console.log(`\n=== Stage: ${stage} ===`);
    const recipeCount = await generateCorpusForStage(pool, manifest, stage);
    if (stage === 'seed') {
      await runLifecycleSimulation(pool, manifest);
    }

    const deterministic = process.env.CKES_DETERMINISTIC_AI === 'true' || !process.env.OPENAI_API_KEY;
    let totalMetrics = emptyMetrics(stage);
    let lastReport = '';
    let drainRuns = 0;
    while (drainRuns < 100) {
      const { metrics, report } = await runPipeline(pool, {
        corpusStage: stage,
        openaiKey: process.env.OPENAI_API_KEY,
        openaiModel: process.env.OPENAI_MODEL,
        deterministicAi: deterministic,
      });
      lastReport = report;
      totalMetrics.inputChanges += metrics.inputChanges;
      totalMetrics.analyzed += metrics.analyzed;
      totalMetrics.mappedToExisting += metrics.mappedToExisting;
      totalMetrics.deferred += metrics.deferred;
      totalMetrics.newConceptsProposed += metrics.newConceptsProposed;
      totalMetrics.newKnowledgeObjects += metrics.newKnowledgeObjects;
      totalMetrics.automaticallyAdmitted += metrics.automaticallyAdmitted;
      totalMetrics.aiCostUsd += metrics.aiCostUsd;
      totalMetrics.processingTimeMs += metrics.processingTimeMs;
      drainRuns++;
      if (metrics.inputChanges === 0 || metrics.analyzed === 0) break;
    }

    const gt = await evaluateGroundTruth(pool, manifest.corpus);
    const growth = computeGrowthMetrics(stage, recipeCount, totalMetrics, 0, 0, 0);

    const stageResult = { metrics: totalMetrics, growth, groundTruth: gt, report: lastReport };
    summary.push({ stage, ...stageResult });
    writeFileSync(join(resultsDir, `${stage}-report.json`), JSON.stringify(stageResult, null, 2));
    console.log(lastReport);
    console.log(`Ground truth precision: ${(gt.precision * 100).toFixed(1)}%`);
    console.log(`New concepts/1000 items: ${growth.newConceptsPer1000.toFixed(2)}`);
    console.log(`AI cost/source item: $${growth.aiCostPerSourceItem.toFixed(6)}`);
  }

  writeFileSync(join(resultsDir, 'progressive-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nResults written to ${resultsDir}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
