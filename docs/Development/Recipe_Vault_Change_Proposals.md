# Recipe Vault Change Proposals

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Recipe Vault Change Proposals

> **Status:** Draft
> **Owner:** Architecture Team
> **Classification:** Recipe Vault requirement (proposed)
> **Last Reviewed:** 2026-08-18

## Purpose

CKES POC experimentation identified Recipe Vault improvements that properly belong in the source system (not CKES processing state). These are **proposals** validated in the POC synthetic database first.

## Proposed Changes (Minimal CKES-Enabling Set)

### 1. `recipes.revision_number` (INTEGER, monotonic)

Increment on every successful save. Provides stable `source_revision` for the CKES source-change contract.

**CKES POC implementation:** `poc/db/recipe-vault/001_schema.sql`

### 2. `recipes.content_fingerprint` (TEXT)

SHA-256 hash of canonical recipe content subset (title, ingredients, instructions). Enables cheap skip/reprocess detection.

**Distinct from:** `ai_generation_jobs.content_fingerprint` (AI input text hash).

### 3. `recipe_change_events` outbox table

```sql
recipe_change_events (
  id, recipe_id, revision_number, event_type,
  changed_fields JSONB, content_fingerprint, occurred_at, processed
)
```

Event types: `CREATED`, `IMPORTED`, `MODIFIED`, `INGREDIENT_CHANGED`, `INSTRUCTION_CHANGED`, `PROVENANCE_CHANGED`, `DELETED`.

### 4. `recipes.import_provenance` (JSONB)

Persist extended import metadata (`discoveredVia`, `providerId`, `importMethod`, `retrievedAt`, license fields) currently lost on DB round-trip.

### 5. `recipe_versions.previous_version_id`

Chain version snapshots for revision history navigation.

## CKES-Only State (Do NOT Add to Recipe Vault)

- Vector embeddings
- CKES prompts and policy versions
- Canonical concepts, knowledge objects, relationships
- Semantic adjudication results
- CKES processing cursors (beyond optional read-only export)

## Transition Path

```text
POC: Synthetic DB with extensions → Same adapter interface
Production: Recipe Vault with approved extensions → ProductionRecipeVaultAdapter
```

## Related Documents

- [Source Change Contract](../Architecture/Source_Change_Contract.md)
- [CRA Findings Report](CRA_Findings_Report.md)
