-- CKES canonical and processing schema
CREATE SCHEMA IF NOT EXISTS ckes;

CREATE TABLE IF NOT EXISTS ckes.source_cursors (
  source_system TEXT NOT NULL,
  source_object_id UUID NOT NULL,
  last_processed_revision TEXT,
  last_processed_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (source_system, source_object_id)
);

CREATE TABLE IF NOT EXISTS ckes.canonical_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_id TEXT NOT NULL DEFAULT 'ckes:cals',
  label TEXT NOT NULL,
  normalized_label TEXT NOT NULL,
  description TEXT,
  experimental BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope_id, normalized_label)
);

CREATE TABLE IF NOT EXISTS ckes.canonical_knowledge_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_id TEXT NOT NULL DEFAULT 'ckes:cals',
  subject TEXT NOT NULL,
  aspect TEXT,
  knowledge_text TEXT NOT NULL,
  experimental BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.canonical_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_id TEXT NOT NULL DEFAULT 'ckes:cals',
  from_concept_id UUID REFERENCES ckes.canonical_concepts(id),
  to_concept_id UUID REFERENCES ckes.canonical_concepts(id),
  relationship_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.semantic_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_id TEXT NOT NULL DEFAULT 'ckes:cals',
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL,
  source_object_id UUID NOT NULL,
  source_revision TEXT,
  excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID,
  source_change_id UUID,
  candidate_type TEXT NOT NULL,
  candidate_text TEXT NOT NULL,
  discovery_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.staging_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  candidate_id UUID REFERENCES ckes.candidates(id),
  change_type TEXT NOT NULL,
  target_id UUID,
  payload JSONB NOT NULL,
  rationale TEXT,
  policy_decision TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.canonical_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ckes.canonicalization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_stage TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  model_used TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  report JSONB
);

CREATE TABLE IF NOT EXISTS ckes.canonicalization_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ckes.canonicalization_runs(id),
  candidate_id UUID REFERENCES ckes.candidates(id),
  adjudication_class TEXT,
  policy_action TEXT NOT NULL,
  retrieval_method TEXT,
  candidate_set_size INTEGER,
  ai_tokens INTEGER DEFAULT 0,
  ai_cost_usd NUMERIC(12, 6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.policy_versions (
  version TEXT PRIMARY KEY,
  policy_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ckes.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type TEXT NOT NULL,
  artifact_id UUID NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  embedding REAL[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (artifact_type, artifact_id, model)
);

CREATE TABLE IF NOT EXISTS ckes.metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_stage TEXT NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concepts_normalized ON ckes.canonical_concepts(normalized_label);
CREATE INDEX IF NOT EXISTS idx_cko_subject ON ckes.canonical_knowledge_objects(subject);
