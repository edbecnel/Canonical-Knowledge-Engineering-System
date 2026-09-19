# Recipe Vault Source Integration

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Architecture](README.md) › Recipe Vault Source Integration

> **Status:** Draft
> **Owner:** Architecture Team
> **Applies To:** CKES source adapters, Recipe Vault integration planning
> **Classification:** CKES implementation choice + source capability reference (non-normative for Recipe Vault)
> **Last Reviewed:** 2026-09-19
> **Supersedes:** [Recipe Vault Change Proposals](../Development/Recipe_Vault_Change_Proposals.md) (requirements framing only; POC schema remains valid for experiments)

## 1. Purpose

This document defines how CKES should integrate with **The Recipe Vault** (TRV) as a knowledge source **without requiring Recipe Vault to adopt the CKES POC synthetic database schema**.

CKES is in an **early experimental phase** and is **not yet ready** to consume production Recipe Vault. This document:

1. Records **what Recipe Vault already provides** that meets or exceeds the [Source Change Contract](Source_Change_Contract.md).
2. Assigns **adapter responsibilities** to CKES (polling, fingerprinting, change inference).
3. Positions the **POC synthetic schema** as a CKES implementation substrate—not a production Recipe Vault target.
4. Lists **optional future optimizations** deferred until a joint integration milestone.

Recipe Vault engineering priorities (Launch 1.0, version history, product fixes) proceed **independently** of CKES timelines.

When TRV (or an adapter) already invokes an LLM for recipe conversion or enrichment, CKES **may** piggyback candidate extraction and preliminary canonicality assessment on that inference if privacy, cost, and output-quality controls are preserved (`CKES-PAR-0007` in [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md)). This is an optimization to measure, not a default coupling.

---

## 2. Strategic position

| Principle | Statement |
|-----------|-----------|
| **Source authority** | Recipe Vault owns recipe schema, persistence, and user-facing version history. CKES consumes; it does not redefine TRV storage. |
| **Contract generality** | [Source Change Contract](Source_Change_Contract.md) fields are technology-independent. TRV can satisfy the contract via APIs and adapter logic without new TRV columns. |
| **No premature duplication** | CKES must not treat POC columns (`revision_number`, `recipe_change_events`, etc.) as missing TRV requirements today. |
| **Adapter-owned synthesis** | Change feeds and content hashes may be **computed or inferred** in the CKES adapter layer. |
| **POC isolation** | [`poc/db/recipe-vault/001_schema.sql`](../../poc/db/recipe-vault/001_schema.sql) remains valid for corpus experiments on synthetic data. |

---

## 3. Relationship to prior change proposals

The document [Recipe Vault Change Proposals](../Development/Recipe_Vault_Change_Proposals.md) listed five schema extensions validated in the POC synthetic database:

| POC extension | Role in POC | Role in production TRV (this document) |
|---------------|-------------|----------------------------------------|
| `recipes.revision_number` | Monotonic integer `sourceRevision` | **Adapter maps** `sourceRevision` from `updated_at`, version row id, or `development_version` |
| `recipes.content_fingerprint` | Stored skip/reprocess hash | **Adapter computes** `contentHash` from fetched recipe DTO |
| `recipe_change_events` | Outbox for polling | **Adapter synthesizes** changes from API poll + diff (or version API) |
| `recipes.import_provenance` | JSONB import metadata | **TRV `RecipeMeta`** + URL columns; full round-trip is TRV product backlog |
| `recipe_versions.previous_version_id` | Version chain | **TRV `recipe_versions`** ordered by `created_at`; optional VH chain later |

Those POC extensions are **CKES implementation choices** for synthetic experiments—not open requirements on Recipe Vault until a future integration milestone proves adapter-only approaches insufficient.

---

## 4. Recipe Vault source capabilities (authoritative reference)

### 4.1 Canonical interchange

| Asset | Location | Notes |
|-------|----------|-------|
| JSON Schema | TRV `public/schemas/recipe.v1.json` | Published `RecipeJson` contract (currently v1.10+) |
| TypeScript types | TRV `src/types/recipe.types.ts` | `RecipeJson`, `RecipeMeta`, ingredient/instruction models |
| Export format | Client `.recipe.json` export | `$schema` URL, full payload for offline corpus builds |
| Schema docs | TRV `docs/Architecture/Recipes/Schema/` | Versioned schema migration notes |

TRV `RecipeJson` is **far richer** than the POC synthetic `recipe_json` blob (alternatives, computed ingredients, culinary knowledge, design intent, nutrition, videos, community metadata, development block).

### 4.2 Persistence model (production)

TRV uses **hybrid storage**: scalar columns on `recipes`, normalized `recipe_ingredients` / `categories`, and JSONB for extensible nested data (`nutrition`, `culinary_knowledge`, `design_intent`, `videos`, `source_urls`, etc.).

Key `recipes` fields relevant to CKES:

| Column / field | CKES use |
|----------------|----------|
| `id` (UUID) | `sourceObjectId` |
| `updated_at` | Cursor polling; candidate `sourceRevision` |
| `created_at` | `CREATED` / `IMPORTED` timestamp |
| `deleted_at` | `DELETED` (soft delete) |
| `title`, `description`, `instructions` | Canonical content + fingerprint inputs |
| `source_format`, `source_filename` | Provenance / import channel |
| `source_url`, `source_urls` (JSONB) | External origin URLs |
| `is_public` | Scope filtering (public corpus vs owner vault) |
| `development_version` | Human semver; optional `sourceRevision` |
| `development_auto_snapshot` | Whether saves create version rows |

**Not present on production `recipes` today** (and **not required** for early CKES):

- `revision_number` (integer)
- `content_fingerprint` (recipe content; distinct from AI tables)
- `import_provenance` (JSONB column)
- `recipe_change_events` table

### 4.3 Provenance and import metadata

TRV defines extended provenance in application types (`ExtendedRecipeProvenance`, `RecipeMeta`):

- `discoveredVia`, `providerId`, `retrievedAt`, `importMethod`
- `normalizationVersion`, `validationVersion`
- `sourceLicense`, `attributionRequired`
- `savedFromRecipeId`, `savedFromUserId` (Save to My Vault lineage)

Stamping on import: TRV `recipeProvenance.service.ts` (`applyDefaultImportProvenance`, `stampDiscoveryProvenance`).

**Known TRV product gap (not a CKES blocker):** provenance fields in `RecipeMeta` are not fully persisted or returned on all read paths after DB round-trip. CKES early corpus work can use **import JSON**, **export files**, or **discovery import payloads** where provenance is present. TRV may fix round-trip on its own backlog.

### 4.4 Version history (VH)

TRV implements owner version snapshots (VH-01 complete; UI/VH roadmap paused post–Launch 1.0):

| Asset | Location |
|-------|----------|
| Table | `recipe_versions` — `version_label`, `author_user_id`, `summary`, `change_categories`, `change_notes`, `recipe_snapshot`, `created_at` |
| Snapshot hook | `snapshotRecipeBeforeUpdate` on editor `PATCH` (`recipeBuilder.service.ts`) |
| API | `GET /api/recipes/:id/versions`, `GET .../versions/:versionId`, `POST .../versions/:versionId/revert` |

Version rows capture **user intent** (summary, categories, notes)—richer than POC machine `revision_number`.

**Not on production `recipe_versions` today:** `previous_version_id`, `revision_number`, `content_fingerprint`. Chain navigation can use `created_at` ordering until optional VH enhancements land.

### 4.5 Public discovery API (v1)

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/recipes` | Search/list with `scope` (`public`, `visible`, `own`), `sort` (`updated`, `added`, `name`, `relevance`), filters |
| `GET /v1/recipes/:id` | Full recipe DTO (owner vs public redaction) |
| `GET /v1/openapi.json` | OpenAPI specification |
| `GET /v1/llms.txt` | Machine-readable API summary |

Authentication: Bearer JWT from TRV `POST /api/auth/login` for `visible` / `own` scopes.

TRV v1 returns discovery summaries on list; detail endpoint returns full shaped recipe for fingerprinting and canonical extraction.

### 4.6 Other TRV capabilities CKES may use later

| Capability | Relevance |
|------------|-----------|
| Soft delete + trash API | `DELETED` without source outbox |
| External discovery import | `IMPORTED` with provider provenance |
| Knowledge modules | Cross-recipe culinary knowledge (deferred CALS scope) |
| Architect sessions | Draft recipes—not canonical source objects until saved |

### 4.7 Homonym: `content_fingerprint`

TRV stores `content_fingerprint` on **AI policy tables** (`ai_generation_jobs`, `ai_conversion_attempts`) for **same-source AI attempt cooldown**. Inputs include paste text, filename, URL, conversion detail level, reshape scope—not canonical recipe content.

CKES `contentHash` in the source contract is a **different concept**. Adapters must use a **recipe canonical fingerprint** (see §6.2), not TRV `computeContentFingerprint()` for AI cooldown.

---

## 5. Source Change Contract mapping (production TRV)

The contract ([Source Change Contract](Source_Change_Contract.md)) is satisfied when the adapter emits valid `KnowledgeSourceChange` objects. Production TRV does not need to emit them natively.

### 5.1 Field mapping

| Contract field | Production TRV source | Notes |
|----------------|----------------------|-------|
| `sourceSystem` | Constant `"recipe_vault"` | POC uses `"synthetic_rv"` |
| `sourceObjectId` | `recipes.id` | Stable UUID |
| `sourceRevision` | **Adapter choice** (string) | See §5.2 |
| `previousRevision` | Prior cursor / prior version row / prior poll state | Optional |
| `changeType` | **Adapter inference** | See §5.3 |
| `changedFields` | DTO diff or coarse `["*"]` in v1 | Path-level optional later |
| `contentHash` | **Adapter-computed** SHA-256 | See §6.2 |
| `timestamp` | `updated_at` or version `created_at` | ISO 8601 |

Contract note: `sourceRevision` is already typed as **string**—semver, timestamp, or UUID are all valid. An integer `revision_number` column is **not required**.

Contract note: `contentHash` may be computed at fetch time; source-stored fingerprint is an **optional optimization**.

Contract note: Adapters may use **cursor polling + diff** rather than a source-native outbox.

### 5.2 `sourceRevision` strategies (adapter v1 options)

| Strategy | Source | Pros | Cons |
|----------|--------|------|------|
| **A. `updated_at` ISO** | `recipes.updated_at` | Simple list poll `sort=updated` | Collision if multiple writes same timestamp; use as cursor not strict monotonic int |
| **B. Version row id** | `recipe_versions.id` | Stable per snapshot | Requires version API or DB access; only when snapshot created |
| **C. Semver label** | `development_version` | Human-readable | Not strictly monotonic if authors edit labels |
| **D. Composite** | e.g. `{updated_at}:{version_label}` | Reduces ambiguity | Adapter-specific parsing |

**Recommendation for first production adapter:** Strategy A for list polling + store last seen `updated_at` per object in `ckes.source_cursors`; upgrade to B when processing version snapshots for finer granularity.

POC uses integer `revision_number`—valid for synthetic DB only.

### 5.3 `changeType` inference (adapter v1)

| Observation | `changeType` |
|-------------|--------------|
| First time seeing `sourceObjectId` | `CREATED` or `IMPORTED` (use `source_format` / `meta.importMethod` to distinguish) |
| `deleted_at` newly set | `DELETED` |
| `contentHash` changed; ingredients diff | `INGREDIENT_CHANGED` or `MODIFIED` |
| `contentHash` changed; instructions diff only | `INSTRUCTION_CHANGED` or `MODIFIED` |
| Provenance/meta diff only | `PROVENANCE_CHANGED` |
| Other content change | `MODIFIED` |

v1 adapters may emit coarse `MODIFIED` until field-level diff is implemented.

### 5.4 Idempotency

CKES processing semantics unchanged:

- Idempotency key: `(source_system, source_object_id, source_revision)`
- Expensive semantic work only when `contentHash` differs from `last_processed_hash` in `ckes.source_cursors`

Adapter must ensure `sourceRevision` values are **stable for the same logical change** across poll cycles.

---

## 6. CKES adapter design

### 6.1 POC adapter (current)

[`SyntheticRecipeVaultAdapter`](../../poc/packages/adapter/src/synthetic-adapter.ts) polls `recipe_change_events` on the **synthetic database** (`source_system = synthetic_rv`). This pattern is correct for POC; it is **not** a prescription for TRV schema.

### 6.2 Production adapter (deferred)

`ProductionRecipeVaultAdapter` (not yet implemented) should:

1. **Poll** `GET /v1/recipes?sort=updated&scope=...` with cursor on `updated_at` (and offset/limit).
2. **Fetch** `GET /v1/recipes/:id` for each new or updated id (respect rate limits).
3. **Compute** `contentHash` using the same algorithm as POC [`fingerprint.ts`](../../poc/packages/adapter/src/fingerprint.ts), extended for full TRV DTO projection:

```typescript
// POC subset (synthetic corpus)
{ title, description, servings, ingredients, instructions }

// Production projection (adapter must define stable JSON serialization)
// Minimum: title, description, servings, ingredients, instructions
// Optional phase 2: classification, nutrition, culinary_knowledge per CALS policy scope
```

4. **Diff** successive DTOs for `changedFields` and refined `changeType`.
5. **Record** cursors in `ckes.source_cursors` (revision + hash per object).
6. **Scope policy:** default **public** corpus only until auth, privacy, and owner agreements are defined.

Optional parallel path: poll owner `GET /api/recipes/:id/versions` when service account available.

### 6.3 Fingerprint algorithm (shared POC + production)

Align with POC:

```typescript
function canonicalRecipeSubset(recipe: RecipeJson): Record<string, unknown> {
  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  };
}

function contentFingerprint(recipe: RecipeJson): string {
  const normalized = JSON.stringify(canonicalRecipeSubset(recipe));
  return createHash('sha256').update(normalized).digest('hex');
}
```

Production adapter maps TRV API DTO → `RecipeJson` (or subset) before hashing. **Do not** use TRV AI cooldown fingerprint utilities.

### 6.4 Synthetic vs production adapter coexistence

| Adapter | `source_system` | Data source | Status |
|---------|-----------------|-------------|--------|
| `SyntheticRecipeVaultAdapter` | `synthetic_rv` | POC PostgreSQL + outbox | Active POC |
| `ProductionRecipeVaultAdapter` | `recipe_vault` | TRV HTTPS APIs | Deferred |

Both implement the same `SourceAdapter` interface and [Source Change Contract](Source_Change_Contract.md).

---

## 7. POC synthetic schema (CKES-only)

Location: [`poc/db/recipe-vault/`](../../poc/db/recipe-vault/)

Classification: **CKES implementation choice** (already documented in [`README.md`](../../poc/db/recipe-vault/README.md)).

Purpose:

- Generate large synthetic corpora with lifecycle simulation ([`lifecycle.ts`](../../poc/packages/corpus/src/lifecycle.ts))
- Validate pipeline, metrics, and source-change processing without production TRV dependency
- Exercise outbox polling pattern in isolation

**Not a copy of production TRV `schema.sql`.** Extensions beyond TRV production today:

- `recipes.revision_number`, `recipes.content_fingerprint`, `recipes.import_provenance`
- `recipe_change_events`
- `recipe_versions.previous_version_id`, version `revision_number`, version `content_fingerprint`

CKES POC **should continue** using this schema until `ProductionRecipeVaultAdapter` is chartered.

---

## 8. What CKES should do now

| Action | Owner | Priority |
|--------|-------|----------|
| Continue POC on synthetic DB + `SyntheticRecipeVaultAdapter` | CKES | Active |
| Document adapter mapping in code comments / adapter package README | CKES | High |
| Extend fingerprint projection spec when CALS policy scope for canonical subset is fixed | CKES + CALS | Medium |
| Build corpus from TRV **export JSON** or public v1 API for offline experiments | CKES | Medium (when needed) |
| Implement `ProductionRecipeVaultAdapter` | CKES | **Deferred** |
| Request TRV schema changes | CKES → TRV | **Do not** until integration milestone |

---

## 9. What Recipe Vault should do (independent backlog)

These are **TRV product/engineering** items—not CKES integration prerequisites:

| Item | TRV backlog | CKES impact if unfixed |
|------|-------------|------------------------|
| Provenance meta DB round-trip | TRV product fix | Use import/export JSON for provenance-rich corpus |
| VH UI + `previous_version_id` | VH-03–VH-07 (paused) | Use `created_at` version ordering |
| Tags DB persistence | L10-TAG | Use categories + `RecipeJson` classification |
| Launch 1.0 gates | L10 program | None for synthetic POC |

**Deferred optional optimizations** (only if integration milestone proves need):

- `recipes.revision_number` column
- `recipes.content_fingerprint` column (stored hash)
- `recipe_change_events` outbox
- `recipes.import_provenance` JSONB column

Joint decision required before TRV implements any of the above.

---

## 10. Integration milestone checklist (future)

When CKES is ready to consume live TRV:

- [ ] Charter `ProductionRecipeVaultAdapter` with scope policy (public-only vs authenticated vault)
- [ ] TRV staging environment + API credentials / rate limit agreement
- [ ] Validate fingerprint stability: API DTO → hash → re-fetch → same hash
- [ ] Validate cursor polling: no missed updates, no duplicate processing
- [ ] Privacy review: private recipes excluded unless explicit owner consent
- [ ] Re-evaluate need for TRV outbox or stored fingerprint (performance at scale)
- [ ] Update [CRA Findings Report](../Development/CRA_Findings_Report.md) with integration evidence

---

## 11. Classification summary

| Topic | Classification |
|-------|----------------|
| Source Change Contract pattern | Candidate CRA finding (see F-001) |
| Adapter-synthesized change feed | CKES implementation choice |
| POC synthetic schema | CKES implementation choice |
| TRV API as source of truth | CKES implementation choice |
| TRV schema column additions | Deferred; not CKES requirement today |
| Recipe canonical fingerprint algorithm | CKES implementation choice (align POC + production adapter) |
| TRV provenance round-trip fix | TRV product backlog (outside CKES scope) |

---

## 12. Related documents

### CKES

- [Source Change Contract](Source_Change_Contract.md)
- [CRA Findings Report](../Development/CRA_Findings_Report.md) — F-001, F-007
- [Recipe Vault Change Proposals](../Development/Recipe_Vault_Change_Proposals.md) — superseded framing; see §3
- [ADR-0002 — POC TypeScript PostgreSQL](ADRs/ADR-0002-poc-typescript-postgresql.md)
- [POC README](../../poc/README.md)
- [POC adapter package](../../poc/packages/adapter/)

### Recipe Vault (external)

- [TheRecipeVault](https://github.com/edbecnel/TheRecipeVault)
- TRV `docs/CKES_Source_Integration_Handover.md` — **deferred TRV change proposals for TRV review**
- TRV `public/schemas/recipe.v1.json`
- TRV Launch 1.0 gap matrix and MASTER_TASK_LIST (VH, provenance)

### Sibling projects

- [CRA](https://github.com/edbecnel/Canonical-Representation-Architecture)
- [CALS](https://github.com/edbecnel/Culinary-Arts-Learning-System)

---

## Document history

| Date | Change |
|------|--------|
| 2026-08-22 | Initial draft: supersedes change-proposals-as-requirements framing; RV-first integration architecture |
