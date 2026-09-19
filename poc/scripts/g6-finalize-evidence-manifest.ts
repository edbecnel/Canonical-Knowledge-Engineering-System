/**
 * G6: build evidence manifest + immutability verification (no pack/run mutation).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePackContentHash } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const repoRoot = join(pocRoot, '..');

const EXPECTED = {
  anchorPackContentHash: '2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c',
  statisticalPackContentHash: '5e5d0af0a409548ba0f889f8c0f4d5d96334d2c2412d746a8a535ff057dfcc18',
  challengePackContentHash: '00d339d3c33c09d6c2276ac9222c588d22c1a28d1510b2c310da8da40e954ecc',
  anchorRunHash: 'c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573',
  statRunHash: '46da0ab91b9fd5971f38121b0dc51de7622bd0d30c6afa979f677220e6ae0464',
  challengeRunHash: '3b07c3a6d9477cf6be89bb38fd8ad687a3c37fcf5d38d3f236a7c689302f9f5a',
  designationSidecarFileHash: '0e085fefa4d1d59645fc82f4c480cf629ff9d2721e13c299a7a3e58ca4a967a2',
  designationSidecarContentHash: '0461b8609271179954cd5211d608f9c88b2fbae72f3249d662c4aff18ed3e149',
};

function sha256File(relFromRepo: string): string {
  const p = join(repoRoot, relFromRepo);
  return createHash('sha256').update(readFileSync(p)).digest('hex');
}

function main(): void {
  const errors: string[] = [];
  const paths = {
    anchorRun: 'poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json',
    statRun: 'poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-STAT-002.json',
    challengeRun: 'poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-CHALLENGE-002.json',
    anchorPack: 'poc/benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json',
    statPack: 'poc/benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json',
    challengePack: 'poc/benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.json',
    designation: 'poc/experiments/reference-designations/reference_baseline_001.json',
  };

  if (sha256File(paths.anchorRun) !== EXPECTED.anchorRunHash) errors.push('anchor run hash');
  if (sha256File(paths.statRun) !== EXPECTED.statRunHash) errors.push('stat run hash');
  if (sha256File(paths.challengeRun) !== EXPECTED.challengeRunHash) errors.push('challenge run hash');
  if (sha256File(paths.designation) !== EXPECTED.designationSidecarFileHash) {
    errors.push('designation sidecar file hash');
  }
  const sidecar = JSON.parse(readFileSync(join(repoRoot, paths.designation), 'utf8')) as {
    designationSidecarSha256?: string;
  };
  if (sidecar.designationSidecarSha256 !== EXPECTED.designationSidecarContentHash) {
    errors.push('designation sidecar content hash field');
  }

  for (const [key, rel] of Object.entries({
    anchor: paths.anchorPack,
    statistical: paths.statPack,
    challenge: paths.challengePack,
  })) {
    const pack = JSON.parse(readFileSync(join(repoRoot, rel), 'utf8')) as Record<string, unknown>;
    const h = computePackContentHash(pack);
    const exp =
      key === 'anchor'
        ? EXPECTED.anchorPackContentHash
        : key === 'statistical'
          ? EXPECTED.statisticalPackContentHash
          : EXPECTED.challengePackContentHash;
    if (h !== exp) errors.push(`${key} pack contentHash`);
  }

  if (errors.length) {
    console.error('Immutability verification FAILED:', errors.join(', '));
    process.exit(1);
  }

  const manifestBody = {
    schemaVersion: '1.0.0',
    manifestKind: 'reference_baseline_evidence_manifest',
    manifestId: 'REFERENCE-BASELINE-001',
    closedAt: new Date().toISOString(),
    handover: 'Handover_03',
    gate: 'G6',
    terminology: {
      anchorSuite: 'Frozen benchmark input pack CKES-BENCHMARK-ANCHOR-001 (not the baseline itself).',
      referenceBaseline001:
        'Single designated completed clean Anchor run reference_baseline_001 → RUN-REF-CLEAN-ANCHOR-002.',
      baselineEvidenceSet:
        'Designated Anchor run plus supporting Statistical and Challenge -002 runs and linked artifacts.',
      baselineAnchors: 'Fixed execution conditions (profile, scorer, revisions, isolation) — not the Anchor Suite.',
    },
    designation: {
      designationId: 'reference_baseline_001',
      designationEventId: 'ad7539ba-699b-432d-ab36-af4f20bbed43',
      sidecarPath: paths.designation,
      sidecarFileSha256: EXPECTED.designationSidecarFileHash,
      sidecarContentSha256: EXPECTED.designationSidecarContentHash,
      appendOnlyLogPath: 'poc/experiments/reference-designations/designations.jsonl',
    },
    primaryDesignatedRun: {
      runId: 'RUN-REF-CLEAN-ANCHOR-002',
      role: 'reference_baseline_anchor_run',
      path: paths.anchorRun,
      sha256: EXPECTED.anchorRunHash,
      derivedReportPath:
        'poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.derived-report.json',
    },
    supportingRuns: [
      {
        runId: 'RUN-REF-CLEAN-STAT-002',
        role: 'supporting_statistical_evidence_not_composite_baseline',
        path: paths.statRun,
        sha256: EXPECTED.statRunHash,
      },
      {
        runId: 'RUN-REF-CLEAN-CHALLENGE-002',
        role: 'supporting_challenge_evidence_not_composite_baseline',
        path: paths.challengeRun,
        sha256: EXPECTED.challengeRunHash,
      },
    ],
    excludedFromValidBaselineEvidenceSet: {
      reason: 'G4 measurement-validity defects; preserved audit lineage only',
      historicalInvalidRuns: [
        {
          runId: 'RUN-REF-CLEAN-ANCHOR-001',
          path: 'poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-ANCHOR-001.json',
          sha256: '7e10d14d39fe768c1e80d142e59b0c371d346df32db1c25b3e8225e80532524b',
        },
        {
          runId: 'RUN-REF-CLEAN-STAT-001',
          path: 'poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-STAT-001.json',
          sha256: '7764a25448f9293d936c41deb548081354e72aa8ea139acb57a14477cd73a26d',
        },
        {
          runId: 'RUN-REF-CLEAN-CHALLENGE-001',
          path: 'poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-CHALLENGE-001.json',
          sha256: '4e68448916dd75efc72da5a95db364db892a900064784969ca0b87e4102d88c2',
        },
      ],
    },
    frozenPacks: {
      manifestPath: 'poc/benchmark/releases/G3-FREEZE-MANIFEST.json',
      anchor: {
        packId: 'CKES-BENCHMARK-ANCHOR-001',
        packVersion: '1.0.0',
        contentHash: EXPECTED.anchorPackContentHash,
        jsonPath: paths.anchorPack,
      },
      statistical: {
        packId: 'CKES-BENCHMARK-STATISTICAL-001',
        packVersion: '1.0.0',
        contentHash: EXPECTED.statisticalPackContentHash,
        jsonPath: paths.statPack,
      },
      challenge: {
        packId: 'CKES-BENCHMARK-CHALLENGE-001',
        packVersion: '1.0.0',
        contentHash: EXPECTED.challengePackContentHash,
        jsonPath: paths.challengePack,
      },
    },
    baselineAnchors: {
      runProfile: {
        profileId: 'CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001',
        path: 'poc/experiments/run-profiles/CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001.json',
        contentHash: 'a69d5677856931ab7617ef64eb0072e2fb1b52254952077035d0acbcc14586de',
      },
      scorer: {
        version: '1.0.0-g1',
        contentHash: 'bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55',
      },
      benchmarkSchemaVersion: '1.0.0',
      ckesGitCommitAtRun: '956c93f9e7b2e2a519fbc8a909667df9de8f454c',
      pipelinePackageVersion: '0.1.0',
      harnessPackageVersion: '0.1.0',
      evaluationInfrastructureRevision: 'g4.1-baseline-validity-2026-09-19',
      databaseProfile: 'clean',
      retrievalMode: 'deterministic_fixture',
      isolationMode: 'truncate_between_scenarios',
      dryRun: false,
      trialPolicySource: 'runProfile trialPolicySnapshot on designated run',
    },
    integrity: {
      leakageCheck: 'passed_at_g4_g41_preflight',
      packQualifyFreeze: 'passed_g3',
      g41MeasurementValidity: 'passed',
    },
    provenanceAndReview: {
      g2ReviewPackage: 'docs/Development/Handover_03_G2_Review_Package.md',
      g3FreezeManifest: 'poc/benchmark/releases/G3-FREEZE-MANIFEST.json',
      generationProvenanceNote:
        'Expectations produced via deterministic G2 construction toolchain; not independently authored real-world ground truth (epistemic status not upgraded at G6).',
      architectGateReports: [
        'docs/Development/Handover_03_G1_Implementation_Report.md',
        'docs/Development/Handover_03_G3_Freeze_and_G4_Readiness_Report.md',
        'docs/Development/Handover_03_G31_G4_Readiness_Remediation_Report.md',
        'docs/Development/Handover_03_G41_Baseline_Validity_and_G5_Readiness_Report.md',
        'docs/Development/Handover_03_G5_Reference_Baseline_Designation_and_G6_Readiness_Report.md',
      ],
    },
    challengeHoldout: {
      classification: 'process_controlled_tuning_holdout',
      notHidden: true,
      confidentialityEnforced: false,
      holdoutDescriptorPath:
        'poc/benchmark/generation/CKES-BENCHMARK-CHALLENGE-001/holdout-process-controlled.json',
    },
    knownMocksAndLimitations: [
      'deterministic_fixture retrieval; pg_trgm fuzzy match; no vector index',
      'deterministicAi / deterministic_off OpenAI for POC adjudication path',
      'full_pipeline pseudo-recipe extraction with directCandidate fallback (G4.1)',
      'REF-CLEAN corpus isolated to pack seeds only at run start (G4.1)',
      'POC rates are not production prevalence estimates',
    ],
    humanReadableReportPath:
      'poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-report.md',
    architecturalAuditRecord: 'docs/Architecture/Audits/AAR-0002-handover-03-reference-baseline-establishment.md',
    edfConformanceReport:
      'poc/experiments/baseline-evidence/G6-EDF-FRAMEWORK-ADVISOR-SUMMARY.json',
    normativePromotionDisclaimer:
      'Benchmark findings are empirical POC measurements only; no CKES-0001, CKES-PAR promotion, or ADR status changes at G6.',
  };

  const manifestPath = join(pocRoot, 'experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-manifest.json');
  const hash = createHash('sha256').update(JSON.stringify(manifestBody, null, 2)).digest('hex');
  const manifest = { ...manifestBody, manifestSha256: hash };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Wrote', manifestPath);
  console.log('manifestSha256', hash);
  console.log('Immutability verification: PASS');
}

main();
