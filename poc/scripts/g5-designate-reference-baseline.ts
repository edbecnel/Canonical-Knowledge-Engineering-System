/**
 * G5: designate reference_baseline_001 → RUN-REF-CLEAN-ANCHOR-002 (architect authorized).
 * Does not mutate run-result JSON or frozen packs.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computePackContentHash,
  computeScorerContentHash,
  SCORER_VERSION,
  validateBenchmarkPack,
} from '@ckes/benchmark';
import {
  assertDesignatableReferenceBaseline,
  designateReference,
  verifyRunCompleteness,
  verifyScenarioLeakage,
  writeFileAtomic,
} from '@ckes/harness';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const repoRoot = join(pocRoot, '..');

const RUN_ID = 'RUN-REF-CLEAN-ANCHOR-002';
const RUN_RESULT_PATH = join(
  pocRoot,
  'experiments/baseline-evidence/g4-1-official-runs',
  `${RUN_ID}.json`,
);
const PACK_PATH = join(pocRoot, 'benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json');
const G3_MANIFEST = join(pocRoot, 'benchmark/releases/G3-FREEZE-MANIFEST.json');
const DESIGNATIONS_DIR = join(pocRoot, 'experiments/reference-designations');
const PREDECESSOR_RUN_ID = 'RUN-REF-CLEAN-ANCHOR-001';
const PREDECESSOR_HASH =
  '7e10d14d39fe768c1e80d142e59b0c371d346df32db1c25b3e8225e80532524b';
const EVAL_INFRA_REVISION = 'g4.1-baseline-validity-2026-09-19';
const ARCHITECT_AUTH = 'G5 authorized 2026-09-19 — Handover 03 architect review';

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function analyzeRun(runResult: Record<string, unknown>): {
  infra: number;
  presentUnmapped: string[];
  trialsIncomplete: string[];
} {
  const scenarios = runResult.scenarios as Record<string, unknown>[];
  let infra = 0;
  const presentUnmapped: string[] = [];
  const trialsIncomplete: string[] = [];
  for (const s of scenarios) {
    if (s.outcome === 'infrastructure_error') infra += 1;
    const cap = s.evaluationCapture as Record<string, unknown> | undefined;
    if (cap?.identityEvidenceStatus === 'present_unmapped') {
      presentUnmapped.push(s.scenarioId as string);
    }
    const req = s.trialsRequested as number | undefined;
    const done = s.trialsCompleted as number | undefined;
    if (
      s.outcome !== 'infrastructure_error' &&
      s.outcome !== 'not_evaluated' &&
      req != null &&
      done != null &&
      done < req
    ) {
      trialsIncomplete.push(s.scenarioId as string);
    }
  }
  return { infra, presentUnmapped, trialsIncomplete };
}

async function main(): Promise<void> {
  const errors: string[] = [];
  const runResultRaw = readFileSync(RUN_RESULT_PATH);
  const runResultHash = createHash('sha256').update(runResultRaw).digest('hex');
  const runResult = JSON.parse(runResultRaw.toString('utf8')) as Record<string, unknown>;
  const run = runResult.run as Record<string, unknown>;

  if (run.runId !== RUN_ID) errors.push(`runId mismatch: ${run.runId}`);
  if (run.dryRun !== false) errors.push('dryRun must be false');
  if (run.lifecycleState !== 'completed') errors.push('lifecycle must be completed');

  const packRaw = readFileSync(PACK_PATH, 'utf8');
  const pack = JSON.parse(packRaw) as Record<string, unknown>;
  validateBenchmarkPack(pack);
  const packMeta = pack.pack as Record<string, unknown>;
  const expectedAnchorHash = '2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c';
  const manifest = JSON.parse(readFileSync(G3_MANIFEST, 'utf8')) as {
    packs: { packId: string; contentHash: string }[];
  };
  const anchorEntry = manifest.packs.find((p) => p.packId === 'CKES-BENCHMARK-ANCHOR-001');
  if (!anchorEntry || anchorEntry.contentHash !== expectedAnchorHash) {
    errors.push('G3 manifest anchor hash mismatch');
  }
  if (run.packContentHash !== expectedAnchorHash) errors.push('run packContentHash mismatch');
  if (computePackContentHash(pack) !== expectedAnchorHash) errors.push('pack file hash mismatch');
  if (run.packId !== packMeta.packId || run.packVersion !== packMeta.packVersion) {
    errors.push('pack id/version mismatch');
  }
  if (run.runProfileId !== 'CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001') {
    errors.push('unexpected run profile id');
  }
  if (run.scorerVersion !== SCORER_VERSION) errors.push('scorer version mismatch');

  const leakage = verifyScenarioLeakage(pack);
  if (!leakage.passed) errors.push(`leakage: ${leakage.errors.join('; ')}`);

  const completeness = verifyRunCompleteness(pack, runResult);
  if (!completeness.passed) errors.push(`completeness: ${completeness.errors.join('; ')}`);

  const released = (pack.scenarios as Record<string, unknown>[]).filter(
    (s) => s.status !== 'draft',
  ).length;
  if (released !== 40 || (runResult.scenarios as unknown[]).length !== 40) {
    errors.push(`scenario count expected 40, got ${(runResult.scenarios as unknown[]).length}`);
  }

  const analysis = analyzeRun(runResult);
  if (analysis.infra > 0) errors.push(`infrastructure errors: ${analysis.infra}`);
  if (analysis.presentUnmapped.length > 0) {
    errors.push(`present_unmapped: ${analysis.presentUnmapped.join(', ')}`);
  }
  if (analysis.trialsIncomplete.length > 0) {
    errors.push(`incomplete trials: ${analysis.trialsIncomplete.join(', ')}`);
  }

  try {
    assertDesignatableReferenceBaseline(runResult);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'assertDesignatableReferenceBaseline failed');
  }

  if (errors.length > 0) {
    console.error('G5 pre-designation verification FAILED:\n', errors.join('\n'));
    process.exit(1);
  }

  const harnessPkg = JSON.parse(
    readFileSync(join(pocRoot, 'packages/harness/package.json'), 'utf8'),
  ) as { version: string };
  const pipelinePkg = JSON.parse(
    readFileSync(join(pocRoot, 'packages/pipeline/package.json'), 'utf8'),
  ) as { version: string };

  const event = await designateReference({
    designationsDir: DESIGNATIONS_DIR,
    runId: RUN_ID,
    runResultHash,
    label: 'reference_baseline_001',
    designatedBy: 'g5-designate-reference-baseline.ts',
    runTerminalState: run.lifecycleState as string,
    allowOfficialReferenceBaseline: true,
  });

  const aggregates = runResult.aggregates as Record<string, unknown>;
  const derivedPath = join(
    pocRoot,
    'experiments/baseline-evidence/g4-1-official-runs',
    `${RUN_ID}.derived-report.json`,
  );
  const derived = JSON.parse(readFileSync(derivedPath, 'utf8')) as Record<string, unknown>;
  const fm = derived.falseMergeSafety as Record<string, unknown>;

  const sidecar = {
    schemaVersion: '1.0.0',
    designationId: 'reference_baseline_001',
    designatedRunId: RUN_ID,
    designationEventId: event.eventId,
    designatedAt: event.designatedAt,
    designatedBy: event.designatedBy,
    architectAuthorizationReference: ARCHITECT_AUTH,
    status: 'active',
    baselineValidityStatus: 'passed_g4_1_measurement_validity_gates',
    immutableRunResult: {
      path: relative(repoRoot, RUN_RESULT_PATH),
      sha256: runResultHash,
    },
    anchorPack: {
      packId: packMeta.packId,
      packVersion: packMeta.packVersion,
      contentHash: expectedAnchorHash,
      jsonPath: relative(repoRoot, PACK_PATH),
    },
    runProfile: {
      profileId: run.runProfileId,
      contentHash: run.runProfileContentHash,
    },
    scorer: {
      version: SCORER_VERSION,
      contentHash: computeScorerContentHash(),
    },
    revisions: {
      ckesGitCommit: run.gitCommit,
      pipelinePackageVersion: pipelinePkg.version,
      harnessPackageVersion: harnessPkg.version,
      evaluationInfrastructureRevision: EVAL_INFRA_REVISION,
    },
    lineage: {
      preservedInvalidPredecessorExecution: {
        runId: PREDECESSOR_RUN_ID,
        notDesignated: true,
        reason: 'G4 measurement-validity defects (infrastructure errors, present_unmapped)',
        immutableRunResultSha256: PREDECESSOR_HASH,
        evidencePath: 'poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-ANCHOR-001.json',
      },
      note:
        'reference_baseline_001 names the first designated CKES reference baseline; run id suffix 002 is intentional.',
    },
    preservedBaselineFindings: {
      falseMergeCount: aggregates.falseMergeCount,
      falseMergeRate: fm.falseMergeRate,
      falseMergeRateCi95: fm.falseMergeRateCi95,
      criticalFalseMergeScenarioIds: fm.criticalSeverityScenarioIds,
      mustNotMatchViolationCount: 4,
      mustNotMatchScenarioIds: ['ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'],
      missedMatchCount: 4,
      unnecessaryDeferralCount: 1,
      disclaimer:
        'Pre-improvement CKES behavior; not sanitized for designation.',
    },
    designationSidecarSha256: '',
  };

  const sidecarPath = join(DESIGNATIONS_DIR, 'reference_baseline_001.json');
  const sidecarBody = { ...sidecar };
  delete (sidecarBody as { designationSidecarSha256?: string }).designationSidecarSha256;
  const sidecarHash = createHash('sha256')
    .update(JSON.stringify(sidecarBody, null, 2))
    .digest('hex');
  sidecar.designationSidecarSha256 = sidecarHash;

  await writeFileAtomic(sidecarPath, JSON.stringify(sidecar, null, 2));

  const verificationRecord = {
    verifiedAt: new Date().toISOString(),
    passed: true,
    runResultHash,
    checks: {
      packHash: expectedAnchorHash,
      scenarios: 40,
      infrastructureErrors: 0,
      presentUnmapped: 0,
      dryRun: false,
      leakage: true,
      completeness: true,
    },
  };
  writeFileSync(
    join(DESIGNATIONS_DIR, 'G5-PRE-DESIGNATION-VERIFICATION.json'),
    JSON.stringify(verificationRecord, null, 2),
  );

  console.log(JSON.stringify({ event, sidecarPath, designationSidecarSha256: sidecarHash }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
