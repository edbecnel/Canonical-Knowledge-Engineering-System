import type { Pool } from 'pg';

export interface GroundTruthEvaluation {
  corpusId: string;
  totalGroundTruth: number;
  evaluated: number;
  correctMappings: number;
  precision: number;
  recall: number;
}

export async function evaluateGroundTruth(pool: Pool, corpusId: string): Promise<GroundTruthEvaluation> {
  const { rows: gtRows } = await pool.query(
    `SELECT * FROM synthetic.ground_truth WHERE corpus_id = $1`,
    [corpusId],
  );

  let correctMappings = 0;
  let evaluated = 0;

  for (const gt of gtRows) {
    const { rows: decisions } = await pool.query(
      `SELECT d.adjudication_class, d.policy_action
       FROM ckes.canonicalization_decisions d
       JOIN ckes.candidates c ON c.id = d.candidate_id
       WHERE c.candidate_text ILIKE '%' || (
         SELECT title FROM recipes WHERE id = $1
       ) || '%'
       ORDER BY d.created_at DESC LIMIT 1`,
      [gt.derived_recipe_id],
    );
    if (decisions.length === 0) continue;
    evaluated++;
    const expected = gt.expected_relationship as string;
    const adj = decisions[0].adjudication_class as string;
    if (
      (expected === 'PARAPHRASE' || expected === 'NEAR_DUPLICATE' || expected === 'EXACT_DUPLICATE') &&
      (adj === 'EQUIVALENT' || adj === 'SUBSUMED_BY_EXISTING')
    ) {
      correctMappings++;
    } else if (expected === 'CONTRADICTION' && adj === 'CONTRADICTS') {
      correctMappings++;
    } else if (expected === 'NOVEL' && adj === 'DISTINCT') {
      correctMappings++;
    }
  }

  const precision = evaluated > 0 ? correctMappings / evaluated : 0;
  return {
    corpusId,
    totalGroundTruth: gtRows.length,
    evaluated,
    correctMappings,
    precision,
    recall: gtRows.length > 0 ? correctMappings / gtRows.length : 0,
  };
}
