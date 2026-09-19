# Handover 03 G5 — Reference Baseline Designation and G6 Readiness Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G5 Report

> **Status:** Submitted for architect review (G6 not authorized)
> **Owner:** Architecture Team
> **Applies To:** G5 `reference_baseline_001` designation
> **Last Reviewed:** 2026-09-19

## Authorization boundary

| Gate | Status |
| --- | --- |
| G5 `reference_baseline_001` designation | **Complete** |
| G6 Evidence manifest + governance closeout | **Not performed** |

---

## Designation

| Field | Value |
| --- | --- |
| **Designation ID** | `reference_baseline_001` |
| **Designated run ID** | `RUN-REF-CLEAN-ANCHOR-002` |
| **Designation event ID** | `ad7539ba-699b-432d-ab36-af4f20bbed43` |
| **Designated at** | `2026-09-19T08:38:43.696Z` |
| **Architect authorization** | G5 authorized 2026-09-19 — Handover 03 architect review |

### Sidecar artifacts (append-only; run JSON not modified)

| Artifact | Path |
| --- | --- |
| Append-only log | `poc/experiments/reference-designations/designations.jsonl` |
| Per-run snapshot | `poc/experiments/reference-designations/reference-RUN-REF-CLEAN-ANCHOR-002.json` |
| Canonical designation record | `poc/experiments/reference-designations/reference_baseline_001.json` |
| Pre-designation verification | `poc/experiments/reference-designations/G5-PRE-DESIGNATION-VERIFICATION.json` |
| **Designation sidecar SHA-256** | `0461b8609271179954cd5211d608f9c88b2fbae72f3249d662c4aff18ed3e149` |

### Immutable designated run

| Field | Value |
| --- | --- |
| Path | `poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json` |
| SHA-256 | `c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573` |
| Post-designation hash check | **Unchanged** (verified) |

---

## Anchors verified immediately before designation

| Anchor | Value |
| --- | --- |
| Anchor pack | `CKES-BENCHMARK-ANCHOR-001` v1.0.0 |
| Pack content hash | `2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c` |
| Run profile | `CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001` |
| Profile hash | `a69d5677856931ab7617ef64eb0072e2fb1b52254952077035d0acbcc14586de` |
| Scorer | `1.0.0-g1` / `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| CKES git commit (in run) | `956c93f9e7b2e2a519fbc8a909667df9de8f454c` |
| Pipeline / harness packages | `0.1.0` / `0.1.0` |
| Evaluation infrastructure | `g4.1-baseline-validity-2026-09-19` |

### Validity checks

| Check | Result |
| --- | --- |
| 40/40 Anchor scenarios | ✓ |
| Trial completion | ✓ |
| Infrastructure errors | **0** |
| `present_unmapped` | **0** |
| `dryRun == false` | ✓ |
| Leakage (`verifyScenarioLeakage`) | ✓ |
| Completeness (`verifyRunCompleteness`) | ✓ |
| `assertDesignatableReferenceBaseline` | ✓ |
| Frozen pack / run JSON unmodified | ✓ |

---

## Preserved baseline findings (not sanitized)

From designated run + derived report:

| Metric | Value |
| --- | --- |
| False merges | **18** (**45.0%**; Wilson 95% CI ~30.7–60.2%) |
| Must-not-match violations | **4** (`ANC-0018`, `ANC-0019`, `ANC-0020`, `ANC-0031`) |
| Critical false-merge IDs | `ANC-0017`, `ANC-0018`, `ANC-0019`, `ANC-0020` |
| Missed match | 4 |
| Unnecessary deferral | 1 |

These reflect pre-improvement CKES behavior under REF-CLEAN measurement and are recorded in the designation sidecar `preservedBaselineFindings`.

---

## Lineage: `RUN-REF-CLEAN-ANCHOR-001`

| Field | Value |
| --- | --- |
| Status | **Not designated** — preserved G4 historical evidence |
| Reason | G4 measurement-validity defects (infra + `present_unmapped`) |
| Immutable hash | `7e10d14d39fe768c1e80d142e59b0c371d346df32db1c25b3e8225e80532524b` |
| Path | `poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-ANCHOR-001.json` |

`reference_baseline_001` names the **first designated** reference baseline; the run ID suffix `002` is intentional.

---

## What G5 did not do

- No `REFERENCE-BASELINE-001-evidence-manifest.json` (G6)
- No ADR / normative principle ratification from benchmark results
- No CKES tuning or post-baseline experiments
- No changes to frozen packs, run-result JSON, or decision semantics

---

## Files changed

- `poc/scripts/g5-designate-reference-baseline.ts`
- `poc/package.json` (`benchmark:g5-designate`)
- `poc/experiments/reference-designations/*` (new designation artifacts)
- This report

## Tests / validation

- `npm run benchmark:g5-designate` (pre-check + designation)
- `npm run harness:test` — pass
- Run-result SHA-256 unchanged after designation

## Git commit

Recorded after commit.
