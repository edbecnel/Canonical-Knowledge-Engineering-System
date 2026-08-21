-- Recipe Vault compatible POC schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  servings INTEGER,
  instructions JSONB NOT NULL DEFAULT '[]',
  recipe_json JSONB NOT NULL,
  schema_version TEXT NOT NULL DEFAULT '1.10',
  source_format TEXT,
  ai_parsed BOOLEAN NOT NULL DEFAULT FALSE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  content_fingerprint TEXT,
  import_provenance JSONB,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  group_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  item_meta JSONB
);

CREATE TABLE IF NOT EXISTS recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  previous_version_id UUID REFERENCES recipe_versions(id),
  recipe_snapshot JSONB NOT NULL,
  content_fingerprint TEXT,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recipe_id, revision_number)
);

CREATE TABLE IF NOT EXISTS recipe_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  revision_number INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '[]',
  content_fingerprint TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_recipes_fingerprint ON recipes(content_fingerprint);
CREATE INDEX IF NOT EXISTS idx_recipe_change_events_unprocessed ON recipe_change_events(processed, occurred_at);
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm ON recipes USING gin (title gin_trgm_ops);
