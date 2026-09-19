/**
 * G4 official frozen benchmark matrix — pre-flight, execution, post-verify.
 * Does not designate reference_baseline_001 (G5 only).
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
const EVIDENCE_DIR = join(pocRoot, 'experiments/baseline-evidence/g4-official-runs');
const RUNS_DIR = join(pocRoot, 'experiments/runs');

const MATRIX = [
  {
    officialRunId: 'RUN-REF-CLEAN-ANCHOR-001',
    packRel: 'benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json',
    packId: 'CKES-BENCHMARK-ANCHOR-001',
  },
  {
    officialRunId: 'RUN-REF-CLEAN-STAT-001',
    packRel: 'benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json',
    packId: 'CKES-BENCHMARK-STATISTICAL-001',
  },
  {
    officialRunId: 'RUN-REF-CLEAN-CHALLENGE-001',
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

interface PreFlight {
  passed: boolean;
  errors: string[];
  anchors: Record<string, string>;
}

async function preFlight(): Promise<PreFlight> {
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
      errors.push(`Pack hash mismatch ${entry.packId}: manifest=${entry.contentHash} declared=${declared} computed=${computed}`);
    }
  }

  const profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) as Record<string, unknown>;
  validateBenchmarkRunProfile(profile);
  if (profile.dryRun !== false) errors.push('REF-CLEAN profile dryRun must be false');
  const profileHash = computeProfileContentHash(profile);
  const scorerHash = computeScorerContentHash();
  const expectedScorer = (profile.anchors as { scorerVersion?: string })?.scorerVersion;
  if (expectedScorer && expectedScorer !== SCORER_VERSION) {
    errors.push(`Scorer version mismatch profile=${expectedScorer} runtime=${SCORER_VERSION}`);
  }

  const commit = gitRev();
  const harnessPkg = JSON.parse(
    readFileSync(join(pocRoot, 'packages/harness/package.json'), 'utf8'),
  ) as { version: string };
  const pipelinePkg = JSON.parse(
    readFileSync(join(pocRoot, 'packages/pipeline/package.json'), 'utf8'),
  ) as { version: string };

  for (const row of MATRIX) {
    const packPath = join(pocRoot, row.packRel);
    const pack = JSON.parse(readFileSync(packPath, 'utf8')) as Record<string, unknown>;
    const leak = verifyScenarioLeakage(pack);
    if (!leak.passed) errors.push(`Leakage ${row.packId}: ${leak.errors.join('; ')}`);
  }

  const evalModule = join(pocRoot, 'packages/pipeline/src/evaluation-identity.ts');
  if (!existsSync(evalModule)) {
    errors.push('G3.1 evaluation-identity module missing');
  }

  return {
    passed: errors.length === 0,
    errors,
    anchors: {
      gitCommit: commit,
      profileId: profile.profileId as string,
      profileContentHash: profileHash,
      scorerVersion: SCORER_VERSION,
      scorerContentHash: scorerHash,
      harnessPackageVersion: harnessPkg.version,
      pipelinePackageVersion: pipelinePkg.version,
      profilePath: PROFILE_PATH,
    },
  };
}

function analyzeEvaluationCapture(runResult: Record<string, unknown>): {
  byStatus: Record<string, number>;
  presentUnmapped: Array<{ scenarioId: string; capture: unknown }>;
  falseMergeScenarioIds: string[];
} {
  const scenarios = runResult.scenarios as Record<string, unknown>[];
  const byStatus: Record<string, number> = {};
  const presentUnmapped: Array<{ scenarioId: string; capture: unknown }> = [];
  const mustNotMatchViolations: string[] = [];
  for (const s of scenarios) {
    const cap = s.evaluationCapture as Record<string, unknown> | undefined;
    const status = (cap?.identityEvidenceStatus as string) ?? 'missing_capture';
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (status === 'present_unmapped') {
      presentUnmapped.push({ scenarioId: s.scenarioId as string, capture: cap });
    }
    if (s.failureClassification === 'false_merge') {
      mustNotMatchViolations.push(s.scenarioId as string);
    }
  }
  return { byStatus, presentUnmapped, mustNotMatchViolations };
}

function trialCompliance(runResult: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const run = runResult.run as Record<string, unknown>;
  const policy = run.trialPolicySnapshot as Record<string, unknown> | undefined;
  if (!policy) {
    errors.push('Missing trialPolicySnapshot on run');
    return errors;
  }
  for (const s of runResult.scenarios as Record<string, unknown>[]) {
    const requested = s.trialsRequested as number | undefined;
    const completed = s.trialsCompleted as number | undefined;
    if (requested == null || completed == null) {
      if (s.outcome !== 'infrastructure_error' && s.outcome !== 'not_evaluated') {
        errors.push(`${s.scenarioId}: missing trialsRequested/trialsCompleted`);
      }
      continue;
    }
    if (completed < requested && s.outcome !== 'not_evaluated') {
      errors.push(`${s.scenarioId}: incomplete trials ${completed}/${requested}`);
    }
  }
  if (run.lifecycleState === 'completed_partial') {
    errors.push('Run lifecycle completed_partial');
  }
  return errors;
}

async function main(): Promise<void> {
  const dryOnly = process.argv.includes('--preflight-only');
  const pf = await preFlight();
  const preflightPath = join(EVIDENCE_DIR, 'G4-PRE-FLIGHT.json');
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(preflightPath, JSON.stringify(pf, null, 2));
  console.log('Pre-flight:', pf.passed ? 'PASS' : 'FAIL', preflightPath);
  if (!pf.passed) {
    console.error(pf.errors.join('\n'));
    process.exit(1);
  }
  if (dryOnly) return;

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
      const releasedCount = packScenarios.filter(
        (s) => (s.status as string | undefined) !== 'draft',
      ).length;

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

      const completeness = verifyRunCompleteness(pack, runResult);
      const trialErrors = trialCompliance(runResult);
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

      let baselineGateProbe: string | undefined;
      try {
        if (row.officialRunId === 'RUN-REF-CLEAN-ANCHOR-001') {
          assertDesignatableReferenceBaseline(runResult);
        }
        baselineGateProbe = 'assertDesignatableReferenceBaseline: ok (designation not performed)';
      } catch (e) {
        baselineGateProbe = e instanceof Error ? e.message : 'baseline gate failed';
      }

      const postErrors = [
        ...completeness.errors,
        ...trialErrors,
        ...(runResult.run as Record<string, unknown>).dryRun ? ['dryRun true'] : [],
      ];
      if ((runResult.run as Record<string, unknown>).packContentHash !== computePackContentHash(pack)) {
        postErrors.push('packContentHash mismatch in result');
      }

      executionLog.push({
        officialRunId: row.officialRunId,
        runId,
        packId: row.packId,
        releasedScenarios: releasedCount,
        scenarioResults: (runResult.scenarios as unknown[]).length,
        resultPath: officialPath,
        resultContentHash: resultHash,
        lifecycleState: (runResult.run as Record<string, unknown>).lifecycleState,
        postVerificationPassed: postErrors.length === 0 && completeness.passed,
        postErrors,
        completenessWarnings: completeness.warnings,
        evaluationCapture: evalSummary,
        aggregates: runResult.aggregates,
        derivedFalseMerge: derived.falseMergeSafety,
        baselineGateProbe,
      });
      console.log(`Completed ${row.officialRunId} hash=${resultHash.slice(0, 16)}…`);
    }
  } finally {
    await pool.end();
  }

  const summaryPath = join(EVIDENCE_DIR, 'G4-EXECUTION-SUMMARY.json');
  writeFileSync(
    summaryPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), preFlight: pf.anchors, runs: executionLog }, null, 2),
  );
  console.log('Wrote', summaryPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
