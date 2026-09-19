# Handover 03 G3.1 — G4 Readiness Remediation Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G3.1 Report

> **Status:** Submitted for architect review (G4 not authorized)
> **Owner:** Architecture Team
> **Applies To:** G3.1 evaluation instrumentation
> **Last Reviewed:** 2026-09-19

## Authorization boundary

| Gate | Status |
| --- | --- |
| G3.1 Evaluation identity capture | **Complete** |
| G4 Official benchmark execution | **Not performed** |
| G5 `reference_baseline_001` | **Not performed** |
| G6 Governance closeout | **Not performed** |

## Where matched identity originates in the existing path

1. **`hybridRetrieve`** returns ranked `RetrievalMatch[]` (canonical concept / knowledge_object IDs).
2. **`adjudicateSemantic`** (deterministic harness path) compares the candidate **only against `matches[0]`** — see [`deterministicAdjudication`](../../poc/packages/pipeline/src/adjudication.ts) and LLM prompt `buildAdjudicationPrompt` (top match only).
3. **`evaluatePolicy`** consumes adjudication class + confidence only — it does **not** select a different canonical identity.

There is **no separate persisted “selected identity” pointer** in CKES today. The identity associated with a merge/equivalence outcome is the **primary retrieval match already used by adjudication** when the outcome is merge-class.

## Semantics of `evaluationMatchedIdentityRef`

Field on [`DecisionSliceResult`](../../poc/packages/pipeline/src/decision-slice.ts), populated **after** adjudication and policy complete:

- **`present: true`** only when `matches.length > 0` **and** (`adjudicationClass` ∈ {EQUIVALENT, SUBSUMED_BY_EXISTING, EXTENDS_EXISTING} **or** `policyAction` ∈ {admit, extend_or_evidence}).
- References `matches[0]` with `basis: primary_retrieval_match_used_by_adjudication`.
- **`present: false`** with `no_retrieval_matches` or `no_merge_identity_in_decision` — does **not** fabricate identity on DISTINCT/defer/reject paths.

Implemented in [`evaluation-identity.ts`](../../poc/packages/pipeline/src/evaluation-identity.ts). **No** changes to retrieval ranking, adjudication inputs, or policy inputs.

## Canonical identity → benchmark `seedId`

Harness layer only ([`seed-mapping.ts`](../../poc/packages/benchmark/src/seed-mapping.ts)):

- Maps `evaluationMatchedIdentityRef.canonicalLabel` to pack `canonicalSeedMaterial[].seedId` via `normalizeLabel` equality.
- `identityEvidenceStatus`: `present_mapped` | `present_unmapped` | `absent_no_merge` | `absent_no_retrieval`.
- `matchedSeedIdForScoring()` passes `benchmarkLocalSeedId` to the qualified scorer only when `present_mapped`.

Harness loads pack seeds into `ckes.canonical_concepts` with deterministic UUIDs ([`pack-seeds.ts`](../../poc/packages/harness/src/pack-seeds.ts)) so retrieval can resolve labels — **benchmark orchestration only**; adjudication logic unchanged.

## Run-result schema

Optional `evaluationCapture` on each scenario result ([`benchmark-run-result.schema.json`](../../poc/benchmark/schemas/benchmark-run-result.schema.json)):

- `evaluationMatchedIdentityRef`
- `benchmarkLocalSeedId`
- `identityEvidenceStatus`

## Tests added / results

| Suite | Result |
| --- | --- |
| `@ckes/pipeline` evaluation-identity (4) | pass |
| `@ckes/benchmark` seed-mapping (4) incl. live-style false_merge | pass |
| `@ckes/harness` evaluation-capture integration (1) | pass |
| Existing benchmark (36) + harness (9) | pass |

**Demonstrated must-not-match:** `seed-mapping.test.ts` and `evaluation-capture.test.ts` — EQUIVALENT+admit with mapped forbidden `seedId` → `false_merge`.

**Missing evidence vs no-match:** `absent_no_merge` vs `absent_no_retrieval` distinct; no `benchmarkLocalSeedId` on DISTINCT path.

## Frozen G3 packs unchanged

Verified `contentHash` for all three official releases match G3 freeze values:

| Pack | Hash |
| --- | --- |
| Anchor | `2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c` |
| Statistical | `5e5d0af0a409548ba0f889f8c0f4d5d96334d2c2412d746a8a535ff057dfcc18` |
| Challenge | `00d339d3c33c09d6c2276ac9222c588d22c1a28d1510b2c310da8da40e954ecc` |

No edits under `benchmark/releases/**` JSON or Markdown in G3.1.

## Validation

- `npm run benchmark:validate` — OK (including release Markdown drift)
- `npm run benchmark:integrity` — leakage OK on frozen anchor pack

## CKES decision semantics

Adjudication and policy code paths unmodified. Post-decision evaluation field only. Harness seed load is test/benchmark setup, not a change to ranking or policy rules.

## Remaining limitations

- Identity capture reflects **primary retrieval match used by adjudication**, not a future first-class CKES “selected identity” if one is added later.
- `present_unmapped` if canonical label does not match any pack seed (reported explicitly; must-not-match scoring skipped).
- LLM adjudication path still uses top match in prompt; evaluation rule aligned with that path when merge outcome occurs.
- Multi-match disambiguation not modeled (POC adjudication does not disambiguate beyond `matches[0]`).

## Files changed (summary)

- `poc/packages/pipeline/src/evaluation-identity.ts`, `decision-slice.ts`, tests
- `poc/packages/benchmark/src/seed-mapping.ts`, tests, `package.json`
- `poc/packages/harness/src/pack-seeds.ts`, `evaluation-capture.ts`, `harness-runner.ts`, tests
- `poc/benchmark/schemas/benchmark-run-result.schema.json`
- This report

## Git commit

Recorded after commit.

## Next step

Architect may authorize **G4** official run matrix using frozen packs and updated evaluation capture.
