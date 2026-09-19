/**
 * H4.4 — synthesize H4.1–H4.3 artifacts (no runs, no CKES changes).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePackContentHash } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const h44Root = join(pocRoot, 'experiments/forensics/h44');

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

type FmStatus =
  | 'established_direct_inv'
  | 'strong_transfer_same_adjudication_branch'
  | 'provisional_transfer'
  | 'unresolved';

const INV_DIRECT = new Set([
  'ANC-0017',
  'ANC-0018',
  'ANC-0019',
  'ANC-0020',
  'ANC-0031',
  'ANC-0023',
  'ANC-0024',
  'ANC-0027',
  'ANC-0029',
  'ANC-0035',
  'ANC-0040',
]);

const RECONCILIATION: Array<{
  scenarioId: string;
  semanticFailureType: string;
  adjudicationClass: string;
  policyAction: string;
  mechanismBranch: 'deterministic_equivalent' | 'deterministic_subsumed';
  status: FmStatus;
  primaryMechanism: string;
  evidenceRefs: string[];
  transferFrom?: string;
}> = [
  {
    scenarioId: 'ANC-0017',
    semanticFailureType: 'related_distinct_after_extraction',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0017', 'INV-ANC-0017'],
  },
  {
    scenarioId: 'ANC-0018',
    semanticFailureType: 'adversarial_mnmt_label_identity',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0018', 'INV-ANC-0018', 'MNMT-ANC-0018'],
  },
  {
    scenarioId: 'ANC-0019',
    semanticFailureType: 'adversarial_mnmt_label_identity',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0019', 'INV-ANC-0019', 'MNMT-ANC-0019'],
  },
  {
    scenarioId: 'ANC-0020',
    semanticFailureType: 'adversarial_mnmt_label_identity',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0020', 'INV-ANC-0020', 'MNMT-ANC-0020'],
  },
  {
    scenarioId: 'ANC-0031',
    semanticFailureType: 'adversarial_mnmt_related_distinct',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0031', 'INV-ANC-0031', 'MNMT-ANC-0031'],
  },
  {
    scenarioId: 'ANC-0023',
    semanticFailureType: 'contradiction_as_subsumption',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0023', 'INV-ANC-0023'],
  },
  {
    scenarioId: 'ANC-0024',
    semanticFailureType: 'qualification_as_equivalence',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0024', 'INV-ANC-0024'],
  },
  {
    scenarioId: 'ANC-0025',
    semanticFailureType: 'revalidation_as_subsumption',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0025'],
    transferFrom: 'ANC-0027',
  },
  {
    scenarioId: 'ANC-0027',
    semanticFailureType: 'objective_to_method_subsumed',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0027', 'INV-ANC-0027', 'INV-ANC-0038'],
  },
  {
    scenarioId: 'ANC-0028',
    semanticFailureType: 'method_to_objective_equivalent',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0028'],
    transferFrom: 'ANC-0040',
  },
  {
    scenarioId: 'ANC-0029',
    semanticFailureType: 'compound_assertion_subsumed',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0029', 'INV-ANC-0029'],
  },
  {
    scenarioId: 'ANC-0032',
    semanticFailureType: 'revalidation_as_equivalence',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0032'],
    transferFrom: 'ANC-0019',
  },
  {
    scenarioId: 'ANC-0033',
    semanticFailureType: 'paraphrase_related_distinct_subsumed',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0033'],
    transferFrom: 'ANC-0029',
  },
  {
    scenarioId: 'ANC-0035',
    semanticFailureType: 'narrow_applicability_subsumed',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0035', 'INV-ANC-0035', 'INV-ANC-0018'],
  },
  {
    scenarioId: 'ANC-0036',
    semanticFailureType: 'broaden_applicability_equivalent',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0036'],
    transferFrom: 'ANC-0024',
  },
  {
    scenarioId: 'ANC-0037',
    semanticFailureType: 'subject_object_context_subsumed',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0037'],
    transferFrom: 'ANC-0029',
  },
  {
    scenarioId: 'ANC-0039',
    semanticFailureType: 'method_to_objective_subsumed',
    adjudicationClass: 'SUBSUMED_BY_EXISTING',
    policyAction: 'reject_new_identity',
    mechanismBranch: 'deterministic_subsumed',
    status: 'strong_transfer_same_adjudication_branch',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0039'],
    transferFrom: 'ANC-0027',
  },
  {
    scenarioId: 'ANC-0040',
    semanticFailureType: 'supporting_observation_equivalent',
    adjudicationClass: 'EQUIVALENT',
    policyAction: 'reuse_existing',
    mechanismBranch: 'deterministic_equivalent',
    status: 'established_direct_inv',
    primaryMechanism: 'adjudication_collapse',
    evidenceRefs: ['FM-ANC-0040', 'INV-ANC-0040', 'INV-ANC-0030'],
  },
];

function main(): void {
  const errors: string[] = [];
  const anchorRunPath = join(
    pocRoot,
    'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json',
  );
  if (sha256File(anchorRunPath) !== IMMUTABILITY.anchorRunHash) errors.push('anchor run');
  const statPath = join(
    pocRoot,
    'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-STAT-002.json',
  );
  if (sha256File(statPath) !== IMMUTABILITY.statRunHash) errors.push('stat run');
  const chlPath = join(
    pocRoot,
    'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-CHALLENGE-002.json',
  );
  if (sha256File(chlPath) !== IMMUTABILITY.challengeRunHash) errors.push('challenge run');
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
    console.error('Immutability FAILED', errors);
    process.exit(1);
  }

  mkdirSync(h44Root, { recursive: true });

  const quant = {
    anchorFalseMergeCount: 18,
    byStatus: RECONCILIATION.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    byMechanismBranch: RECONCILIATION.reduce(
      (acc, r) => {
        acc[r.mechanismBranch] = (acc[r.mechanismBranch] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    primaryMechanism: { adjudication_collapse: 18 },
    contributing: {
      retrieval_exact_or_fuzzy_match: 18,
      candidate_label_only_representation: 16,
      extraction_normalization_anc_0017: 1,
      policy_downstream_manifestation_only: 10,
    },
    unresolved: 0,
    directInvCount: INV_DIRECT.size,
  };

  const layerOwnership = {
    gate: 'H4.4',
    scope: 'Reference Baseline 001 REF-CLEAN deterministic_ai_off deterministic_fixture',
    layers: [
      {
        layer: 'benchmark_projection',
        observedRole: 'Allowlists pipeline fields; excludes mustNotMatch and expected classes',
        establishedLimitation: 'Benchmark-only relationship constraints not visible to CKES',
        evidence: 'forbidden-keys.ts; H4.3 INV traces',
        confidence: 'high',
        downstreamEffects: 'Scorer applies MNMT post-hoc',
        openQuestions: 'Whether future projection should carry structured qualifiers',
      },
      {
        layer: 'candidate_construction',
        observedRole: 'directCandidate.text or full_pipeline extraction to concept string',
        establishedLimitation: 'ANC-0017 extraction strips to technique label; qualifiers often absent',
        evidence: 'INV-ANC-0017 extractionTrace',
        confidence: 'high',
        downstreamEffects: 'Impoverished adjudication input',
        openQuestions: 'Whether pack fields (applicability) should project in future designs',
      },
      {
        layer: 'canonical_representation',
        observedRole: 'Seed label + statement stored in DB description',
        establishedLimitation: 'Deterministic adjudication does not consume statement text',
        evidence: 'INV-ANC-0018 dbConceptDescription vs adjudication rationale',
        confidence: 'high',
        downstreamEffects: 'Richer corpus semantics unused at adjudication',
        openQuestions: 'AI adjudication prompt partial text only (not tested in RB001)',
      },
      {
        layer: 'retrieval',
        observedRole: 'hybridRetrieve ranks by exact/fuzzy label similarity',
        establishedLimitation: 'Returns plausible top match; not proven wrong for RB001 FMs',
        evidence: 'INV traces ranked lists',
        confidence: 'medium',
        downstreamEffects: 'Supplies matches[0] to adjudication',
        openQuestions: 'Whether alternate rank would change outcome without adjudication fix',
      },
      {
        layer: 'top_1_selection',
        observedRole: 'adjudicateSemantic uses matches[0] only',
        establishedLimitation: 'Architectural constraint; not established as root cause in H4.3',
        evidence: 'decision-slice.ts; no multi-candidate experiments run',
        confidence: 'high_for_constraint_low_for_remediation',
        downstreamEffects: 'Single comparison identity',
        openQuestions: 'Hypothesis only: multi-match adjudication might help some families',
      },
      {
        layer: 'adjudication',
        observedRole: 'Deterministic label/score rules under REF-CLEAN',
        establishedLimitation: 'EQUIVALENT on equality/high score; SUBSUMED at score≥0.7',
        evidence: 'adjudication.ts; all Tier0 INV',
        confidence: 'high',
        downstreamEffects: 'Incorrect merge classes for benchmark semantics',
        openQuestions: 'Behavior under live LLM adjudication not characterized in RB001',
      },
      {
        layer: 'confidence',
        observedRole: 'Fixed high confidence on deterministic branches',
        establishedLimitation: 'Does not reflect semantic uncertainty in Challenge defer cases',
        evidence: 'INV-CHL-* DISTINCT 0.9',
        confidence: 'medium',
        downstreamEffects: 'Policy does not defer on confidence for DISTINCT',
        openQuestions: 'Calibration under AI mode',
      },
      {
        layer: 'policy',
        observedRole: 'Maps adjudication class to action',
        establishedLimitation: 'Faithful executor for incorrect adjudication (FM); DISTINCT→evaluate not defer',
        evidence: 'cals-policy.v1.json; INV policy blocks',
        confidence: 'high',
        downstreamEffects: 'reuse_existing / evaluate_new_identity manifestations',
        openQuestions: 'Governance mapping for defer_human expectations',
      },
      {
        layer: 'scorer_evaluation',
        observedRole: 'Compares terminal class/policy to pack expectations',
        establishedLimitation: 'Surfaces false_merge and unnecessary_deferral',
        evidence: 'RB001 derived reports',
        confidence: 'high',
        downstreamEffects: 'Measurement only',
        openQuestions: 'n/a',
      },
    ],
  };

  writeFileSync(
    join(h44Root, 'H44-ANCHOR-18FM-RECONCILIATION.json'),
    JSON.stringify({ schemaVersion: '1.0.0', gate: 'H4.4', scenarios: RECONCILIATION }, null, 2),
  );
  writeFileSync(join(h44Root, 'H44-MECHANISM-QUANTIFICATION.json'), JSON.stringify(quant, null, 2));
  writeFileSync(join(h44Root, 'H44-LAYER-OWNERSHIP.json'), JSON.stringify(layerOwnership, null, 2));
  writeFileSync(
    join(h44Root, 'H44-IMMUTABILITY.json'),
    JSON.stringify({ passed: true, checkedAt: new Date().toISOString(), ...IMMUTABILITY }, null, 2),
  );

  const synthesisIndex = {
    gate: 'H4.4',
    generatedAt: new Date().toISOString(),
    report: 'docs/Development/Handover_04_Forensic_Analysis_Report.md',
    inputs: ['H4.1 inventory', 'H4.2 clustering', 'H4.3 INV artifacts'],
    artifacts: [
      'H44-ANCHOR-18FM-RECONCILIATION.json',
      'H44-MECHANISM-QUANTIFICATION.json',
      'H44-LAYER-OWNERSHIP.json',
    ],
    h45NotStarted: true,
    ckesRemediation: false,
  };
  writeFileSync(join(h44Root, 'H44-SYNTHESIS-INDEX.json'), JSON.stringify(synthesisIndex, null, 2));
  console.log('H4.4 synthesis OK', quant);
}

main();
