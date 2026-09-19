/**
 * G4.1 superseding clean runs after baseline-validity remediation.
 * Does not modify g4-official-runs/* historical evidence.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import pg from 'pg';
import {
  computePackContentHash,
  computeProfileContentHash,
  computeScorerContentHash,
  SCORER_VERSION,
  validateBenchmarkRunProfile,
  buildDerivedRunReport,
  renderDerivedReportMarkdown,
} from '@ckes/benchmark';
import {
  HarnessRunner,
  verifyScenarioLeakage,
  verifyRunCompleteness,
  assertDesignatableReferenceBaseline,
} from '@ckes/harness';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');

const G3_MANIFEST = join(pocRoot, 'benchmark/releases/G3-FREEZE-MANIFEST.json');
const PROFILE_PATH = join(pocRoot, 'experiments/run-profiles/CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001.json');
const EVIDENCE_DIR = join(pocRoot, 'experiments/baseline-evidence/g4-1-official-runs');
const RUNS_DIR = join(pocRoot, 'experiments/runs');
const EVAL_INFRA_REVISION = 'g4.1-baseline-validity-2026-09-19';

const FULL_PIPELINE_SMOKE_IDS = ['ANC-0017', 'ANC-0034', 'STA-0017', 'CHL-0017'];

const MATRIX = [
  {
    officialRunId: 'RUN-REF-CLEAN-ANCHOR-002',
    supersededRunId: 'RUN-REF-CLEAN-ANCHOR-001',
    packRel: 'benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json',
    packId: 'CKES-BENCHMARK-ANCHOR-001',
  },
  {
    officialRunId: 'RUN-REF-CLEAN-STAT-002',
    supersededRunId: 'RUN-REF-CLEAN-STAT-001',
    packRel: 'benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json',
    packId: 'CKES-BENCHMARK-STATISTICAL-001',
  },
  {
    officialRunId: 'RUN-REF-CLEAN-CHALLENGE-002',
    supersededRunId: 'RUN-REF-CLEAN-CHALLENGE-001',
    packRel: 'benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.json',
    packId: 'CKES-BENCHMARK-CHALLENGE-001',
  },
] as const;

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function gitRev(): string {
  return execSync('git rev-parse HEAD', { cwd: join(pocRoot, '..'), encoding: 'utf8' }).trim();
}

async function preFlight(): Promise<{ passed: boolean; errors: string[]; anchors: Record<string, string> }> {
  const errors: string[] = [];
  const manifest = JSON.parse(readFileSync(G3_MANIFEST, 'utf8')) as {
    packs: { packId: string; contentHash: string; jsonPath: string }[];
  };
  for (const entry of manifest.packs) {
    const packPath = join(pocRoot, entry.jsonPath);
    const pack = JSON.parse(readFileSync(packPath, 'utf8')) as Record<string, unknown>;
    const declared = (pack.pack as { contentHash: string }).contentHash;
    const computed = computePackContentHash(pack);
    if (declared !== entry.contentHash || computed !== entry.contentHash) {
      errors.push(`Pack hash mismatch ${entry.packId}`);
    }
  }
  const profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) as Record<string, unknown>;
  validateBenchmarkRunProfile(profile);
  if (profile.dryRun !== false) errors.push('dryRun must be false');
  const projection = join(pocRoot, 'packages/benchmark/src/projection.ts');
  if (!readFileSync(projection, 'utf8').includes('deriveSourceTextForFullPipeline')) {
    errors.push('G4.1 full_pipeline projection fix missing');
  }
  return {
    passed: errors.length === 0,
    errors,
    anchors: {
      gitCommit: gitRev(),
      profileContentHash: computeProfileContentHash(profile),
      scorerVersion: SCORER_VERSION,
      scorerContentHash: computeScorerContentHash(),
      evaluationInfrastructureRevision: EVAL_INFRA_REVISION,
    },
  };
}

function analyzeEvaluationCapture(runResult: Record<string, unknown>) {
  const scenarios = runResult.scenarios as Record<string, unknown>[];
  const byStatus: Record<string, number> = {};
  const presentUnmapped: Array<{ scenarioId: string; capture: unknown }> = [];
  let infra = 0;
  for (const s of scenarios) {
    if (s.outcome === 'infrastructure_error') infra += 1;
    const cap = s.evaluationCapture as Record<string, unknown> | undefined;
    const status = (cap?.identityEvidenceStatus as string) ?? 'missing_capture';
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (status === 'present_unmapped') {
      presentUnmapped.push({ scenarioId: s.scenarioId as string, capture: cap });
    }
  }
  return { byStatus, presentUnmapped, infrastructureErrorCount: infra };
}

async function main(): Promise<void> {
  const pf = await preFlight();
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(join(EVIDENCE_DIR, 'G41-PRE-FLIGHT.json'), JSON.stringify(pf, null, 2));
  if (!pf.passed) {
    console.error(pf.errors);
    process.exit(1);
  }
  if (process.argv.includes('--preflight-only')) return;

  const profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) as Record<string, unknown>;
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://ckes:ckes_dev@localhost:5433/ckes_poc',
  });
  const executionLog: Record<string, unknown>[] = [];

  try {
    for (const row of MATRIX) {
      const packPath = join(pocRoot, row.packRel);
      const pack = await HarnessRunner.loadPack(packPath);
      const packScenarios = pack.scenarios as Record<string, unknown>[];
      const runner = new HarnessRunner();
      const { runId, resultPath } = await runner.startRun({
        packPath,
        pack,
        runsDir: RUNS_DIR,
        pool,
        concurrency: 1,
        runProfile: profile,
        dryRun: false,
        runId: row.officialRunId,
        gitCommit: pf.anchors.gitCommit,
        databaseProfile: 'clean',
        retrievalMode: profile.retrievalMode as string,
        deterministicAi: profile.deterministicAi as boolean,
      });

      const officialPath = join(EVIDENCE_DIR, `${row.officialRunId}.json`);
      const raw = await readFile(resultPath, 'utf8');
      writeFileSync(officialPath, raw);
      const runResult = JSON.parse(raw) as Record<string, unknown>;
      const resultHash = sha256File(officialPath);
      const evalSummary = analyzeEvaluationCapture(runResult);
      const derived = buildDerivedRunReport({
        runResult,
        packScenarios,
        sourceRunResultPath: officialPath,
        sourceRunResultHash: resultHash,
      });
      writeFileSync(
        join(EVIDENCE_DIR, `${row.officialRunId}.derived-report.json`),
        JSON.stringify(derived, null, 2),
      );
      writeFileSync(
        join(EVIDENCE_DIR, `${row.officialRunId}.derived-report.md`),
        renderDerivedReportMarkdown(derived),
      );

      const fpSmoke = FULL_PIPELINE_SMOKE_IDS.map((id) => {
        const s = (runResult.scenarios as Record<string, unknown>[]).find((x) => x.scenarioId === id);
        return { id, outcome: s?.outcome, explanation: s?.explanation };
      });

      let baselineStructural = 'n/a';
      if (row.officialRunId === 'RUN-REF-CLEAN-ANCHOR-002') {
        try {
          assertDesignatableReferenceBaseline(runResult);
          baselineStructural = 'structural assertDesignatableReferenceBaseline: ok';
        } catch (e) {
          baselineStructural = e instanceof Error ? e.message : 'failed';
        }
      }

      executionLog.push({
        officialRunId: row.officialRunId,
        supersededRunId: row.supersededRunId,
        resultContentHash: resultHash,
        evaluationCapture: evalSummary,
        fullPipelineSmoke: fpSmoke,
        derivedFalseMerge: derived.falseMergeSafety,
        aggregates: runResult.aggregates,
        baselineStructural,
        postVerificationPassed:
          evalSummary.infrastructureErrorCount === 0 &&
          verifyRunCompleteness(pack, runResult).passed,
      });
      console.log(`Completed ${row.officialRunId}`);
    }
  } finally {
    await pool.end();
  }

  writeFileSync(
    join(EVIDENCE_DIR, 'G41-EXECUTION-SUMMARY.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        preFlight: pf.anchors,
        supersededHistoricalRunsPreservedUnder: 'experiments/baseline-evidence/g4-official-runs',
        runs: executionLog,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
