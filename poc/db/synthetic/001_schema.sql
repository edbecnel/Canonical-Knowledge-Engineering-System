-- Synthetic experiment ground truth (not visible to pipeline)
CREATE SCHEMA IF NOT EXISTS synthetic;

CREATE TABLE IF NOT EXISTS synthetic.ground_truth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id TEXT NOT NULL,
  source_recipe_id UUID,
  derived_recipe_id UUID NOT NULL,
  expected_relationship TEXT NOT NULL,
  family TEXT,
  generation_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ground_truth_corpus ON synthetic.ground_truth(corpus_id);
CREATE INDEX IF NOT EXISTS idx_ground_truth_derived ON synthetic.ground_truth(derived_recipe_id);
