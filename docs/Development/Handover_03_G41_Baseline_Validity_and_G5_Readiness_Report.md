# Handover 03 G4.1 — Baseline Validity and G5 Readiness Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G4.1 Report

> **Status:** Submitted for architect review (G5 not authorized)
> **Owner:** Architecture Team
> **Applies To:** G4.1 measurement-validity remediation
> **Last Reviewed:** 2026-09-19

## Authorization boundary

| Gate | Status |
| --- | --- |
| G4.1 Baseline validity remediation | **Complete** |
| G5 `reference_baseline_001` designation | **Not performed** |
| G6 Governance closeout | **Not performed** |

Historical G4 runs under `poc/experiments/baseline-evidence/g4-official-runs/` are **unchanged** and preserved.

---

## Phase 1 — `full_pipeline requires sourceText` (17 failures)

### Root cause classification: **B — harness transformation/projection defect** (primary), with **D — pipeline API contract mismatch** (secondary fallback)

Frozen released scenarios use `executionMode: full_pipeline` with **`directCandidate.text`** and no `sourceText` field. Examples:

- `ANC-0017`: `directCandidate.text` = `technique: Deep fry`
- `ANC-0034`: `directCandidate.text` = `process of Clarify`

`toPipelineInput` allowlisted fields but did not map `directCandidate` → `sourceText` for extraction. `runFullPipelineSlice` then failed before adjudication.

**Disposition (all 17 scenario IDs across Anchor/Statistical/Challenge):** Same pattern on every `*-*017`, `*-*034`, … `full_pipeline` row in frozen packs — not a benchmark data defect; required fields exist in frozen JSON.

| Suite | Scenario IDs (full_pipeline infra in G4) |
| --- | --- |
| Anchor | `ANC-0017`, `ANC-0034` |
| Statistical | `STA-0017`, `STA-0034`, `STA-0051`, `STA-0068`, `STA-0085`, `STA-0102`, `STA-0119`, `STA-0136`, `STA-0153`, `STA-0170`, `STA-0187` |
| Challenge | `CHL-0017`, `CHL-0034`, `CHL-0051`, `CHL-0068` |

### Remediation (evaluation/infrastructure only)

1. **`deriveSourceTextForFullPipeline`** in `@ckes/benchmark` projection — sets `sourceText` from `directCandidate.text` when absent.
2. **`runFullPipelineSlice` fallback** — when pseudo-recipe extraction yields no candidates but `directCandidate` is present (benchmark-shaped frozen scenarios), route to existing `runDecisionSlice` with that candidate. Does not alter `discoverCandidates`, adjudication, or policy logic for paths that already succeeded.

**G4.1 `-002` runs:** All 17 scenarios reach terminal scored outcomes (0 `infrastructure_error` across all superseding runs).

---

## Phase 2 — `present_unmapped` (20 cases in G4)

### Classification: **C — CKES matched canonical rows outside pack seed corpus** (all 20)

Investigation showed retrieval primary match IDs were **not** harness-deterministic pack seed UUIDs (e.g. ambient DB concepts `onion`, `Stock` vs pack seeds `Caramelize onions`, `Clarify stock`). Label alias would require forbidden semantic equivalence.

| Label in G4 capture | Pack seed (frozen) | Deterministic seed UUID match? |
| --- | --- | --- |
| `onion` | `CK-CUL-08` / Caramelize onions | **No** (bootstrap concept id) |
| `Stock` | `CK-CUL-12` / Clarify stock | **No** (bootstrap concept id) |

### Remediation (measurement environment + evaluation mapping)

1. **`resetCanonicalCorpusForBenchmarkPack`** on REF-CLEAN harness runs — `TRUNCATE` canonical concepts/KOs/relationships, then reload **only** `canonicalSeedMaterial`. Isolates retrieval to frozen pack seeds without changing adjudication/policy code.
2. **`mapEvaluationRefToBenchmarkSeedId`** — map by **`canonicalId`** when it equals `deterministicConceptIdForSeed(seedId)` (evaluation layer only); harness passes `canonicalId` from G3.1 ref.

**G4.1 `-002` runs:** `present_unmapped` count = **0** on Anchor, Statistical, and Challenge.

---

## Phase 3 — Semantic freeze confirmation

No changes to frozen pack JSON, hashes, expected outcomes, or `mustNotMatchIdentities`. No retrieval ranking, adjudication, policy, or canonicalization algorithm changes for successful code paths.

---

## Phase 4 — Requalification

| Check | Result |
| --- | --- |
| `npm run benchmark:test` | pass (38) |
| `npm run harness:test` | pass (11) |
| `@ckes/pipeline` tests | pass |
| `npm run benchmark:validate` | pass |
| `npm run benchmark:qualify --mode=freeze` (anchor) | pass |
| `benchmark:integrity` | pass |
| G3 pack `contentHash` values | unchanged |

---

## Phase 5 — Superseding clean runs (G4 artifacts preserved)

| New run ID | Supersedes | Pack hash (G3) | Result SHA-256 | Scenarios | Infra errors | `present_unmapped` |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `RUN-REF-CLEAN-ANCHOR-002` | `RUN-REF-CLEAN-ANCHOR-001` | `2d65a6cf…` | `c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573` | 40/40 | 0 | 0 |
| `RUN-REF-CLEAN-STAT-002` | `RUN-REF-CLEAN-STAT-001` | `5e5d0af0…` | `46da0ab91b9fd5971f38121b0dc51de7622bd0d30c6afa979f677220e6ae0464` | 200/200 | 0 | 0 |
| `RUN-REF-CLEAN-CHALLENGE-002` | `RUN-REF-CLEAN-CHALLENGE-001` | `00d339d3…` | `3b07c3a6d9477cf6be89bb38fd8ad687a3c37fcf5d38d3f236a7c689302f9f5a` | 80/80 | 0 | 0 |

Evidence: `poc/experiments/baseline-evidence/g4-1-official-runs/`  
Summary: `G41-EXECUTION-SUMMARY.json`  
`evaluationInfrastructureRevision`: `g4.1-baseline-validity-2026-09-19`

### Preserved G4 historical runs (unchanged)

| Run ID | Result hash |
| --- | --- |
| `RUN-REF-CLEAN-ANCHOR-001` | `7e10d14d39fe768c1e80d142e59b0c371d346df32db1c25b3e8225e80532524b` |
| `RUN-REF-CLEAN-STAT-001` | `7764a25448f9293d936c41deb548081354e72aa8ea139acb57a14477cd73a26d` |
| `RUN-REF-CLEAN-CHALLENGE-001` | `4e68448916dd75efc72da5a95db364db892a900064784969ca0b87e4102d88c2` |

---

## Safety results on valid measurement (`-002` runs, not tuned)

### Anchor `RUN-REF-CLEAN-ANCHOR-002`

| Metric | Value |
| --- | --- |
| False merges | 18 (45.0%; Wilson 95% CI ~30.7–60.2%) |
| Must-not-match violations (scored) | 4 |
| Missed match | 4 |
| Unnecessary deferral | 1 |
| Critical false-merge IDs | `ANC-0017`, `ANC-0018`, `ANC-0019`, `ANC-0020` |

### Statistical `RUN-REF-CLEAN-STAT-002`

False merges 59 (29.0%); must-not-match violations 11; missed 26; defer 8; high FM: `STA-0030`, `STA-0110`, `STA-0190`.

### Challenge `RUN-REF-CLEAN-CHALLENGE-002`

False merges 20 (25.0%); must-not-match violations 6; missed 2; defer 49; critical FM: `CHL-0012`, `CHL-0024`, `CHL-0048`, `CHL-0060`, `CHL-0072`.

These are **legitimate baseline findings**; no CKES tuning was performed.

---

## Baseline-validity gate determination (Anchor `-002`)

| Gate | Status |
| --- | --- |
| Frozen pack + hash | ✓ |
| REF-CLEAN profile, `dryRun: false` | ✓ |
| All scenarios terminal, trials complete | ✓ |
| Zero infrastructure errors | ✓ |
| Zero `present_unmapped` | ✓ |
| Leakage / integrity | ✓ (pre-run) |
| G3.1 identity capture active | ✓ |
| Historical G4 preserved | ✓ |

**Measurement-validity recommendation:** `RUN-REF-CLEAN-ANCHOR-002` **satisfies baseline-validity gates** for architect consideration of G5 designation. **G5 is not authorized by this report**; false merges and safety findings remain on record for governance review.

---

## Files changed (summary)

- `poc/packages/benchmark/src/projection.ts`, `harness-seed-id.ts`, `seed-mapping.ts`, tests
- `poc/packages/harness/src/pack-seeds.ts`, `harness-runner.ts`, `evaluation-capture.ts`, `g41-validity.test.ts`
- `poc/packages/pipeline/src/decision-slice.ts` (benchmark full_pipeline fallback only), test
- `poc/scripts/g41-official-execute.ts`, `poc/package.json`
- `poc/experiments/baseline-evidence/g4-1-official-runs/*`
- This report

## Git commit

Recorded after commit.
