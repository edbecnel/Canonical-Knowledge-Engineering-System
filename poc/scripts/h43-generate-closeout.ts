/**
 * H4.3 closeout — aggregate INV artifacts into causal table and updated clusters (read-only).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const h43 = join(pocRoot, 'experiments/forensics/h43');
const invDir = join(h43, 'investigations');

function sha256File(abs: string): string {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

const invFiles = readdirSync(invDir).filter((f) => f.startsWith('INV-') && f.endsWith('.json'));
const rows = invFiles.map((f) => {
  const inv = JSON.parse(readFileSync(join(invDir, f), 'utf8')) as Record<string, unknown>;
  const c = inv.causalAttribution as Record<string, unknown>;
  return {
    scenarioId: inv.scenarioId,
    suite: inv.suite,
    reproduced: inv.reproductionStatus === 'reproduced_rb001',
    reproductionStatus: inv.reproductionStatus,
    firstDivergenceLayer: c.firstDivergenceLayer,
    rootCause: c.primaryRootCause,
    contributingCauses: c.contributingCauses,
    downstreamManifestations: c.downstreamManifestations,
    confidence: c.diagnosisConfidence,
    evidenceArtifact: `investigations/${f}`,
  };
});

const updatedClusters = {
  gate: 'H4.3',
  generatedAt: new Date().toISOString(),
  clusters: [
    {
      clusterId: 'CL-DET-ADJ-EQUIV',
      status: 'mechanism_established_high_confidence',
      description:
        'Exact normalized label match (score 1.0) → deterministic EQUIVALENT → reuse_existing → scorer false_merge when benchmark expects non-merge',
      scenariosConfirmed: [
        'ANC-0017',
        'ANC-0018',
        'ANC-0019',
        'ANC-0020',
        'ANC-0031',
        'ANC-0024',
        'ANC-0040',
        'STA-0014',
      ],
      rootCause: 'adjudication',
      contributing: ['retrieval_exact_match', 'missing_distinguishing_representation_in_candidate'],
    },
    {
      clusterId: 'CL-DET-ADJ-SUBSUMED',
      status: 'mechanism_established_high_confidence',
      description:
        'Fuzzy retrieval score ≥0.7 → deterministic SUBSUMED_BY_EXISTING; policy may reject but scorer still false_merges for several expected classes',
      scenariosConfirmed: ['ANC-0023', 'ANC-0027', 'ANC-0029', 'ANC-0035', 'STA-0008'],
      rootCause: 'adjudication',
      contributing: ['retrieval_normalized_overlap', 'qualifier_context_loss_in_candidate_text'],
    },
    {
      clusterId: 'CL-RETRIEVAL-EMPTY-DISTINCT',
      status: 'control_pass_mechanism',
      description: 'No retrieval match → DISTINCT → evaluate_new_identity (pass for related_distinct)',
      scenariosConfirmed: ['ANC-0038', 'ANC-0030', 'ANC-0034'],
      rootCause: 'n/a_control',
    },
    {
      clusterId: 'CL-CHL-DEFER-EXPECTATION',
      status: 'mechanism_established_medium_confidence',
      description:
        'Benchmark expects defer_human but adjudication returns DISTINCT (no matches) with confidence 0.9 → policy evaluate_new_identity, not defer — scorer unnecessary_deferral',
      scenariosConfirmed: ['CHL-0003', 'CHL-0010', 'CHL-0002', 'CHL-0006'],
      rootCause: 'benchmark_policy_semantics_mismatch',
      contributing: ['adjudication_distinct', 'policy_semanticActions_mapping'],
      limitation: 'No passing defer_human cases in Challenge -002 for in-suite control',
    },
  ],
  splitRecommendation:
    'CL-EQUIV-REUSE and CL-SUBSUMED-REJECT from H4.2 should be treated as two deterministic adjudication branches, not one cluster',
};

const immutability = {
  anchorRunHash: sha256File(
    join(pocRoot, 'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json'),
  ),
  expectedAnchorRunHash: 'c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573',
  passed:
    sha256File(
      join(pocRoot, 'experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json'),
    ) === 'c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573',
};

writeFileSync(join(h43, 'H43-CAUSAL-TABLE.json'), JSON.stringify({ rows }, null, 2));
writeFileSync(join(h43, 'H43-UPDATED-CLUSTERS.json'), JSON.stringify(updatedClusters, null, 2));
writeFileSync(
  join(h43, 'H43-IMMUTABILITY.json'),
  JSON.stringify({ checkedAt: new Date().toISOString(), ...immutability }, null, 2),
);
console.log('H4.3 closeout aggregates', { inv: rows.length, immutability: immutability.passed });
