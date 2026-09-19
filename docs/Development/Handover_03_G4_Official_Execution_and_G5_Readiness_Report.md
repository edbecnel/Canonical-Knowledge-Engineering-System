# Handover 03 G4 — Official Execution and G5 Readiness Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G4 Report

> **Status:** Submitted for architect review (G5 not authorized)
> **Owner:** Architecture Team
> **Applies To:** G4 official frozen benchmark matrix
> **Last Reviewed:** 2026-09-19

## Authorization boundary

| Gate | Status |
| --- | --- |
| G4 Official benchmark execution | **Complete** |
| G5 `reference_baseline_001` designation | **Not performed** |
| G6 Evidence manifest + governance closeout | **Not performed** |
| Warm official run (`RUN-REF-WARM-*`) | **Not executed** (supplementary; prerequisites not asserted) |

`reference_baseline_001` was **not** designated. No G6 baseline evidence manifest was finalized.

---

## Pre-execution verification (all passed before first run)

| Check | Result |
| --- | --- |
| Frozen pack hashes vs `G3-FREEZE-MANIFEST.json` | **PASS** (Anchor, Statistical, Challenge) |
| Run profile `CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001` validates; `dryRun: false` | **PASS** |
| Profile content hash (frozen template incl. `REPLACE_AT_EXECUTION` anchor) | `a69d5677856931ab7617ef64eb0072e2fb1b52254952077035d0acbcc14586de` |
| Scorer `1.0.0-g1` / content hash | `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| Harness `@ckes/harness` version | `0.1.0` |
| Pipeline `@ckes/pipeline` version | `0.1.0` |
| CKES git commit under test | `291d35f18d7d1e1d461b82decdfb57ac7e564f22` |
| Leakage (`verifyScenarioLeakage`) on all three packs | **PASS** |
| G3.1 `evaluation-identity` module present | **PASS** |
| Serial isolation (`concurrency: 1`, `truncate_between_scenarios`) | **Configured** (REF-CLEAN profile) |

Artifact: `poc/experiments/baseline-evidence/g4-official-runs/G4-PRE-FLIGHT.json`

Post-G3 pack integrity: `npm run benchmark:validate` and `benchmark:qualify --mode=freeze` on releases remain **PASS**. **No** frozen pack JSON/Markdown edits.

---

## Official runs executed

| Official run ID | Pack | Scenarios | Immutable result path | SHA-256 (file) |
| --- | --- | ---: | --- | --- |
| `RUN-REF-CLEAN-ANCHOR-001` | CKES-BENCHMARK-ANCHOR-001 v1.0.0 | 40/40 | `poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-ANCHOR-001.json` | `7e10d14d39fe768c1e80d142e59b0c371d346df32db1c25b3e8225e80532524b` |
| `RUN-REF-CLEAN-STAT-001` | CKES-BENCHMARK-STATISTICAL-001 v1.0.0 | 200/200 | `poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-STAT-001.json` | `7764a25448f9293d936c41deb548081354e72aa8ea139acb57a14477cd73a26d` |
| `RUN-REF-CLEAN-CHALLENGE-001` | CKES-BENCHMARK-CHALLENGE-001 v1.0.0 | 80/80 | `poc/experiments/baseline-evidence/g4-official-runs/RUN-REF-CLEAN-CHALLENGE-001.json` | `4e68448916dd75efc72da5a95db364db892a900064784969ca0b87e4102d88c2` |

Derived reports (non-mutating): same directory, `*.derived-report.json` / `*.derived-report.md`.

Execution driver: `npm run benchmark:g4-official` (`poc/scripts/g4-official-execute.ts`). Summary: `G4-EXECUTION-SUMMARY.json`.

Each run records: `dryRun: false`, `lifecycleState: completed`, matching `packContentHash` to G3 manifest, `runProfileContentHash` above, `scorerVersion: 1.0.0-g1`, `retrievalMode: deterministic_fixture`, `databaseProfile: clean`.

---

## Trial / budget compliance

- Profile trial policy snapshot persisted on each run (`trialPolicySnapshot`).
- Scenarios with completed trials: `trialsCompleted === trialsRequested` for all non–`infrastructure_error` / non–`not_evaluated` rows.
- No run ended `completed_partial` or cost-ceiling invalidation.
- **Exception:** `full_pipeline` scenarios that failed before trial dispatch have **no** `trialsRequested` — counted as infrastructure failures (see defects).

---

## Infrastructure failures

| Run | Count | Scenario IDs | Cause |
| --- | ---: | --- | --- |
| Anchor | 2 | `ANC-0017`, `ANC-0034` | `full_pipeline requires sourceText` |
| Statistical | 11 | `STA-0017`, `STA-0034`, `STA-0051`, `STA-0068`, `STA-0085`, `STA-0102`, `STA-0119`, `STA-0136`, `STA-0153`, `STA-0170`, `STA-0187` | Same |
| Challenge | 4 | `CHL-0017`, `CHL-0034`, `CHL-0051`, `CHL-0068` | Same |

These are **infrastructure / harness–pipeline integration** failures, not scored CKES decision outcomes. They remain visible in immutable JSON as `outcome: infrastructure_error`.

---

## Aggregate safety and accuracy (qualified scorer on live results)

Wilson 95% CI on **evaluated** scenarios (excludes `not_evaluated`; includes infra rows in denominator per derived report).

### Anchor (`RUN-REF-CLEAN-ANCHOR-001`)

| Metric | Value |
| --- | --- |
| Pass / fail | 16 / 22 (+ 2 infra) |
| False-merge count / rate | 17 / **42.5%** (95% CI **28.5%–57.8%**) |
| Missed-match | 4 |
| Unnecessary deferral | 1 |
| Must-not-match violations (false_merge where pack declares `mustNotMatchIdentities`) | **4** (`ANC-0018`, `ANC-0019`, `ANC-0020`, `ANC-0031`) |
| Critical false-merge IDs | `ANC-0018`, `ANC-0019`, `ANC-0020` |
| High false-merge IDs | (none) |

### Statistical (`RUN-REF-CLEAN-STAT-001`)

| Metric | Value |
| --- | --- |
| Pass / fail | 100 / 89 (+ 11 infra) |
| False-merge count / rate | 57 / **28.5%** (95% CI **22.7%–35.1%**) |
| Missed-match | 24 |
| Unnecessary deferral | 8 |
| Must-not-match violations | **11** (e.g. `STA-0014`, `STA-0030`, `STA-0062`, `STA-0078`, `STA-0094`, …) |
| High false-merge IDs | `STA-0030`, `STA-0110`, `STA-0190` |

### Challenge (`RUN-REF-CLEAN-CHALLENGE-001`) — process-controlled tuning holdout

Holdout metadata unchanged: `benchmark/generation/CKES-BENCHMARK-CHALLENGE-001/holdout-process-controlled.json` (`holdoutKind: process_controlled_tuning_holdout`).

| Metric | Value |
| --- | --- |
| Pass / fail | 8 / 68 (+ 4 infra) |
| False-merge count / rate | 20 / **25.0%** (95% CI **16.8%–35.5%**) |
| Missed-match | 2 |
| Unnecessary deferral | 46 |
| Must-not-match violations | **6** (`CHL-0012`, `CHL-0024`, `CHL-0026`, `CHL-0048`, `CHL-0060`, `CHL-0072`) |
| Critical false-merge IDs | `CHL-0012`, `CHL-0024`, `CHL-0048`, `CHL-0060`, `CHL-0072` |
| High false-merge IDs | `CHL-0033` |

---

## G3.1 evaluation identity evidence

### Summary by `identityEvidenceStatus`

| Run | present_mapped | present_unmapped | absent_no_merge | absent_no_retrieval | missing_capture* |
| --- | ---: | ---: | ---: | ---: | ---: |
| Anchor | 28 | **1** | 3 | 6 | 2 |
| Statistical | 121 | **15** | 11 | 42 | 11 |
| Challenge | 19 | **4** | 0 | 53 | 4 |

\*`missing_capture` = `infrastructure_error` rows (no `evaluationCapture` block).

### Every `present_unmapped` occurrence (reported separately)

Canonical label did not map to a pack `seedId` via `normalizeLabel`; **not** treated as “no matched identity.”

| Scenario | Canonical label |
| --- | --- |
| ANC-0025 | onion |
| STA-0007, STA-0029, STA-0073, STA-0095, STA-0117, STA-0139, STA-0183 | onion |
| STA-0011, STA-0033, STA-0055, STA-0077, STA-0099, STA-0121, STA-0143, STA-0165 | Stock |
| CHL-0011, CHL-0033, CHL-0055, CHL-0077 | Stock |

**Implication:** `mustNotMatchIdentities` scoring may be **skipped** for forbidden seeds when mapping is `present_unmapped` even though CKES reported a merge-class identity ref.

---

## Post-execution verification

| Check | Anchor | Statistical | Challenge |
| --- | --- | --- | --- |
| Pack hash in result = G3 manifest | ✓ | ✓ | ✓ |
| Profile hash | ✓ | ✓ | ✓ |
| All released scenarios have terminal outcome | ✓ | ✓ | ✓ |
| `dryRun == false` | ✓ | ✓ | ✓ |
| Leakage (pre-run) | ✓ | ✓ | ✓ |
| Structural completeness (`verifyRunCompleteness`) | ✓ | ✓ | ✓ |

`assertDesignatableReferenceBaseline` (structural only: not dry-run, lifecycle completed) **passes** on anchor — **this does not imply G5 safety or quality gates pass.**

---

## Behavioral defects / anomalies (no CKES tuning performed)

1. **`full_pipeline` integration gap:** Released scenarios with `executionMode: full_pipeline` fail immediately (`sourceText` not projected into pipeline input). Affects 2 + 11 + 4 scenarios across suites.
2. **Elevated false-merge rates** under `deterministic_fixture` + current POC adjudication/policy (documented pre-baseline inventory applies).
3. **Label / seed normalization drift:** Retrieval returns labels (`onion`, `Stock`) that do not match pack seed material labels → `present_unmapped`.
4. **Challenge suite:** Very high deferral rate (46/80) — routing behavior, not infra.

Official evidence preserved; **no** silent rerun and **no** pipeline changes during G4.

---

## Frozen benchmark packs

G3 `contentHash` values **unchanged**. G4 did not modify `benchmark/releases/**`.

---

## CKES decision semantics

G4 added only harness orchestration (`runId` override, G4 driver script). **No** changes to retrieval, adjudication, policy, or G3.1 evaluation capture logic during execution.

---

## G5 designation recommendation (anchor baseline validity)

**Recommendation: `RUN-REF-CLEAN-ANCHOR-001` is NOT eligible for G5 `reference_baseline_001` designation** based on approved validity gates:

| Gate | Anchor run |
| --- | --- |
| Completed clean run, `dryRun: false` | ✓ |
| Full pack executed (40 scenarios) | ✓ |
| No unresolved infrastructure failure | **✗** (2 `full_pipeline` scenarios) |
| False-merge safety (critical / high) | **✗** (3 critical false merges) |
| Must-not-match violations | **✗** (4 scored violations) |
| Identity evidence complete for safety scoring | **✗** (`present_unmapped` on `ANC-0025`) |

Failed/partial safety posture requires investigation before G5; designation must not proceed on this run without architect override.

---

## Files added/changed (G4 tooling + evidence)

- `poc/scripts/g4-official-execute.ts`
- `poc/package.json` (`benchmark:g4-official`)
- `poc/packages/harness/src/harness-runner.ts` (optional official `runId`)
- `poc/experiments/baseline-evidence/g4-official-runs/*` (immutable results + derived reports + summaries)
- This report

## Git commit

- `93549f85b0ef1e95de31b2cb22694a63ffdac92e` — G4 driver, immutable results, derived reports, this document

Official runs were executed at CKES git `291d35f18d7d1e1d461b82decdfb57ac7e564f22` (recorded in each run header).

---

## Next step

Architect may authorize **G5** only after reviewing safety failures, infra defects, and `present_unmapped` handling — not automatically from G4 completion alone.
