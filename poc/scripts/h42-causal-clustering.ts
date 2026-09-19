/**
 * H4.2 — causal clustering and H4.3 investigation selection (static only; no runs, no Debug).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePackContentHash } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const forensicsRoot = join(pocRoot, 'experiments/forensics');
const h42Root = join(forensicsRoot, 'h42');

const IMMUTABILITY = {
  anchorPackContentHash: '2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c',
  anchorRunHash: 'c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573',
  manifestSha256: '67ff15095e9b8d1ee5fb22a99412b0407a3de8e19bea123ff5abef32ff55bae0',
  designationSidecarFileHash: '0e085fefa4d1d59645fc82f4c480cf629ff9d2721e13c299a7a3e58ca4a967a2',
};

function sha256File(abs: string): string {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

function loadJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(pocRoot, rel), 'utf8')) as Record<string, unknown>;
}

function verifyImmutability(): void {
  const errors: string[] = [];
  const anchorRunPath = join(
    pocRoot,
    'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json',
  );
  if (sha256File(anchorRunPath) !== IMMUTABILITY.anchorRunHash) errors.push('anchor run');
  const manifest = loadJson(
    'experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-manifest.json',
  );
  if (manifest.manifestSha256 !== IMMUTABILITY.manifestSha256) errors.push('manifest');
  const anchorPack = loadJson('benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json');
  if (computePackContentHash(anchorPack) !== IMMUTABILITY.anchorPackContentHash)
    errors.push('anchor pack');
  const desPath = join(pocRoot, 'experiments/reference-designations/reference_baseline_001.json');
  if (sha256File(desPath) !== IMMUTABILITY.designationSidecarFileHash) errors.push('designation');
  if (errors.length) {
    console.error('Immutability FAILED:', errors);
    process.exit(1);
  }
}

type ScenarioRow = {
  scenarioId: string;
  transformationType: string;
  domain: string;
  executionMode: string;
  expectedDecisionClass: string;
  actualDecisionClass: string;
  policyAction?: string;
  matchedSeed?: string;
  candidateText?: string;
  mustNotMatch: boolean;
  outcome: string;
  failureClassification?: string;
};

function buildAnchorRows(
  anchorRun: Record<string, unknown>,
  packById: Map<string, Record<string, unknown>>,
): Map<string, ScenarioRow> {
  const map = new Map<string, ScenarioRow>();
  for (const s of anchorRun.scenarios as Record<string, unknown>[]) {
    const id = s.scenarioId as string;
    const p = packById.get(id)!;
    const cap = s.evaluationCapture as Record<string, unknown> | undefined;
    const eva = (s.scoring as Record<string, unknown>)?.expectedVersusActual as Record<
      string,
      unknown
    >;
    map.set(id, {
      scenarioId: id,
      transformationType: p.transformationType as string,
      domain: p.domain as string,
      executionMode: (s.executionMode ?? p.executionMode) as string,
      expectedDecisionClass: p.expectedDecisionClass as string,
      actualDecisionClass: s.actualDecisionClass as string,
      policyAction: eva?.policyAction as string | undefined,
      matchedSeed: cap?.benchmarkLocalSeedId as string | undefined,
      candidateText: (p.directCandidate as { text?: string })?.text,
      mustNotMatch: Boolean((p.mustNotMatchIdentities as unknown[])?.length),
      outcome: s.outcome as string,
      failureClassification: s.failureClassification as string | undefined,
    });
  }
  return map;
}

/** Mechanism-oriented clusters (scenarios may appear in multiple). */
const CLUSTER_DEFS: Array<{
  clusterId: string;
  name: string;
  rationale: string;
  scenarioIds: string[];
  mechanismSummary: string;
}> = [
  {
    clusterId: 'CL-MNMT-ADVERSARIAL',
    name: 'Must-not-match adversarial false-merge',
    rationale:
      'Benchmark expects related_distinct while forbidding merge to a specific seed; eval capture shows forbidden seed matched. Shares adversarial_false_merge_candidate construction across domains.',
    scenarioIds: ['ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'],
    mechanismSummary:
      'Candidate text often equals or tightly overlaps forbidden seed label; mustNotMatch is scorer-only (not in pipeline projection).',
  },
  {
    clusterId: 'CL-EQUIV-REUSE',
    name: 'EQUIVALENT + reuse_existing collapse',
    rationale:
      'Terminal merge-class EQUIVALENT with policy reuse_existing where benchmark expected non-equivalence (mostly related_distinct).',
    scenarioIds: [
      'ANC-0017',
      'ANC-0018',
      'ANC-0019',
      'ANC-0020',
      'ANC-0024',
      'ANC-0028',
      'ANC-0031',
      'ANC-0032',
      'ANC-0036',
      'ANC-0040',
    ],
    mechanismSummary:
      'Suggests top-match adjudication treating candidate as equivalent to retrieved identity; policy follows merge classes.',
  },
  {
    clusterId: 'CL-SUBSUMED-REJECT',
    name: 'SUBSUMED_BY_EXISTING with reject_new_identity',
    rationale:
      'Adjudication emits subsumption merge signal but policy rejects new identity; scorer still records false_merge when semantic expectation differs.',
    scenarioIds: [
      'ANC-0023',
      'ANC-0025',
      'ANC-0027',
      'ANC-0029',
      'ANC-0033',
      'ANC-0035',
      'ANC-0037',
      'ANC-0039',
    ],
    mechanismSummary:
      'Distinguishes partial merge signal vs policy gate; still wrong vs benchmark expected class (related_distinct, contradict, revalidation).',
  },
  {
    clusterId: 'CL-RELATION-DIRECTION',
    name: 'Objective/method direction confusion',
    rationale:
      'Transformation flips objective vs method framing; failures cluster with direction transforms; nearby pass control exists.',
    scenarioIds: ['ANC-0027', 'ANC-0028', 'ANC-0039'],
    mechanismSummary:
      'Tests whether CKES preserves directional semantic role between candidate and corpus neighbor.',
  },
  {
    clusterId: 'CL-SCOPE-QUALIFIER',
    name: 'Scope / qualification / applicability',
    rationale:
      'narrow_applicability, broaden_applicability, qualification transformations — scope boundaries expected to matter.',
    scenarioIds: ['ANC-0024', 'ANC-0035', 'ANC-0036'],
    mechanismSummary:
      'Qualifier or applicability text may be absent from directCandidate text presented to decision slice.',
  },
  {
    clusterId: 'CL-CONTRADICTION',
    name: 'Contradiction mishandled as merge',
    rationale:
      'Expected contradict_existing but adjudication produced SUBSUMED_BY_EXISTING.',
    scenarioIds: ['ANC-0023'],
    mechanismSummary:
      'Isolated contradiction family in Anchor; tests CONTRADICTS vs merge collapse.',
  },
  {
    clusterId: 'CL-COMPOUND',
    name: 'Compound assertion',
    rationale: 'Single scenario tests multi-claim candidate vs single seed neighbor.',
    scenarioIds: ['ANC-0029'],
    mechanismSummary: 'Compound structure may be lost in directCandidate string.',
  },
  {
    clusterId: 'CL-FULL-PIPELINE',
    name: 'Full-pipeline execution outlier',
    rationale:
      'Only Anchor false merge on full_pipeline; related_distinct transformation with extraction path.',
    scenarioIds: ['ANC-0017'],
    mechanismSummary:
      'May share mechanism with decision_slice after fallback to directCandidate; execution path must be verified in H4.3.',
  },
  {
    clusterId: 'CL-REVALIDATION',
    name: 'Emerging process / revalidation',
    rationale: 'Expected revalidation_candidate or related_distinct with process-evolution framing.',
    scenarioIds: ['ANC-0025', 'ANC-0032'],
    mechanismSummary: 'Tests non-static identity / process change vs merge to existing seed.',
  },
];

const HYPOTHESES = [
  {
    hypothesisId: 'HYP-H42-RETRIEVAL-TOP1',
    label: 'Wrong primary retrieval match drives merge',
    supportingEvidence: [
      'POC adjudication uses matches[0] only (decision-slice.ts)',
      'Immutable runs lack rank list but eval mapped seed is consistent with a single chosen identity',
    ],
    contradictingEvidence: [
      'Cannot confirm rank order without reproduction',
      'Some failures may be correct retrieval with wrong adjudication',
    ],
    unavailableEvidence: ['full_ranked_retrieval_list', 'per_candidate_scores'],
    discriminatingScenarios: ['ANC-0017', 'ANC-0038', 'ANC-0027'],
    ifTrueDebugExpectation:
      'matches[0] label/seed differs from benchmark-intended distinct neighbor; lower-ranked distinct candidate exists',
    ifFalseDebugExpectation:
      'matches[0] is the benchmark-intended comparison identity yet adjudication still merges',
  },
  {
    hypothesisId: 'HYP-H42-ADJ-DETERMINISTIC-COLLAPSE',
    label: 'Deterministic adjudication collapses on label/score similarity',
    supportingEvidence: [
      'RB001 profile uses deterministic adjudication path when no live AI key',
      'adjudication.ts: score>=0.95 or exact normalized label → EQUIVALENT',
      'Several FM candidates share literal text with seed labels (e.g. GPIO pin)',
    ],
    contradictingEvidence: [
      'Some FMs are SUBSUMED not EQUIVALENT',
      'Does not alone explain must-not-match benchmark intent',
    ],
    unavailableEvidence: ['adjudication_rationale', 'retrieval score values at decision time'],
    discriminatingScenarios: ['ANC-0018', 'ANC-0019', 'ANC-0030', 'ANC-0038'],
    ifTrueDebugExpectation:
      'Breakpoint shows deterministic branch taken; top.score high or candNorm===matchNorm',
    ifFalseDebugExpectation: 'AI adjudication used or deterministic returns DISTINCT despite similarity',
  },
  {
    hypothesisId: 'HYP-H42-REPRESENTATION-INSUFFICIENT',
    label: 'directCandidate text lacks distinguishing semantics present in benchmark intent',
    supportingEvidence: [
      'decision_slice uses directCandidate.text only (techniqueLabels empty in harness path)',
      'mustNotMatchIdentities excluded from pipeline input (forbidden-keys)',
      'MNMT scenarios: candidate string equals seed label in pack seeds',
    ],
    contradictingEvidence: [
      'Some related_distinct passes (ANC-0030) with similar neighbor pressure',
      'Pack may include richer seed statements not passed to adjudication prompt',
    ],
    unavailableEvidence: ['full seed statement in adjudication prompt', 'structured qualifier fields'],
    discriminatingScenarios: ['ANC-0035', 'ANC-0024', 'ANC-0031'],
    ifTrueDebugExpectation:
      'Adjudication prompt shows minimal candidate text; seed statement/qualifiers not visible',
    ifFalseDebugExpectation: 'Rich distinguishing text present in prompt yet still merged',
  },
  {
    hypothesisId: 'HYP-H42-POLICY-MANIFESTATION',
    label: 'Policy correctly applies wrong adjudication (downstream symptom)',
    supportingEvidence: [
      'Several SUBSUMED cases already have reject_new_identity — policy not always admitting',
      'EQUIVALENT cases show reuse_existing aligned with policy table',
    ],
    contradictingEvidence: [
      'false_merge still indicates wrong semantic class upstream of policy in many cases',
    ],
    unavailableEvidence: ['policy_rule_trace'],
    discriminatingScenarios: ['ANC-0024', 'ANC-0025'],
    ifTrueDebugExpectation: 'Adjudication merge class wrong; policy action predictable from class',
    ifFalseDebugExpectation: 'Adjudication DISTINCT/CONTRADICTS but policy still merges',
  },
  {
    hypothesisId: 'HYP-H42-MNMT-BENCHMARK-ONLY',
    label: 'Violation is measurement of benchmark-only constraint CKES never received',
    supportingEvidence: [
      'mustNotMatchIdentities in forbidden-keys for projection',
      'Scorer applies mustNotMatch after run (scoring.ts)',
    ],
    contradictingEvidence: [
      'Benchmark still encodes distinct semantic intent via related_distinct expectation',
      'Candidate/seed may lack extra distinguishing text even if constraint were visible',
    ],
    unavailableEvidence: ['whether any layer could represent negative identity without new design'],
    discriminatingScenarios: ['ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'],
    ifTrueDebugExpectation:
      'No code path reads mustNotMatch; merge driven by positive similarity only',
    ifFalseDebugExpectation: 'Pipeline consumes negative identity signal (would contradict current static code review)',
  },
];

const TIER0 = ['ANC-0017', 'ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'];

const ORDINARY_REPRESENTATIVES = [
  {
    scenarioId: 'ANC-0023',
    clusters: ['CL-CONTRADICTION', 'CL-SUBSUMED-REJECT'],
    diagnosticValue: 'Only contradict_existing FM; tests CONTRADICTS vs SUBSUMED.',
    controlScenarioId: null,
  },
  {
    scenarioId: 'ANC-0024',
    clusters: ['CL-SCOPE-QUALIFIER', 'CL-EQUIV-REUSE'],
    diagnosticValue: 'qualify_existing → EQUIVALENT; qualifier loss vs adjudication.',
    controlScenarioId: null,
  },
  {
    scenarioId: 'ANC-0027',
    clusters: ['CL-RELATION-DIRECTION', 'CL-SUBSUMED-REJECT'],
    diagnosticValue: 'objective_to_method fail vs ANC-0038 pass (same transformation family).',
    controlScenarioId: 'ANC-0038',
  },
  {
    scenarioId: 'ANC-0029',
    clusters: ['CL-COMPOUND', 'CL-SUBSUMED-REJECT'],
    diagnosticValue: 'compound_assertion handling.',
    controlScenarioId: null,
  },
  {
    scenarioId: 'ANC-0035',
    clusters: ['CL-SCOPE-QUALIFIER', 'CL-SUBSUMED-REJECT', 'CL-MNMT-ADVERSARIAL'],
    diagnosticValue: 'GPIO pin method vs GPIO pin seed; scope/method qualifier.',
    controlScenarioId: 'ANC-0018',
  },
  {
    scenarioId: 'ANC-0040',
    clusters: ['CL-EQUIV-REUSE'],
    diagnosticValue: 'supporting_observation vs ANC-0030 irrelevant_near_neighbor pass.',
    controlScenarioId: 'ANC-0030',
  },
];

const CONTROL_SCENARIOS = [
  {
    scenarioId: 'ANC-0030',
    role: 'pass_control',
    pairsWith: ['ANC-0040'],
    note: 'irrelevant_near_neighbor → DISTINCT pass',
  },
  {
    scenarioId: 'ANC-0038',
    role: 'pass_control',
    pairsWith: ['ANC-0027', 'ANC-0028', 'ANC-0039'],
    note: 'objective_to_method → DISTINCT pass',
  },
  {
    scenarioId: 'ANC-0034',
    role: 'pass_control',
    pairsWith: ['ANC-0032'],
    note: 'terminology_substitution related_distinct pass',
  },
  {
    scenarioId: 'ANC-0001',
    role: 'pass_control',
    pairsWith: ['ANC-0002'],
    note: 'paraphrase_same_identity match pass vs missed_match ANC-0002',
  },
  {
    scenarioId: 'CHL-0004',
    role: 'challenge_pass_contrast',
    pairsWith: ['CHL-0014'],
    note: 'Challenge related_distinct pass vs unnecessary deferral on defer_human',
  },
];

const CHL_DEFERRAL_SAMPLE = [
  { scenarioId: 'CHL-0003', transformationType: 'qualification', domain: 'electronics' },
  { scenarioId: 'CHL-0010', transformationType: 'adversarial_false_merge_candidate', domain: 'culinary' },
  { scenarioId: 'CHL-0002', transformationType: 'method_to_objective', domain: 'electronics' },
  { scenarioId: 'CHL-0006', transformationType: 'narrow_applicability', domain: 'electronics' },
  { scenarioId: 'CHL-0009', transformationType: 'compound_assertion', domain: 'electronics' },
  { scenarioId: 'CHL-0014', transformationType: 'related_distinct', domain: 'culinary' },
  { scenarioId: 'CHL-0005', transformationType: 'emerging_process_revalidation', domain: 'electronics' },
  { scenarioId: 'CHL-0025', transformationType: 'contradiction', domain: 'culinary' },
];

const STAT_FM_SAMPLE = [
  {
    scenarioId: 'STA-0014',
    transformationType: 'adversarial_false_merge_candidate',
    mapsToCluster: 'CL-MNMT-ADVERSARIAL',
    note: 'electronics domain',
  },
  {
    scenarioId: 'STA-0030',
    transformationType: 'adversarial_false_merge_candidate',
    mapsToCluster: 'CL-MNMT-ADVERSARIAL',
    note: 'culinary domain cross-check',
  },
  { scenarioId: 'STA-0008', transformationType: 'contradiction', mapsToCluster: 'CL-CONTRADICTION' },
  { scenarioId: 'STA-0009', transformationType: 'qualification', mapsToCluster: 'CL-SCOPE-QUALIFIER' },
  {
    scenarioId: 'STA-0013',
    transformationType: 'irrelevant_near_neighbor',
    mapsToCluster: 'CL-SUBSUMED-REJECT',
    note: 'Statistical FM pattern is SUBSUMED not EQUIVALENT',
  },
  { scenarioId: 'STA-0015', transformationType: 'emerging_process_revalidation', mapsToCluster: 'CL-REVALIDATION' },
  {
    scenarioId: 'STA-0040',
    transformationType: 'contradiction',
    mapsToCluster: 'CL-CONTRADICTION',
    note: 'second contradiction draw',
  },
  {
    scenarioId: 'STA-0062',
    transformationType: 'adversarial_false_merge_candidate',
    mapsToCluster: 'CL-EQUIV-REUSE',
    note: 'recurrence check across stat grid',
  },
];

function buildInvestigationMatrix(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const obsStandard = [
    { observation: 'full_ranked_retrieval_list', availability: 'C' },
    { observation: 'retrieval_scores', availability: 'C' },
    { observation: 'primary_match_label_and_id', availability: 'C' },
    { observation: 'candidate_representation', availability: 'B' },
    { observation: 'adjudication_class_confidence_rationale', availability: 'C' },
    { observation: 'policy_action_inputs', availability: 'B' },
  ];

  for (const id of TIER0) {
    rows.push({
      scenarioId: id,
      suite: 'anchor',
      priority: 'P0-tier0',
      clusters: CLUSTER_DEFS.filter((c) => c.scenarioIds.includes(id)).map((c) => c.clusterId),
      reasonSelected: 'Mandatory Tier 0 / MNMT per Handover 04',
      competingHypotheses: [
        'HYP-H42-RETRIEVAL-TOP1',
        'HYP-H42-ADJ-DETERMINISTIC-COLLAPSE',
        'HYP-H42-REPRESENTATION-INSUFFICIENT',
        ...(id === 'ANC-0018' || id === 'ANC-0019' || id === 'ANC-0020' || id === 'ANC-0031'
          ? ['HYP-H42-MNMT-BENCHMARK-ONLY']
          : []),
      ],
      controlScenarioId:
        id === 'ANC-0031'
          ? 'ANC-0038'
          : id === 'ANC-0017'
            ? 'ANC-0034'
            : id === 'ANC-0018'
              ? 'ANC-0035'
              : null,
      reproductionRequired: true,
      debugRequired: true,
      requiredObservations: obsStandard,
      expectedDiagnosticValue: 'Establish first divergence layer for critical safety cluster',
      h4oRequired: false,
      mnmtBatchNote:
        id === 'ANC-0018' || id === 'ANC-0019' || id === 'ANC-0020'
          ? 'Three controlled variants (0018/0020 electronics, 0019 culinary); separate INV records; shared Debug checklist acceptable'
          : undefined,
    });
  }

  for (const rep of ORDINARY_REPRESENTATIVES) {
    rows.push({
      scenarioId: rep.scenarioId,
      suite: 'anchor',
      priority: 'P1-representative',
      clusters: rep.clusters,
      reasonSelected: rep.diagnosticValue,
      competingHypotheses: [
        'HYP-H42-RETRIEVAL-TOP1',
        'HYP-H42-ADJ-DETERMINISTIC-COLLAPSE',
        'HYP-H42-REPRESENTATION-INSUFFICIENT',
        'HYP-H42-POLICY-MANIFESTATION',
      ],
      controlScenarioId: rep.controlScenarioId,
      reproductionRequired: true,
      debugRequired: true,
      requiredObservations: obsStandard,
      expectedDiagnosticValue: rep.diagnosticValue,
      h4oRequired: false,
    });
  }

  for (const c of CONTROL_SCENARIOS.filter((x) => x.scenarioId.startsWith('ANC-'))) {
    rows.push({
      scenarioId: c.scenarioId,
      suite: 'anchor',
      priority: 'P2-control',
      clusters: ['control'],
      reasonSelected: c.note,
      competingHypotheses: ['HYP-H42-ADJ-DETERMINISTIC-COLLAPSE', 'HYP-H42-REPRESENTATION-INSUFFICIENT'],
      controlScenarioId: null,
      pairsWithFailures: c.pairsWith,
      reproductionRequired: true,
      debugRequired: true,
      requiredObservations: obsStandard,
      expectedDiagnosticValue: 'Contrast signal present in pass but absent in paired failure',
      h4oRequired: false,
    });
  }

  for (const d of CHL_DEFERRAL_SAMPLE) {
    rows.push({
      scenarioId: d.scenarioId,
      suite: 'challenge',
      priority: 'P2-deferral-sample',
      clusters: ['CHL-UNNECESSARY-DEFERRAL'],
      reasonSelected: `Stratified defer_human unnecessary_deferral (${d.transformationType})`,
      competingHypotheses: [
        'confidence_behavior',
        'adjudication_uncertainty',
        'policy_routing',
        'insufficient_evidence',
      ],
      controlScenarioId: 'CHL-0004',
      reproductionRequired: true,
      debugRequired: true,
      requiredObservations: [
        ...obsStandard,
        { observation: 'why_DISTINCT_not_defer_human', availability: 'C' },
      ],
      expectedDiagnosticValue: 'Separate appropriate refusal from over-conservative DISTINCT',
      h4oRequired: false,
    });
  }

  for (const s of STAT_FM_SAMPLE) {
    rows.push({
      scenarioId: s.scenarioId,
      suite: 'statistical',
      priority: 'P3-stat-crosscheck',
      clusters: [s.mapsToCluster],
      reasonSelected: `Cross-suite check for ${s.mapsToCluster}`,
      competingHypotheses: ['HYP-H42-ADJ-DETERMINISTIC-COLLAPSE', 'HYP-H42-RETRIEVAL-TOP1'],
      controlScenarioId: null,
      reproductionRequired: true,
      debugRequired: false,
      requiredObservations: obsStandard,
      expectedDiagnosticValue:
        'After Anchor INV pattern known, confirm mechanism recurrence without per-scenario Debug unless discrepancy',
      h4oRequired: false,
    });
  }

  rows.push({
    scenarioId: 'ANC-0002',
    suite: 'anchor',
    priority: 'P2-missed-match-contrast',
    clusters: ['missed_match_contrast'],
    reasonSelected: 'missed_match vs pass ANC-0001 — over-conservative DISTINCT',
    competingHypotheses: ['HYP-H42-ADJ-DETERMINISTIC-COLLAPSE'],
    controlScenarioId: 'ANC-0001',
    reproductionRequired: true,
    debugRequired: true,
    requiredObservations: obsStandard,
    expectedDiagnosticValue: 'Contrast false-merge vs missed-match threshold behavior',
    h4oRequired: false,
  });

  return rows;
}

function main(): void {
  verifyImmutability();
  mkdirSync(h42Root, { recursive: true });

  const anchorPack = loadJson('benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json');
  const anchorRun = loadJson(
    'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json',
  );
  const statRun = loadJson('experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-STAT-002.json');
  const challengeRun = loadJson(
    'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-CHALLENGE-002.json',
  );
  const challengePack = loadJson('benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.json');
  const statPack = loadJson('benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json');

  const packById = new Map(
    (anchorPack.scenarios as Record<string, unknown>[]).map((s) => [s.scenarioId as string, s]),
  );
  const seeds = anchorPack.canonicalSeedMaterial as Array<{
    seedId: string;
    label: string;
    statement?: string;
  }>;
  const seedById = new Map(seeds.map((s) => [s.seedId, s]));

  const rows = buildAnchorRows(anchorRun, packById);
  const fmIds = (anchorRun.scenarios as Record<string, unknown>[])
    .filter((s) => s.failureClassification === 'false_merge')
    .map((s) => s.scenarioId as string)
    .sort();

  const clusterRegistry = CLUSTER_DEFS.map((c) => ({
    ...c,
    memberCount: c.scenarioIds.length,
    members: c.scenarioIds.map((id) => rows.get(id)),
  }));

  const fmToClusters: Record<string, string[]> = {};
  for (const id of fmIds) {
    fmToClusters[id] = CLUSTER_DEFS.filter((c) => c.scenarioIds.includes(id)).map((c) => c.clusterId);
  }

  const mnmtAnalysis = ['ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'].map((id) => {
    const p = packById.get(id)!;
    const r = rows.get(id)!;
    const bans = (p.mustNotMatchIdentities as Array<{ seedId: string }>) ?? [];
    const forbidden = bans.map((b) => {
      const seed = seedById.get(b.seedId);
      return {
        seedId: b.seedId,
        seedLabel: seed?.label,
        seedStatement: seed?.statement,
      };
    });
    const candidateText = (p.directCandidate as { text?: string })?.text ?? '';
    const literalOverlapWithForbiddenLabel = forbidden.some(
      (f) => f.seedLabel && candidateText.toLowerCase() === f.seedLabel.toLowerCase(),
    );
    return {
      scenarioId: id,
      expectedSemanticPreservation:
        'Benchmark expects related_distinct (not equivalent) relative to corpus; mustNotMatch forbids merge to listed seed',
      candidateText,
      forbidden,
      matchedSeed: r.matchedSeed,
      distinguishingInfoInCandidateVsSeed: {
        candidateEqualsForbiddenLabel: literalOverlapWithForbiddenLabel,
        seedStatementRicherThanCandidate: forbidden.some(
          (f) => f.seedStatement && f.seedStatement.length > candidateText.length,
        ),
        mustNotMatchVisibleToPipeline: false,
        note: 'projection excludes mustNotMatchIdentities (forbidden-keys); static code review',
      },
      representationSufficiencyQuestion:
        literalOverlapWithForbiddenLabel
          ? 'If only candidate label is presented, distinguishing semantics may be insufficient without extra context'
          : 'Candidate differs from forbidden label text — investigate qualifier/structure in H4.3',
      negativeIdentityConclusion: 'not_determined_pending_h4_3',
    };
  });

  const chlPackById = new Map(
    (challengePack.scenarios as Record<string, unknown>[]).map((s) => [s.scenarioId as string, s]),
  );
  const deferrals = (challengeRun.scenarios as Record<string, unknown>[]).filter(
    (s) => s.failureClassification === 'unnecessary_deferral',
  );
  const deferStrat = {
    total: deferrals.length,
    allExpectedDecisionClass: 'defer_human',
    allActualDecisionClass: 'DISTINCT',
    byDomain: {} as Record<string, number>,
    byExecutionMode: {} as Record<string, number>,
    byTransformationType: {} as Record<string, number>,
    byPolicyAction: {} as Record<string, number>,
    appropriateDeferPassCount: challengeRun.scenarios
      ? (challengeRun.scenarios as Record<string, unknown>[]).filter((s) => {
          const p = chlPackById.get(s.scenarioId as string);
          return p?.expectedDecisionClass === 'defer_human' && s.outcome === 'pass';
        }).length
      : 0,
    h43Sample: CHL_DEFERRAL_SAMPLE,
    staticHypothesisBuckets: [
      'confidence_behavior',
      'adjudication_uncertainty',
      'policy_routing',
      'insufficient_evidence',
      'challenge_construction',
      'scorer_expectation_mismatch',
    ],
    controlCandidates: [
      {
        scenarioId: 'CHL-0004',
        note: 'Challenge related_distinct pass — CKES did not defer when deferral not expected',
      },
      {
        scenarioId: 'ANC-0026',
        note: 'Anchor unnecessary_deferral — defer transformation on Anchor pack',
      },
    ],
  };
  for (const s of deferrals) {
    const id = s.scenarioId as string;
    const p = chlPackById.get(id);
    const dom = (p?.domain as string) ?? 'unknown';
    deferStrat.byDomain[dom] = (deferStrat.byDomain[dom] ?? 0) + 1;
    const mode = s.executionMode as string;
    deferStrat.byExecutionMode[mode] = (deferStrat.byExecutionMode[mode] ?? 0) + 1;
    const tr = (p?.transformationType as string) ?? 'unknown';
    deferStrat.byTransformationType[tr] = (deferStrat.byTransformationType[tr] ?? 0) + 1;
    const pol = (
      (s.scoring as Record<string, unknown>)?.expectedVersusActual as Record<string, unknown>
    )?.policyAction as string;
    if (pol) deferStrat.byPolicyAction[pol] = (deferStrat.byPolicyAction[pol] ?? 0) + 1;
  }

  const statPackById = new Map(
    (statPack.scenarios as Record<string, unknown>[]).map((s) => [s.scenarioId as string, s]),
  );
  const statSampleValidated = STAT_FM_SAMPLE.map((s) => {
    const runSc = (statRun.scenarios as Record<string, unknown>[]).find(
      (x) => x.scenarioId === s.scenarioId,
    );
    return {
      ...s,
      domain: statPackById.get(s.scenarioId)?.domain,
      failureClassification: runSc?.failureClassification,
      actualDecisionClass: runSc?.actualDecisionClass,
    };
  });

  const observability = {
    legend: {
      A: 'available through normal Debug inspection at H4.3',
      B: 'available through existing artifacts/code (read-only)',
      C: 'unavailable without disposable local tracing during repro',
      D: 'requires persistent instrumentation (H4.O)',
    },
    anchorFmInvestigations: {
      defaultRequired: [
        { observation: 'hybridRetrieve full matches[]', availability: 'C', h4oIfPersistent: false },
        { observation: 'matches[0] only used in adjudicateSemantic', availability: 'B', source: 'adjudication.ts' },
        { observation: 'deterministic EQUIVALENT on score>=0.95 or label equality', availability: 'B', source: 'adjudication.ts' },
        { observation: 'mustNotMatchIdentities not in pipeline projection', availability: 'B', source: 'forbidden-keys.ts' },
        { observation: 'adjudication rationale in run JSON', availability: 'D', h4oIfPersistent: true },
        { observation: 'retrieval scores in run JSON', availability: 'D', h4oIfPersistent: true },
      ],
    },
    proposedH4oTriggers: [
      {
        trigger: 'If architect requires ranked retrieval persisted in run artifacts for all suites',
        category: 'D',
        gate: 'H4.O',
      },
    ],
  };

  const tier0MnmtStrategy = {
    tier0: TIER0,
    mnmtTriple: ['ANC-0018', 'ANC-0019', 'ANC-0020'],
    assessment:
      'Three independent diagnostic cases AND controlled variants of one mechanism (adversarial + literal label overlap + scorer-only mustNotMatch). ANC-0031 adds second MNMT on culinary Rest meat vs CK-CUL-09.',
    debugEfficiency:
      'Single shared checklist for adversarial MNMT triple; record separate INV-* per scenario; vary domain/seed in notes',
  };

  const missedMatchRelevance = ['ANC-0002', 'ANC-0006', 'ANC-0010', 'ANC-0014'].map((id) => ({
    scenarioId: id,
    failureClassification: 'missed_match',
    row: rows.get(id),
    h42Role: 'Contrast over-conservative DISTINCT vs false-merge hypotheses; optional P2 Debug with pass control',
  }));

  const investigationMatrix = buildInvestigationMatrix();

  const summary = {
    gate: 'H4.2',
    generatedAt: new Date().toISOString(),
    anchorFalseMergeCount: fmIds.length,
    clusterCount: CLUSTER_DEFS.length,
    fmToClusters,
    tier0MnmtStrategy,
    ordinaryRepresentativeIds: ORDINARY_REPRESENTATIVES.map((r) => r.scenarioId),
    controlScenarioIds: CONTROL_SCENARIOS.map((c) => c.scenarioId),
    investigationMatrixRowCount: investigationMatrix.length,
    debugRequiredRowCount: investigationMatrix.filter((r) => r.debugRequired).length,
    immutabilityVerification: { passed: true },
    newBenchmarkRuns: false,
    debugModeUsed: false,
    ckesBehavioralChanges: false,
    rootCauseEstablished: false,
  };

  writeFileSync(
    join(h42Root, 'H42-ANCHOR-FM-CLUSTER-REGISTRY.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', clusters: clusterRegistry, fmToClusters }, null, 2),
  );
  writeFileSync(
    join(h42Root, 'H42-COMPETING-HYPOTHESES.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', hypotheses: HYPOTHESES }, null, 2),
  );
  writeFileSync(
    join(h42Root, 'H42-CONTROL-SCENARIOS.json'),
    JSON.stringify(
      { schemaVersion: '1.0.0', gate: 'H4.2', controls: CONTROL_SCENARIOS, missedMatchRelevance },
      null,
      2,
    ),
  );
  writeFileSync(
    join(h42Root, 'H42-MNMT-CLUSTER-ANALYSIS.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', scenarios: mnmtAnalysis, tier0MnmtStrategy }, null, 2),
  );
  writeFileSync(
    join(h42Root, 'H42-CHL-DEFERRAL-STRATIFICATION.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', ...deferStrat }, null, 2),
  );
  writeFileSync(
    join(h42Root, 'H42-STAT-SUPPORTING-SAMPLE.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', purpose: 'cross_suite_mechanism_check', sample: statSampleValidated }, null, 2),
  );
  writeFileSync(
    join(h42Root, 'H42-OBSERVABILITY-ASSESSMENT.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', ...observability }, null, 2),
  );
  writeFileSync(
    join(h42Root, 'H42-INVESTIGATION-MATRIX.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.2', investigations: investigationMatrix }, null, 2),
  );
  writeFileSync(join(h42Root, 'H42-SUMMARY.json'), JSON.stringify(summary, null, 2));

  const readme = readFileSync(join(forensicsRoot, 'README.md'), 'utf8');
  if (!readme.includes('h42/')) {
    writeFileSync(
      join(forensicsRoot, 'README.md'),
      `${readme.trim()}

## H4.2 (clustering)

- \`h42/H42-ANCHOR-FM-CLUSTER-REGISTRY.json\`
- \`h42/H42-INVESTIGATION-MATRIX.json\`
- Report: \`docs/Development/Handover_04_H42_Causal_Clustering_Report.md\`
`,
    );
  }

  console.log('H4.2 clustering OK', {
    clusters: CLUSTER_DEFS.length,
    matrix: investigationMatrix.length,
    fm: fmIds.length,
  });
}

main();
