import type { Pool } from 'pg';
import { LABELED_CANDIDATE_ROLES } from './evaluator-ground-truth.js';

export interface GroundTruthCoverage {
  labeledRoles: readonly string[];
  unlabeledRoles: string[];
  coverageComplete: false;
  handover3Adds: string;
}

export interface GroundTruthEvaluation {
  corpusId: string;
  facility: 'corpus_evaluation';
  totalLabeledExpectations: number;
  evaluated: number;
  correctMappings: number;
  falseMerges: number;
  notEvaluatedUnlabeled: number;
  precision: number;
  recall: number;
  coverage: GroundTruthCoverage;
}

function mapsToMerge(adj: string, policy: string): boolean {
  return (
    policy === 'admit' ||
    policy === 'extend_or_evidence' ||
    adj === 'EQUIVALENT' ||
    adj === 'SUBSUMED_BY_EXISTING'
  );
}

function expectedAllowsMerge(expected: string): boolean {
  return expected === 'PARAPHRASE' || expected === 'NEAR_DUPLICATE' || expected === 'EXACT_DUPLICATE';
}

function expectedDistinct(expected: string): boolean {
  return expected === 'NOVEL' || expected === 'CONTRADICTION';
}

export async function evaluateGroundTruth(pool: Pool, corpusId: string): Promise<GroundTruthEvaluation> {
  const { rows: gtRows } = await pool.query(
    `SELECT * FROM synthetic.evaluator_ground_truth WHERE corpus_id = $1`,
    [corpusId],
  );

  let correctMappings = 0;
  let evaluated = 0;
  let falseMerges = 0;

  for (const gt of gtRows) {
    const { rows: decisions } = await pool.query(
      `SELECT d.adjudication_class, d.policy_action
       FROM ckes.canonicalization_decisions d
       JOIN ckes.candidates c ON c.id = d.candidate_id
       WHERE c.source_recipe_id = $1
         AND c.extractor_id = $2
         AND c.extractor_version = $3
         AND c.source_path = $4
         AND c.candidate_role = $5
         AND c.occurrence_key = $6
       ORDER BY d.created_at DESC LIMIT 1`,
      [
        gt.derived_recipe_id,
        gt.extractor_id,
        gt.extractor_version,
        gt.source_path,
        gt.candidate_role,
        gt.occurrence_key,
      ],
    );
    if (decisions.length === 0) continue;
    evaluated++;
    const expected = gt.expected_relationship as string;
    const adj = decisions[0].adjudication_class as string;
    const policy = decisions[0].policy_action as string;

    const merged = mapsToMerge(adj, policy);
    if (expectedDistinct(expected) && merged) {
      falseMerges++;
      continue;
    }
    if (gt.must_not_merge && merged) {
      falseMerges++;
      continue;
    }

    if (expectedAllowsMerge(expected) && (adj === 'EQUIVALENT' || adj === 'SUBSUMED_BY_EXISTING' || merged)) {
      correctMappings++;
    } else if (expected === 'CONTRADICTION' && adj === 'CONTRADICTS') {
      correctMappings++;
    } else if (expected === 'NOVEL' && (adj === 'DISTINCT' || policy === 'evidence_only' || policy === 'defer')) {
      correctMappings++;
    }
  }

  const precision = evaluated > 0 ? correctMappings / evaluated : 0;
  const labeledCount = gtRows.length;

  return {
    corpusId,
    facility: 'corpus_evaluation',
    totalLabeledExpectations: labeledCount,
    evaluated,
    correctMappings,
    falseMerges,
    notEvaluatedUnlabeled: 0,
    precision,
    recall: labeledCount > 0 ? correctMappings / labeledCount : 0,
    coverage: {
      labeledRoles: LABELED_CANDIDATE_ROLES,
      unlabeledRoles: ['concept', 'relationship'],
      coverageComplete: false,
      handover3Adds:
        'Full multi-candidate labeling, reviewed benchmark packs, and reference baseline designation (Handover 3).',
    },
  };
}
