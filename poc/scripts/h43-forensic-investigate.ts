/**
 * H4.3 — forensic reproduction + disposable decision-stack trace (diagnostic only).
 * Does not modify pipeline/policy/adjudication. Writes INV-* under experiments/forensics/h43/.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  toPipelineInput,
  deriveSourceTextForFullPipeline,
  scoreScenario,
  computePackContentHash,
} from '@ckes/benchmark';
import { evaluatePolicy, loadPolicy } from '@ckes/policy';
import { discoverCandidates } from '@ckes/pipeline';
import { hybridRetrieve, adjudicateSemantic } from '@ckes/pipeline';
import { HarnessRunner } from '@ckes/harness';
import {
  resetHarnessSandbox,
  resetCanonicalCorpusForBenchmarkPack,
  loadPackSeedMaterial,
} from '@ckes/harness';
import { normalizeLabel } from '@ckes/adapter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const H43_ROOT = join(pocRoot, 'experiments/forensics/h43');
const INV_DIR = join(H43_ROOT, 'investigations');
const RUNS_DIR = join(H43_ROOT, 'repro-runs');
const PROFILE_PATH = join(pocRoot, 'experiments/run-profiles/CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001.json');

const BASELINE_ANCHOR = join(
  pocRoot,
  'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json',
);
const BASELINE_CHALLENGE = join(
  pocRoot,
  'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-CHALLENGE-002.json',
);
const BASELINE_STAT = join(
  pocRoot,
  'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-STAT-002.json',
);

const ANCHOR_PACK = join(pocRoot, 'benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json');
const CHALLENGE_PACK = join(pocRoot, 'benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.json');
const STAT_PACK = join(pocRoot, 'benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json');

type Suite = 'anchor' | 'challenge' | 'statistical';

function suitePaths(suite: Suite): { pack: string; baseline: string } {
  if (suite === 'anchor') return { pack: ANCHOR_PACK, baseline: BASELINE_ANCHOR };
  if (suite === 'challenge') return { pack: CHALLENGE_PACK, baseline: BASELINE_CHALLENGE };
  return { pack: STAT_PACK, baseline: BASELINE_STAT };
}

interface BaselineRow {
  outcome: string;
  failureClassification?: string;
  actualDecisionClass?: string;
  policyAction?: string;
}

function loadJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function baselineRow(suite: Suite, scenarioId: string): BaselineRow | undefined {
  const path = suitePaths(suite).baseline;
  const run = loadJson(path);
  const s = (run.scenarios as Record<string, unknown>[]).find((x) => x.scenarioId === scenarioId);
  if (!s) return undefined;
  const eva = (s.scoring as Record<string, unknown>)?.expectedVersusActual as Record<
    string,
    unknown
  >;
  return {
    outcome: s.outcome as string,
    failureClassification: s.failureClassification as string | undefined,
    actualDecisionClass: s.actualDecisionClass as string | undefined,
    policyAction: eva?.policyAction as string | undefined,
  };
}

function terminalMatches(a: BaselineRow, b: BaselineRow): boolean {
  return (
    a.outcome === b.outcome &&
    (a.failureClassification ?? null) === (b.failureClassification ?? null) &&
    (a.actualDecisionClass ?? null) === (b.actualDecisionClass ?? null) &&
    (a.policyAction ?? null) === (b.policyAction ?? null)
  );
}

function deterministicBranchLabel(
  candidateText: string,
  topScore: number,
  topLabel: string,
): string {
  const candNorm = candidateText.toLowerCase();
  const matchNorm = topLabel.toLowerCase();
  if (topScore >= 0.95 || candNorm === matchNorm) return 'deterministic_equivalent';
  if (topScore >= 0.7) return 'deterministic_subsumed';
  if (candNorm.includes(matchNorm) || matchNorm.includes(candNorm)) return 'deterministic_extends';
  return 'deterministic_distinct';
}

function inputToCandidate(input: ReturnType<typeof toPipelineInput>) {
  if (!input.directCandidate) throw new Error('directCandidate required for trace');
  return {
    candidateType: input.directCandidate.candidateType as 'concept' | 'knowledge_object',
    text: input.directCandidate.text,
    techniqueLabels: [] as string[],
    ingredientLabels: [] as string[],
    sourcePath: 'harness.directCandidate',
    candidateRole: input.directCandidate.candidateType,
    occurrenceKey: '0',
  };
}

async function traceDecisionStack(
  pool: pg.Pool,
  scenario: Record<string, unknown>,
  packMeta: Record<string, unknown>,
  seeds: Array<{ seedId: string; label: string; statement?: string }>,
): Promise<Record<string, unknown>> {
  const projected = toPipelineInput(scenario, {
    packId: packMeta.packId as string,
    packVersion: packMeta.packVersion as string,
  });

  const extractionTrace: Record<string, unknown> = {};
  let candidate = inputToCandidate(projected);

  if (projected.executionMode === 'full_pipeline') {
    const sourceText = deriveSourceTextForFullPipeline(projected);
    extractionTrace.sourceTextUsed = sourceText;
    const pseudoRecipe = {
      title: 'Harness Source',
      description: sourceText,
      instructions: [{ step: 1, text: sourceText ?? '' }],
      ingredients: [],
      meta: { synthetic: true, pocMarkers: ['SYNTHETIC', 'HARNESS'] },
    };
    const discovered = discoverCandidates(pseudoRecipe);
    extractionTrace.discoveredCandidates = discovered.map((c) => ({
      text: c.text,
      role: c.candidateRole,
      sourcePath: c.sourcePath,
    }));
    const primary =
      discovered.find((c) => c.candidateRole === 'knowledge_object') ?? discovered[0];
    extractionTrace.primarySelected = primary
      ? { text: primary.text, role: primary.candidateRole, sourcePath: primary.sourcePath }
      : null;
    if (!primary && projected.directCandidate) {
      extractionTrace.fallbackToDirectCandidate = true;
      candidate = inputToCandidate({
        ...projected,
        executionMode: 'decision_slice',
      });
    } else if (primary) {
      candidate = {
        candidateType: primary.candidateType,
        text: primary.text,
        techniqueLabels: primary.techniqueLabels,
        ingredientLabels: primary.ingredientLabels,
        sourcePath: primary.sourcePath,
        candidateRole: primary.candidateRole,
        occurrenceKey: primary.occurrenceKey,
      };
    }
  }

  const matches = await hybridRetrieve(pool, candidate);
  const adjudication = await adjudicateSemantic(candidate, matches, {
    deterministic: true,
  });
  const policy = loadPolicy();
  const policyResult = evaluatePolicy(policy, {
    adjudicationClass: adjudication.classification,
    confidence: adjudication.confidence,
    isSyntheticProvenance: true,
    newConceptsThisRun: 0,
    sourceItemsThisStage: 1,
  });

  const top = matches[0];
  const branch =
    top
      ? deterministicBranchLabel(candidate.text, top.score, top.label)
      : 'no_matches_distinct';

  const seedByNorm = new Map(seeds.map((s) => [normalizeLabel(s.label), s]));
  const topSeed = top ? seedByNorm.get(normalizeLabel(top.label)) : undefined;

  const { rows: conceptRow } = top
    ? await pool.query(`SELECT id, label, description FROM ckes.canonical_concepts WHERE id = $1`, [
        top.id,
      ])
    : { rows: [] };

  return {
    projectedPipelineInput: {
      scenarioId: projected.scenarioId,
      executionMode: projected.executionMode,
      directCandidate: projected.directCandidate,
      sourceText: projected.sourceText,
      mustNotMatchInProjection: false,
    },
    extractionTrace,
    candidateEnteredRetrieval: candidate,
    rankedRetrievalMatches: matches,
    primaryMatch: top ?? null,
    canonicalSeedForPrimary: topSeed
      ? {
          seedId: topSeed.seedId,
          label: topSeed.label,
          statement: topSeed.statement,
        }
      : null,
    dbConceptDescription: conceptRow[0]?.description ?? null,
    adjudication: {
      classification: adjudication.classification,
      confidence: adjudication.confidence,
      rationale: adjudication.rationale,
      usedAi: adjudication.usedAi,
      inferredDeterministicBranch: branch,
    },
    policy: {
      action: policyResult.action,
      admit: policyResult.admit,
      rationale: policyResult.rationale,
    },
    candidateVsPrimaryLabel: {
      candidateText: candidate.text,
      primaryLabel: top?.label,
      normalizedEqual:
        top && normalizeLabel(candidate.text) === normalizeLabel(top.label),
      literalEqual: top && candidate.text.toLowerCase() === top.label.toLowerCase(),
    },
  };
}

async function reproduceViaHarness(
  pool: pg.Pool,
  suite: Suite,
  scenarioId: string,
): Promise<{ harnessRow: BaselineRow; runPath: string }> {
  const packPath = suitePaths(suite).pack;
  const pack = await HarnessRunner.loadPack(packPath);
  const profile = loadJson(PROFILE_PATH);
  mkdirSync(RUNS_DIR, { recursive: true });
  const runId = `H43-REPRO-${scenarioId}-${randomUUID().slice(0, 8)}`;
  const runner = new HarnessRunner();
  const { resultPath } = await runner.startRun({
    packPath,
    pack,
    runsDir: RUNS_DIR,
    pool,
    scenarioIds: [scenarioId],
    concurrency: 1,
    runProfile: profile,
    dryRun: false,
    runId,
    databaseProfile: 'clean',
    retrievalMode: profile.retrievalMode as string,
    deterministicAi: profile.deterministicAi as boolean,
  });
  const runResult = loadJson(resultPath);
  const s = (runResult.scenarios as Record<string, unknown>[])[0];
  const eva = (s.scoring as Record<string, unknown>)?.expectedVersusActual as Record<
    string,
    unknown
  >;
  return {
    harnessRow: {
      outcome: s.outcome as string,
      failureClassification: s.failureClassification as string | undefined,
      actualDecisionClass: s.actualDecisionClass as string | undefined,
      policyAction: eva?.policyAction as string | undefined,
    },
    runPath: resultPath,
  };
}

function mnmtAnswers(
  scenario: Record<string, unknown>,
  trace: Record<string, unknown>,
  seeds: Array<{ seedId: string; label: string; statement?: string }>,
): Record<string, unknown> {
  const bans = (scenario.mustNotMatchIdentities as Array<{ seedId: string }>) ?? [];
  const cand = (scenario.directCandidate as { text?: string })?.text ?? '';
  const primary = trace.canonicalSeedForPrimary as { seedId: string; label: string; statement?: string } | null;
  const dbDesc = trace.dbConceptDescription as string | null;
  return {
    A_distinguishingInCandidateRepresentation:
      'Only directCandidate.text (and extraction output for full_pipeline) enters pipeline; qualifiers/context/applicability fields not in projection for these scenarios',
    B_distinguishingInMatchedCanonical:
      primary?.statement || dbDesc
        ? `Seed statement/description present in corpus: ${(primary?.statement ?? dbDesc)?.slice(0, 120)}`
        : 'Label only in canonical_concepts',
    C_layerLostOrIgnored:
      trace.adjudication
        ? 'Pending: if B present but adjudication uses label-only deterministic rule, distinction in statement may not reach adjudication prompt'
        : 'unknown',
    D_benchmarkExpectationWithoutCkesInfo:
      bans.length > 0
        ? 'mustNotMatchIdentities is scorer-only; benchmark related_distinct may still require semantics beyond literal label'
        : 'n/a',
    E_literalEqualityTriggersDeterministicEquivalent:
      (trace.candidateVsPrimaryLabel as { literalEqual?: boolean })?.literalEqual === true ||
      (trace.adjudication as { inferredDeterministicBranch?: string })?.inferredDeterministicBranch ===
        'deterministic_equivalent',
    F_negativeIdentityRequired:
      'provisional_no — literal/score collapse may explain without negative identity if distinction not in candidate representation',
  };
}

async function investigateScenario(
  pool: pg.Pool,
  suite: Suite,
  scenarioId: string,
  meta: { clusters?: string[]; priority?: string; controlFor?: string },
): Promise<void> {
  const packPath = suitePaths(suite).pack;
  const pack = loadJson(packPath);
  const packMeta = pack.pack as Record<string, unknown>;
  const scenario = (pack.scenarios as Record<string, unknown>[]).find(
    (s) => s.scenarioId === scenarioId,
  );
  if (!scenario) throw new Error(`Unknown scenario ${scenarioId}`);

  const seeds = (pack.canonicalSeedMaterial ?? []) as Array<{
    seedId: string;
    label: string;
    statement?: string;
  }>;

  const base = baselineRow(suite, scenarioId);
  if (!base) throw new Error(`No baseline row for ${scenarioId}`);

  let reproductionStatus: 'reproduced_rb001' | 'repro_discrepancy' | 'not_attempted' =
    'not_attempted';
  let harnessRow: BaselineRow | undefined;
  let reproRunPath: string | undefined;
  let reproError: string | undefined;

  try {
    const repro = await reproduceViaHarness(pool, suite, scenarioId);
    harnessRow = repro.harnessRow;
    reproRunPath = repro.runPath;
    reproductionStatus = terminalMatches(base, harnessRow) ? 'reproduced_rb001' : 'repro_discrepancy';
  } catch (e) {
    reproError = e instanceof Error ? e.message : String(e);
    reproductionStatus = 'repro_discrepancy';
  }

  await resetHarnessSandbox(pool);
  await resetCanonicalCorpusForBenchmarkPack(pool);
  await loadPackSeedMaterial(pool, seeds);

  const trace =
    reproductionStatus === 'reproduced_rb001' || reproductionStatus === 'repro_discrepancy'
      ? await traceDecisionStack(pool, scenario, packMeta, seeds)
      : { skipped: true, reason: reproError };

  const score =
    trace.skipped
      ? null
      : scoreScenario(
          {
            expectedDecisionClass: scenario.expectedDecisionClass as string,
            mustNotMatchIdentities: scenario.mustNotMatchIdentities as
              | import('@ckes/benchmark').ScenarioExpectations['mustNotMatchIdentities']
              | undefined,
          },
          {
            adjudicationClass: (trace.adjudication as { classification: string }).classification,
            policyAction: (trace.policy as { action: string }).action,
          },
        );

  let firstDivergence = 'unknown_unresolved';
  let rootCause = 'unknown_unresolved';
  let contributing: string[] = [];
  let downstream: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (!trace.skipped) {
    const adj = trace.adjudication as { classification: string; inferredDeterministicBranch: string };
    const pol = trace.policy as { action: string };
    downstream.push(`scorer_${score?.failureClassification ?? score?.outcome}`);

    if (adj.inferredDeterministicBranch === 'deterministic_equivalent') {
      firstDivergence = 'adjudication';
      rootCause = 'adjudication';
      contributing.push('retrieval_primary_match', 'deterministic_equivalence_rule');
      confidence = reproductionStatus === 'reproduced_rb001' ? 'high' : 'medium';
    } else if (adj.inferredDeterministicBranch === 'deterministic_subsumed') {
      firstDivergence = 'adjudication';
      rootCause = 'adjudication';
      contributing.push('retrieval_high_similarity');
      confidence = reproductionStatus === 'reproduced_rb001' ? 'high' : 'medium';
    } else if (adj.classification === 'DISTINCT' && scenario.expectedDecisionClass === 'defer_human') {
      firstDivergence = 'policy_expectation_mismatch';
      rootCause = 'benchmark_policy_semantics_mismatch';
      contributing.push('adjudication_distinct', 'policy_evaluate_new_identity');
      confidence = 'medium';
    } else {
      firstDivergence = 'adjudication_or_retrieval';
      rootCause = 'unknown_unresolved';
      confidence = 'low';
    }
    if (pol.action === 'reuse_existing' && adj.classification === 'EQUIVALENT') {
      downstream.push('policy_reuse_existing_manifestation');
    }
  }

  const inv = {
    schemaVersion: '1.0.0',
    recordKind: 'INV',
    gate: 'H4.3',
    scenarioId,
    suite,
    ...meta,
    reproductionStatus,
    baselineReference:
      suite === 'anchor'
        ? 'RUN-REF-CLEAN-ANCHOR-002.json'
        : suite === 'challenge'
          ? 'RUN-REF-CLEAN-CHALLENGE-002.json'
          : 'RUN-REF-CLEAN-STAT-002.json',
    baselineTerminal: base,
    harnessReproductionTerminal: harnessRow,
    reproRunPath: reproRunPath ? reproRunPath.replace(pocRoot + '/', 'poc/') : undefined,
    reproError,
    disposableTrace: trace,
    scorerFromTrace: score,
    causalAttribution: {
      firstDivergenceLayer: firstDivergence,
      primaryRootCause: rootCause,
      contributingCauses: contributing,
      downstreamManifestations: downstream,
      diagnosisConfidence: confidence,
      notEstablishedAsGovernanceRootCause: confidence !== 'high',
    },
    mnmtForensicQuestions:
      (scenario.mustNotMatchIdentities as unknown[])?.length
        ? mnmtAnswers(scenario, trace as Record<string, unknown>, seeds)
        : undefined,
    immutabilityNote: 'Baseline -002 files not modified',
  };

  writeFileSync(join(INV_DIR, `INV-${scenarioId}.json`), JSON.stringify(inv, null, 2));
  console.log(scenarioId, reproductionStatus, rootCause, confidence);
}

const PRESETS: Record<string, { suite: Suite; ids: string[] }> = {
  tier0: {
    suite: 'anchor',
    ids: ['ANC-0017', 'ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'],
  },
  p1: {
    suite: 'anchor',
    ids: ['ANC-0023', 'ANC-0024', 'ANC-0027', 'ANC-0029', 'ANC-0035', 'ANC-0040'],
  },
  controls: {
    suite: 'anchor',
    ids: ['ANC-0038', 'ANC-0030', 'ANC-0034', 'ANC-0001', 'ANC-0002'],
  },
  defer: {
    suite: 'challenge',
    ids: ['CHL-0003', 'CHL-0010', 'CHL-0002', 'CHL-0006'],
  },
  stat: {
    suite: 'statistical',
    ids: ['STA-0014', 'STA-0008'],
  },
};

async function main(): Promise<void> {
  const anchorPack = loadJson(ANCHOR_PACK);
  if (computePackContentHash(anchorPack) !== '2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c') {
    console.error('Anchor pack hash drift');
    process.exit(1);
  }
  mkdirSync(INV_DIR, { recursive: true });

  const preset = process.argv[2] ?? 'all';
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://ckes:ckes_dev@localhost:5432/ckes_poc',
  });

  const jobs: Array<{ suite: Suite; id: string }> = [];
  if (preset === 'all') {
    for (const p of Object.values(PRESETS)) {
      for (const id of p.ids) jobs.push({ suite: p.suite, id });
    }
  } else if (PRESETS[preset]) {
    for (const id of PRESETS[preset].ids) jobs.push({ suite: PRESETS[preset].suite, id });
  } else if (preset.startsWith('STA-')) {
    jobs.push({ suite: 'statistical', id: preset });
  } else if (preset.startsWith('CHL-')) {
    jobs.push({ suite: 'challenge', id: preset });
  } else {
    jobs.push({ suite: 'anchor', id: preset });
  }

  try {
    for (const job of jobs) {
      await investigateScenario(pool, job.suite, job.id, {
        priority: PRESETS.tier0.ids.includes(job.id) ? 'P0' : 'P1+',
      });
    }
  } finally {
    await pool.end();
  }

  const summary = {
    gate: 'H4.3',
    generatedAt: new Date().toISOString(),
    investigated: jobs.map((j) => j.id),
    invArtifacts: jobs.map((j) => `investigations/INV-${j.id}.json`),
    disposableTracingInScriptOnly: true,
    persistentInstrumentation: false,
    ckesRemediation: false,
  };
  writeFileSync(join(H43_ROOT, 'H43-SUMMARY.json'), JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
