-- Structural candidate coordinates for evaluator joins (not ground truth)
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS source_change_id UUID;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS source_recipe_id UUID;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS extractor_id TEXT;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS extractor_version TEXT;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS source_path TEXT;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS candidate_role TEXT;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS occurrence_key TEXT;
ALTER TABLE ckes.candidates ADD COLUMN IF NOT EXISTS content_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_candidates_structural
  ON ckes.candidates(source_change_id, extractor_id, extractor_version, source_path, candidate_role, occurrence_key);
