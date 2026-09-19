# Handover 03 G3 Freeze and G4 Readiness Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G3 Report

> **Status:** Submitted (G4 not authorized)
> **Owner:** Architecture Team
> **Applies To:** Handover 3 Gate G3
> **Last Reviewed:** 2026-09-19

## Authorization boundary

| Gate | Status |
| --- | --- |
| G3 Freeze official packs + derived Markdown | **Complete** |
| G4 Official benchmark execution | **Not performed** |
| G5 `reference_baseline_001` designation | **Not performed** |
| G6 Evidence manifest + governance closeout | **Not performed** |

## Official packs

| Pack ID | Version | Released scenarios | contentHash |
| --- | --- | ---: | --- |
| CKES-BENCHMARK-ANCHOR-001 | **1.0.0** | 40 | `2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c` |
| CKES-BENCHMARK-STATISTICAL-001 | **1.0.0** | 200 | `5e5d0af0a409548ba0f889f8c0f4d5d96334d2c2412d746a8a535ff057dfcc18` |
| CKES-BENCHMARK-CHALLENGE-001 | **1.0.0** | 80 | `00d339d3c33c09d6c2276ac9222c588d22c1a28d1510b2c310da8da40e954ecc` |

## Frozen artifact paths (authoritative JSON)

- `poc/benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.json`
- `poc/benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.json`
- `poc/benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.json`

## Derived Markdown paths

- `poc/benchmark/releases/anchor/CKES-BENCHMARK-ANCHOR-001.md`
- `poc/benchmark/releases/statistical/CKES-BENCHMARK-STATISTICAL-001.md`
- `poc/benchmark/releases/challenge/CKES-BENCHMARK-CHALLENGE-001.md`

Manifest: `poc/benchmark/releases/G3-FREEZE-MANIFEST.json` (frozenAt `2026-09-19T12:00:00.000Z`).

## G2 → G3 transition

- **No** changes to scenario expectations, `mustNotMatchIdentities`, candidates text, or decision classes — only pack/scenario **status** and pack **metadata** (`released`, `packVersion` 1.0.0, official names/descriptions).
- G2 architect approval event updated in each `provenance.json`: `humanApprovalEvent: g2-architect-accepted-2026-09-19`; `g3OfficialRelease` block added; `g3-freeze-record.json` per pack links candidate hash → official hash.
- Challenge `quarantine.json` and rejected `CHL-REJECT-001` **unchanged**; not in released pack (80 scenarios only).

## Markdown drift validation

`npm run benchmark:validate` — **OK** for all three release JSON + Markdown pairs (deterministic render at `2026-09-19T12:00:00.000Z`).

## Freeze-mode qualification

`npm run benchmark:qualify -- --mode=freeze` on each release pack:

| Pack | passed | freezeReady | released count |
| --- | --- | --- | ---: |
| Anchor | true | true | 40 |
| Statistical | true | true | 200 |
| Challenge | true | true | 80 |

## Leakage / integrity

`npm run benchmark:integrity` on each frozen JSON — **leakage passed** (all three).

## Provenance / review / holdout

| Artifact | Verified |
| --- | --- |
| `benchmark/generation/<packId>/provenance.json` | Updated with G3 release pointer + G2 acceptance |
| `benchmark/generation/<packId>/g3-freeze-record.json` | Created |
| `review-log.jsonl` | Preserved (unchanged content) |
| Challenge `quarantine.json` | Preserved |
| Challenge `holdout-process-controlled.json` | Preserved; `holdoutKind: process_controlled_tuning_holdout`, `notHidden: true`, `confidentialityEnforced: false` |

## CKES decision semantics

**No changes** to `poc/packages/pipeline/` or policy adjudication in G3.

## G4 readiness — `matchedSeedId` / must-not-match evidence

### Current behavior

1. **Scorer** (`scoreScenario`): `mustNotMatchIdentities` false-merge detection requires `actuals.matchedSeedId` to equal a forbidden local `seedId` ([`scoring.ts`](../../poc/packages/benchmark/src/scoring.ts)).
2. **Harness** passes `matchedSeedId: undefined` when scoring live runs ([`harness-runner.ts`](../../poc/packages/harness/src/harness-runner.ts)).
3. **Pipeline** `DecisionSliceResult` exposes `adjudicationClass`, `policyAction`, retrieval counts — **not** which canonical/seed identity was matched ([`decision-slice.ts`](../../poc/packages/pipeline/src/decision-slice.ts)).
4. **Run-result schema** stores `actualDecisionClass` and scoring metadata but **no** `matchedSeedId` / `matchedIdentityRef` field on scenario results.

### Determination

**Official G4 runs cannot fully evaluate `mustNotMatchIdentities` / adversarial false-merge traps using the qualified scorer alone**, even when the pipeline behaves correctly. False-merge classification may still trigger from `related_distinct` + merge policy heuristics, but **forbidden-identity violations are not detectable** without identity linkage in immutable run results.

Synthetic scorer unit tests **do** prove the scorer logic when `matchedSeedId` is supplied; that is **not** equivalent to live-run safety evidence.

### Recommended remediation (architect review — not implemented in G3)

Smallest **evaluation-only** change (does not alter adjudication/policy semantics):

1. Extend `DecisionSliceResult` with optional **`evaluationOnlyMatchedLabel`** or **`topRetrievalSeedId`** populated from the top `hybridRetrieve` match metadata (harness-facing, documented as non-canonical).
2. Persist in immutable run-result JSON under `scoring.evaluationCapture` (new optional schema fields).
3. Harness passes that field into `scoreScenario` as `matchedSeedId` **after** the slice completes.

**Do not begin G4 official runs** until this gap is accepted (e.g. interim scoring without must-not-match denominators) or remediated and re-qualified.

## Tests / validation executed

- `npm run benchmark:freeze-g3`
- `npm run benchmark:validate`
- `npm run benchmark:qualify -- --mode=freeze` (×3)
- `npm run benchmark:integrity` (×3)

## Files changed (summary)

- Added: `benchmark/releases/**` (6 JSON/MD + manifest), `scripts/freeze-g3-benchmark-packs.ts`, generation `g3-freeze-record.json` (×3), updated `provenance.json` (×3)
- Modified: `scripts/validate-benchmark-schemas.ts`, `benchmark/releases/README.md`, `poc/package.json`

## Git commit

**`0e93c13`** — Freeze Handover 3 G3 official benchmark packs and derived Markdown.

## Limitations

- Official content hashes differ from G2 candidate hashes due to **metadata-only** release transition (expected).
- G2 candidate copies under `benchmark/candidates/` retained for audit; **releases/** are authoritative for G4+.
- Holdout expectations remain visible in-repo (process-controlled holdout only).

## Next step

Architect: authorize **G4** only after decision on `matchedSeedId` remediation or explicit scoring scope limitation for official runs.
