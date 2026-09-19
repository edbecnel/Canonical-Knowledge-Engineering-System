-- Evaluator-only ground truth (MUST NOT be queried by pipeline modules)
CREATE TABLE IF NOT EXISTS synthetic.evaluator_ground_truth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id TEXT NOT NULL,
  source_recipe_id UUID,
  derived_recipe_id UUID NOT NULL,
  source_change_id UUID,
  extractor_id TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  source_path TEXT NOT NULL,
  candidate_role TEXT NOT NULL,
  occurrence_key TEXT NOT NULL,
  expected_relationship TEXT,
  expected_decision_class TEXT,
  label_confidence_class TEXT DEFAULT 'deterministic_by_construction',
  must_not_merge BOOLEAN DEFAULT FALSE,
  legacy_recipe_level BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (
    derived_recipe_id,
    extractor_id,
    extractor_version,
    source_path,
    candidate_role,
    occurrence_key
  )
);

CREATE INDEX IF NOT EXISTS idx_eval_gt_corpus ON synthetic.evaluator_ground_truth(corpus_id);
CREATE INDEX IF NOT EXISTS idx_eval_gt_derived ON synthetic.evaluator_ground_truth(derived_recipe_id);
