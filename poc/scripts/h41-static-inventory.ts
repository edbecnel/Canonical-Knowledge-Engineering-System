/**
 * H4.1 — static forensic inventory from immutable RB001 evidence (no new runs).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePackContentHash } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const repoRoot = join(pocRoot, '..');
const forensicsRoot = join(pocRoot, 'experiments/forensics');

const IMMUTABILITY = {
  anchorPackContentHash: '2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c',
  anchorRunHash: 'c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573',
  statRunHash: '46da0ab91b9fd5971f38121b0dc51de7622bd0d30c6afa979f677220e6ae0464',
  challengeRunHash: '3b07c3a6d9477cf6be89bb38fd8ad687a3c37fcf5d38d3f236a7c689302f9f5a',
  manifestSha256: '67ff15095e9b8d1ee5fb22a99412b0407a3de8e19bea123ff5abef32ff55bae0',
  designationSidecarFileHash: '0e085fefa4d1d59645fc82f4c480cf629ff9d2721e13c299a7a3e58ca4a967a2',
};

function sha256File(abs: string): string {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

function loadJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(pocRoot, rel), 'utf8')) as Record<string, unknown>;
}

function provisionalCausalFromStatic(
  packSc: Record<string, unknown>,
  runSc: Record<string, unknown>,
): {
  suspectedFirstDivergenceLayer: string;
  primaryCausalCategory: string;
  contributingCausalCategories: string[];
  diagnosisConfidence: 'high' | 'medium' | 'low';
  debugInvestigationRequired: boolean;
  evidenceGaps: string[];
} {
  const gaps: string[] = [
    'full_retrieval_ranked_candidates',
    'adjudication_confidence_and_rationale',
    'adjudication_prompt_payload',
    'policy_input_confidence',
  ];
  const expected = packSc.expectedDecisionClass as string;
  const actual = runSc.actualDecisionClass as string;
  const policy = (runSc.scoring as Record<string, unknown>)?.expectedVersusActual as Record<
    string,
    unknown
  >;
  const policyAction = policy?.policyAction as string | undefined;
  const cap = runSc.evaluationCapture as Record<string, unknown> | undefined;

  const contributing: string[] = [];
  let primary = 'unknown_unresolved';
  let layer = 'unknown_unresolved';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let debugRequired = true;

  if (runSc.failureClassification === 'false_merge') {
    layer = 'decision_slice_outcome_or_scorer_visible';
    contributing.push('evaluation_scorer_manifestation_only');
    if (actual === 'EQUIVALENT' || actual === 'SUBSUMED_BY_EXISTING' || actual === 'EXTENDS_EXISTING') {
      contributing.push('adjudication_merge_class_emitted');
      if (policyAction && ['admit', 'reuse_existing', 'extend_or_evidence'].includes(policyAction)) {
        contributing.push('policy_merge_action_emitted');
      }
    }
    if (cap?.benchmarkLocalSeedId) {
      const bans = (packSc.mustNotMatchIdentities ?? []) as Array<{ seedId: string }>;
      if (bans.some((b) => b.seedId === cap.benchmarkLocalSeedId)) {
        contributing.push('matched_forbidden_benchmark_seed');
        confidence = 'medium';
      }
    }
    if (expected === 'related_distinct' && actual === 'EQUIVALENT') {
      primary = 'unknown_unresolved';
      confidence = 'low';
    }
  }

  return {
    suspectedFirstDivergenceLayer: layer,
    primaryCausalCategory: primary,
    contributingCausalCategories: contributing,
    diagnosisConfidence: confidence,
    debugInvestigationRequired: debugRequired,
    evidenceGaps: gaps,
  };
}

function main(): void {
  const immErrors: string[] = [];
  const anchorRunPath = join(pocRoot, 'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json');
  if (sha256File(anchorRunPath) !== IMMUTABILITY.anchorRunHash) immErrors.push('anchor run');
  const manifestPath = join(pocRoot, 'experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { manifestSha256: string };
  if (manifest.manifestSha256 !== IMMUTABILITY.manifestSha256) immErrors.push('manifest');
  const anchorPack = loadJson('benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json');
  if (computePackContentHash(anchorPack) !== IMMUTABILITY.anchorPackContentHash) immErrors.push('anchor pack');
  const desPath = join(pocRoot, 'experiments/reference-designations/reference_baseline_001.json');
  if (sha256File(desPath) !== IMMUTABILITY.designationSidecarFileHash) immErrors.push('designation');

  if (immErrors.length) {
    console.error('Immutability FAILED:', immErrors);
    process.exit(1);
  }

  const anchorRun = loadJson('experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json');
  const statRun = loadJson('experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-STAT-002.json');
  const challengeRun = loadJson('experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-CHALLENGE-002.json');
  const statPack = loadJson('benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json');
  const challengePack = loadJson('benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.json');

  const packById = new Map(
    (anchorPack.scenarios as Record<string, unknown>[]).map((s) => [s.scenarioId as string, s]),
  );

  mkdirSync(join(forensicsRoot, 'anchor-false-merges'), { recursive: true });
  mkdirSync(join(forensicsRoot, 'must-not-match'), { recursive: true });
  mkdirSync(join(forensicsRoot, 'supporting-suites'), { recursive: true });

  const falseMerges = (anchorRun.scenarios as Record<string, unknown>[]).filter(
    (s) => s.failureClassification === 'false_merge',
  );
  const fmRecords: string[] = [];

  for (const runSc of falseMerges) {
    const id = runSc.scenarioId as string;
    const packSc = packById.get(id)!;
    const cap = runSc.evaluationCapture as Record<string, unknown> | undefined;
    const prov = provisionalCausalFromStatic(packSc, runSc);
    const record = {
      schemaVersion: '1.0.0',
      recordKind: 'FM-ANC',
      gate: 'H4.1',
      scenarioId: id,
      expectedSemanticOutcome: packSc.expectedDecisionClass,
      actualOutcome: runSc.outcome,
      actualDecisionClass: runSc.actualDecisionClass,
      failureClassification: runSc.failureClassification,
      policyAction: (runSc.scoring as Record<string, unknown>)?.expectedVersusActual
        ? ((runSc.scoring as Record<string, unknown>).expectedVersusActual as Record<string, unknown>)
            .policyAction
        : undefined,
      actualMatchedIdentity: cap
        ? {
            benchmarkLocalSeedId: cap.benchmarkLocalSeedId,
            canonicalLabel: (cap.evaluationMatchedIdentityRef as Record<string, unknown>)
              ?.canonicalLabel,
            canonicalId: (cap.evaluationMatchedIdentityRef as Record<string, unknown>)?.canonicalId,
            identityEvidenceStatus: cap.identityEvidenceStatus,
          }
        : null,
      packContext: {
        transformationType: packSc.transformationType,
        domain: packSc.domain,
        executionMode: packSc.executionMode,
        failureSeverity: packSc.failureSeverity,
        mustNotMatchIdentities: packSc.mustNotMatchIdentities,
        expectedIdentity: packSc.expectedIdentity,
      },
      ...prov,
      supportingEvidenceRef: `poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json#${id}`,
      notes: 'H4.1 static only; causal categories provisional unless noted.',
    };
    const out = join(forensicsRoot, 'anchor-false-merges', `FM-${id}.json`);
    writeFileSync(out, JSON.stringify(record, null, 2));
    fmRecords.push(id);
  }

  const mnmtIds = ['ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'];
  for (const id of mnmtIds) {
    const runSc = (anchorRun.scenarios as Record<string, unknown>[]).find((s) => s.scenarioId === id)!;
    const packSc = packById.get(id)!;
    const cap = runSc.evaluationCapture as Record<string, unknown> | undefined;
    const ref = cap?.evaluationMatchedIdentityRef as Record<string, unknown> | undefined;
    const record = {
      schemaVersion: '1.0.0',
      recordKind: 'MNMT-ANC',
      gate: 'H4.1',
      scenarioId: id,
      mustNotMatchTargets: packSc.mustNotMatchIdentities,
      candidateFromPack: packSc.directCandidate,
      expectedDecisionClass: packSc.expectedDecisionClass,
      actualDecisionClass: runSc.actualDecisionClass,
      policyAction: (runSc.scoring as Record<string, unknown>)?.expectedVersusActual
        ? ((runSc.scoring as Record<string, unknown>).expectedVersusActual as Record<string, unknown>)
            .policyAction
        : undefined,
      matchedIdentityFromEvaluationCapture: ref
        ? {
            present: ref.present,
            canonicalLabel: ref.canonicalLabel,
            canonicalId: ref.canonicalId,
          }
        : null,
      benchmarkLocalSeedId: cap?.benchmarkLocalSeedId,
      identityEvidenceStatus: cap?.identityEvidenceStatus,
      forbiddenSeedMatched:
        cap?.benchmarkLocalSeedId &&
        (packSc.mustNotMatchIdentities as Array<{ seedId: string }>)?.some(
          (m) => m.seedId === cap.benchmarkLocalSeedId,
        ),
      distinguishingSemanticInfoInArtifacts: {
        packStatementFromSeeds: 'see canonicalSeedMaterial for forbidden seed labels',
        candidateText: (packSc.directCandidate as { text?: string })?.text,
        note: 'No explicit negative-equivalence representation in run JSON',
      },
      staticEvidenceAvailable: [
        'immutable run row',
        'evaluationCapture',
        'pack mustNotMatchIdentities',
        'pack directCandidate',
      ],
      representationIssuesObserved: [
        'Run JSON does not expose whether CKES represented must-not-match constraints',
        'Only post-hoc benchmark scorer applied mustNotMatchIdentities rule',
      ],
      evidenceGaps: [
        'retrieval_rank_list',
        'adjudication_rationale',
        'whether pipeline consumed forbidden-identity signal',
      ],
      negativeIdentityMechanismConclusion: 'not_determined_at_h4_1',
      supportingEvidenceRef: `poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json#${id}`,
    };
    writeFileSync(
      join(forensicsRoot, 'must-not-match', `MNMT-${id}.json`),
      JSON.stringify(record, null, 2),
    );
  }

  function aggregateSuite(name: string, run: Record<string, unknown>, pack: Record<string, unknown>) {
    const scenarios = run.scenarios as Record<string, unknown>[];
    const byOutcome: Record<string, number> = {};
    const byFailClass: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    for (const s of scenarios) {
      byOutcome[s.outcome as string] = (byOutcome[s.outcome as string] ?? 0) + 1;
      if (s.failureClassification) {
        byFailClass[s.failureClassification as string] =
          (byFailClass[s.failureClassification as string] ?? 0) + 1;
      }
      byMode[s.executionMode as string] = (byMode[s.executionMode as string] ?? 0) + 1;
    }
    const fm = scenarios.filter((s) => s.failureClassification === 'false_merge').length;
    const defer = scenarios.filter((s) => s.failureClassification === 'unnecessary_deferral').length;
    const unmapped = scenarios.filter(
      (s) =>
        (s.evaluationCapture as Record<string, unknown>)?.identityEvidenceStatus ===
        'present_unmapped',
    ).length;
    return {
      suite: name,
      runId: (run.run as Record<string, unknown>).runId,
      scenarioCount: scenarios.length,
      packReleasedCount: (pack.scenarios as unknown[]).length,
      byOutcome,
      byFailureClassification: byFailClass,
      byExecutionMode: byMode,
      falseMergeCount: fm,
      unnecessaryDeferralCount: defer,
      presentUnmappedCount: unmapped,
      derivedReportPath: `poc/experiments/baseline-evidence/g4-1-official-runs/${(run.run as Record<string, unknown>).runId}.derived-report.json`,
    };
  }

  const statAgg = aggregateSuite('statistical', statRun, statPack);
  const chalAgg = aggregateSuite('challenge', challengeRun, challengePack);
  writeFileSync(
    join(forensicsRoot, 'supporting-suites', 'STAT-002-aggregate.json'),
    JSON.stringify(statAgg, null, 2),
  );
  writeFileSync(
    join(forensicsRoot, 'supporting-suites', 'CHL-002-aggregate.json'),
    JSON.stringify(chalAgg, null, 2),
  );

  const challengeDeferrals = (challengeRun.scenarios as Record<string, unknown>[])
    .filter((s) => s.failureClassification === 'unnecessary_deferral')
    .map((s) => ({
      scenarioId: s.scenarioId,
      actualDecisionClass: s.actualDecisionClass,
      executionMode: s.executionMode,
      policyAction: (s.scoring as Record<string, unknown>)?.expectedVersusActual
        ? ((s.scoring as Record<string, unknown>).expectedVersusActual as Record<string, unknown>)
            .policyAction
        : undefined,
      expectedDecisionClass: (s.scoring as Record<string, unknown>)?.expectedDecisionClass,
    }));

  const chlPackById = new Map(
    (challengePack.scenarios as Record<string, unknown>[]).map((s) => [s.scenarioId as string, s]),
  );
  const deferDimensions = {
    total: challengeDeferrals.length,
    byDomain: challengeDeferrals.reduce(
      (acc, d) => {
        const dom = (chlPackById.get(d.scenarioId as string)?.domain as string) ?? 'unknown';
        acc[dom] = (acc[dom] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    byExecutionMode: challengeDeferrals.reduce(
      (acc, d) => {
        const m = d.executionMode as string;
        acc[m] = (acc[m] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    scenarioIds: challengeDeferrals.map((d) => d.scenarioId),
    staticHypothesesForLater: [
      'confidence_behavior',
      'adjudication_uncertainty',
      'policy_routing',
      'insufficient_evidence',
      'challenge_construction',
      'unknown_unresolved',
    ],
  };
  writeFileSync(
    join(forensicsRoot, 'supporting-suites', 'CHL-002-unnecessary-deferral-inventory.json'),
    JSON.stringify(deferDimensions, null, 2),
  );

  const anchorFailureInventory = (anchorRun.scenarios as Record<string, unknown>[]).map((s) => {
    const id = s.scenarioId as string;
    const packSc = packById.get(id);
    return {
      scenarioId: id,
      outcome: s.outcome,
      failureClassification: s.failureClassification,
      expectedDecisionClass: packSc?.expectedDecisionClass,
      actualDecisionClass: s.actualDecisionClass,
      transformationType: packSc?.transformationType,
      domain: packSc?.domain,
      executionMode: s.executionMode,
    };
  });

  const evidenceGapInventory = {
    schemaVersion: '1.0.0',
    gate: 'H4.1',
    globalGapsNotInImmutableRunJson: [
      'complete_ranked_retrieval_candidates_with_scores',
      'retrieval_method_per_candidate',
      'adjudication_confidence_numeric',
      'adjudication_rationale_text',
      'adjudication_llm_prompt_and_response',
      'policy_confidence_inputs',
      'policy_rule_trace',
      'candidate_full_structured_attributes',
      'intermediate_discovery_extraction_artifacts_for_full_pipeline',
    ],
    perScenarioFlags: falseMerges.map((s) => ({
      scenarioId: s.scenarioId,
      hasEvaluationCapture: Boolean(s.evaluationCapture),
      missingForCausalAttribution: [
        'full_retrieval_rank_list',
        'adjudication_confidence_and_rationale',
      ],
    })),
    informsGates: ['H4.2', 'H4.3', 'H4.O_optional'],
  };
  writeFileSync(
    join(forensicsRoot, 'H41-EVIDENCE-GAP-INVENTORY.json'),
    JSON.stringify(evidenceGapInventory, null, 2),
  );

  const deepInvestigationCandidates = {
    tier0_critical_and_mnmt: ['ANC-0017', 'ANC-0018', 'ANC-0019', 'ANC-0020', 'ANC-0031'],
    allFalseMergesLowConfidenceCausality: fmRecords,
    challengeDeferralSampleSuggestedForH42: challengeDeferrals.slice(0, 10).map((d) => d.scenarioId),
  };
  writeFileSync(
    join(forensicsRoot, 'H41-DEEP-INVESTIGATION-CANDIDATES.json'),
    JSON.stringify(deepInvestigationCandidates, null, 2),
  );

  const summary = {
    gate: 'H4.1',
    generatedAt: new Date().toISOString(),
    anchorFailureCount: anchorFailureInventory.length,
    anchorFalseMergeCount: falseMerges.length,
    fmRecordIds: fmRecords.sort(),
    mnmtRecordIds: mnmtIds,
    anchorFailureInventory,
    immutabilityVerification: { passed: true, checkedAt: new Date().toISOString() },
    newBenchmarkRuns: false,
    debugModeUsed: false,
    ckesBehavioralChanges: false,
  };
  writeFileSync(join(forensicsRoot, 'H41-INVENTORY-SUMMARY.json'), JSON.stringify(summary, null, 2));

  writeFileSync(
    join(forensicsRoot, 'README.md'),
    `# Forensics evidence (Handover 04)

Gate H4.1 static inventory from immutable Reference Baseline 001 evidence.

- \`anchor-false-merges/FM-ANC-*.json\` — 18 false-merge static records
- \`must-not-match/MNMT-*.json\` — four must-not-match inventories
- \`supporting-suites/\` — Statistical/Challenge aggregates
- \`H41-EVIDENCE-GAP-INVENTORY.json\`
- Report: \`docs/Development/Handover_04_H41_Static_Forensic_Inventory_Report.md\`
`,
  );

  console.log('H4.1 inventory OK', { fm: fmRecords.length, mnmt: mnmtIds.length });
}

main();
