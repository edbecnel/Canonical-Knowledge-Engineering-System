import type { Pool } from 'pg';
import type { RecipeJson } from '@ckes/adapter';
import {
  DISCOVERY_EXTRACTOR_ID,
  DISCOVERY_EXTRACTOR_VERSION,
  discoverCandidates,
} from '@ckes/pipeline';

export const LABELED_CANDIDATE_ROLES = ['knowledge_object'] as const;

export async function recordLegacyRecipeGroundTruth(
  pool: Pool,
  corpusId: string,
  sourceId: string | null,
  derivedId: string,
  relationship: string,
  family: string,
  method: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO synthetic.ground_truth (corpus_id, source_recipe_id, derived_recipe_id, expected_relationship, family, generation_method)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [corpusId, sourceId, derivedId, relationship, family, method],
  );
}

export async function recordEvaluatorCandidateGroundTruth(
  pool: Pool,
  corpusId: string,
  derivedRecipeId: string,
  sourceRecipeId: string | null,
  recipeJson: RecipeJson,
): Promise<void> {
  const { rows: changeRows } = await pool.query(
    `SELECT id FROM recipe_change_events WHERE recipe_id = $1 ORDER BY revision_number DESC LIMIT 1`,
    [derivedRecipeId],
  );
  const sourceChangeId = changeRows[0]?.id as string | undefined;

  const candidates = discoverCandidates(recipeJson);
  for (const candidate of candidates) {
    if (!LABELED_CANDIDATE_ROLES.includes(candidate.candidateRole as 'knowledge_object')) {
      continue;
    }
    await pool.query(
      `INSERT INTO synthetic.evaluator_ground_truth (
         corpus_id, source_recipe_id, derived_recipe_id, source_change_id,
         extractor_id, extractor_version, source_path, candidate_role, occurrence_key,
         expected_relationship, label_confidence_class, legacy_recipe_level
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE)
       ON CONFLICT (derived_recipe_id, extractor_id, extractor_version, source_path, candidate_role, occurrence_key)
       DO NOTHING`,
      [
        corpusId,
        sourceRecipeId,
        derivedRecipeId,
        sourceChangeId ?? null,
        DISCOVERY_EXTRACTOR_ID,
        DISCOVERY_EXTRACTOR_VERSION,
        candidate.sourcePath,
        candidate.candidateRole,
        candidate.occurrenceKey,
        null,
        'deterministic_by_construction',
      ],
    );
  }
}

export async function syncEvaluatorRelationshipFromRecipeGt(
  pool: Pool,
  corpusId: string,
  derivedRecipeId: string,
  relationship: string,
): Promise<void> {
  await pool.query(
    `UPDATE synthetic.evaluator_ground_truth
     SET expected_relationship = $3, legacy_recipe_level = TRUE
     WHERE corpus_id = $1 AND derived_recipe_id = $2 AND candidate_role = 'knowledge_object'`,
    [corpusId, derivedRecipeId, relationship],
  );
}
