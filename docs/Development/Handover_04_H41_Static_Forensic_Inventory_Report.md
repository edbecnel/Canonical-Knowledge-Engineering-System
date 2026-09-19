# Handover 04 H4.1 — Static Forensic Inventory Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › H4.1 Report

> **Status:** Complete — **H4.2 not authorized**
> **Gate:** H4.1 only (static inventory)
> **Generated:** 2026-09-19

## Confirmations

| Item | Status |
| --- | --- |
| New benchmark runs executed | **No** |
| Debug mode used | **No** |
| CKES behavioral / pipeline changes | **No** |
| Frozen packs / RB001 runs / designation / manifest mutated | **No** (verified) |

---

## Immutability verification

Executed as part of [`h41-static-inventory.ts`](../../poc/scripts/h41-static-inventory.ts):

| Artifact | Check |
| --- | --- |
| `CKES-BENCHMARK-ANCHOR-001` pack `contentHash` | `2d65a6cf…` — OK |
| `RUN-REF-CLEAN-ANCHOR-002` file SHA-256 | `c5e690b2…` — OK |
| `reference_baseline_001` designation sidecar | `0e085fef…` — OK |
| `REFERENCE-BASELINE-001-evidence-manifest.json` `manifestSha256` | `67ff1509…` — OK |

Supporting `-002` run hashes verified in script constants (not re-written).

---

## Anchor complete failure inventory (40 scenarios)

Source: immutable [`RUN-REF-CLEAN-ANCHOR-002.json`](../../poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json) + frozen Anchor pack.

| Outcome / classification | Count |
| --- | ---: |
| pass | 17 |
| false_merge | **18** |
| missed_match | 4 |
| unnecessary_deferral | 1 |
| **Total scenarios** | **40** |

Full per-scenario rows: [`H41-INVENTORY-SUMMARY.json`](../../poc/experiments/forensics/H41-INVENTORY-SUMMARY.json) → `anchorFailureInventory`.

**Missed-match IDs:** `ANC-0002`, `ANC-0009`, `ANC-0016`, `ANC-0030` (static only; not deep-dived at H4.1).

**Unnecessary deferral:** `ANC-0026`.

---

## False merges — 18/18 `FM-ANC-*` records

**Confirmed:** all 18 false-merge scenarios have static records under  
[`poc/experiments/forensics/anchor-false-merges/`](../../poc/experiments/forensics/anchor-false-merges/).

| scenarioId | transformationType (pack) | domain | executionMode | expected | actual class | matched seed (eval) |
| --- | --- | --- | --- | --- | --- | --- |
| ANC-0017 | related_distinct | culinary | full_pipeline | related_distinct | EQUIVALENT | CK-CUL-01 |
| ANC-0018 | adversarial_false_merge_candidate | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-01 (forbidden) |
| ANC-0019 | adversarial_false_merge_candidate | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-02 (forbidden) |
| ANC-0020 | adversarial_false_merge_candidate | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-03 (forbidden) |
| ANC-0023 | contradiction | culinary | decision_slice | contradict_existing | EQUIVALENT | CK-CUL-03 |
| ANC-0024 | qualification | culinary | decision_slice | qualify_existing | EQUIVALENT | CK-CUL-04 |
| ANC-0025 | emerging_process_revalidation | culinary | decision_slice | revalidation_candidate | SUBSUMED_BY_EXISTING | CK-CUL-08 |
| ANC-0027 | objective_to_method | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-04 |
| ANC-0028 | method_to_objective | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-05 |
| ANC-0029 | compound_assertion | culinary | decision_slice | related_distinct | EQUIVALENT | CK-CUL-06 |
| ANC-0031 | adversarial_false_merge_candidate | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-01 (forbidden) |
| ANC-0032 | paraphrase_same_identity | culinary | decision_slice | related_distinct | EQUIVALENT | CK-CUL-07 |
| ANC-0033 | narrow_applicability | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-06 |
| ANC-0035 | narrow_applicability | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-07 |
| ANC-0036 | broaden_applicability | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-08 |
| ANC-0037 | change_subject_object_context | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-09 |
| ANC-0039 | supporting_observation | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-10 |
| ANC-0040 | irrelevant_near_neighbor | electronics | decision_slice | related_distinct | EQUIVALENT | CK-ELS-11 |

### Provisional causal posture (H4.1)

For **all 18** FM records at H4.1:

- **primaryCausalCategory:** `unknown_unresolved` (no manufactured certainty)
- **diagnosisConfidence:** `low` (except must-not-match rows note `medium` for forbidden-seed match visibility in eval capture)
- **debugInvestigationRequired:** `true` for all 18
- **Contributing tags (static):** merge adjudication class emitted; policy merge action where applicable; scorer-visible manifestation; forbidden seed matched on MNMT overlap scenarios

**First-divergence layer** cannot be established from immutable JSON alone; flagged for H4.2/H4.3.

---

## Must-not-match — four inventories

Files: [`must-not-match/MNMT-ANC-*.json`](../../poc/experiments/forensics/must-not-match/)

| scenarioId | forbidden seed | eval mapped seed | forbiddenSeedMatched |
| --- | --- | --- | --- |
| ANC-0018 | CK-ELS-01 | CK-ELS-01 | **true** |
| ANC-0019 | CK-ELS-02 | CK-ELS-02 | **true** |
| ANC-0020 | CK-ELS-03 | CK-ELS-03 | **true** |
| ANC-0031 | CK-ELS-01 | CK-ELS-01 | **true** |

**Static findings (not conclusions):**

- Pipeline/run JSON shows merge-class outcomes and **post-hoc** evaluation mapping to forbidden benchmark seeds.
- No artifact shows CKES **consumed** must-not-match constraints during decision-making.
- **negativeIdentityMechanismConclusion:** `not_determined_at_h4_1` for all four.

---

## Supporting suites — aggregate inventory

| Suite | Run | false_merge | unnecessary_deferral | present_unmapped |
| --- | --- | ---: | ---: | ---: |
| Statistical | `RUN-REF-CLEAN-STAT-002` | 59 | 8 | 0 |
| Challenge | `RUN-REF-CLEAN-CHALLENGE-002` | 20 | **49** | 0 |

Artifacts:

- [`STAT-002-aggregate.json`](../../poc/experiments/forensics/supporting-suites/STAT-002-aggregate.json)
- [`CHL-002-aggregate.json`](../../poc/experiments/forensics/supporting-suites/CHL-002-aggregate.json)

Derived reports remain under `g4-1-official-runs/*.derived-report.json`.

---

## Challenge unnecessary-deferral inventory

- **Count:** 49 / 80 scenarios (`61.25%` unnecessary deferral rate in derived report)
- **Inventory file:** [`CHL-002-unnecessary-deferral-inventory.json`](../../poc/experiments/forensics/supporting-suites/CHL-002-unnecessary-deferral-inventory.json)
- **Dimensions captured for H4.2 stratification:** domain, executionMode, full scenario ID list
- **Static hypotheses reserved for later gates:** confidence behavior, adjudication uncertainty, policy routing, insufficient evidence, challenge construction, unknown

No deferral remediation attempted.

---

## Evidence-gap inventory

[`H41-EVIDENCE-GAP-INVENTORY.json`](../../poc/experiments/forensics/H41-EVIDENCE-GAP-INVENTORY.json)

**Global gaps** (not recoverable from immutable run JSON today):

- Complete ranked retrieval candidates and scores
- Adjudication confidence, rationale, prompt/response
- Policy confidence inputs and rule trace
- Full candidate structured attributes
- Full-pipeline intermediate extraction artifacts

Informs H4.2, H4.3, and optional H4.O — **no instrumentation implemented**.

---

## Deep-investigation candidates (for architect H4.2 authorization)

[`H41-DEEP-INVESTIGATION-CANDIDATES.json`](../../poc/experiments/forensics/H41-DEEP-INVESTIGATION-CANDIDATES.json)

- **Tier 0:** `ANC-0017`, `ANC-0018`, `ANC-0019`, `ANC-0020`, `ANC-0031`
- **All 18 FM:** causal attribution pending
- **Challenge deferral:** suggest stratified sample from deferral list for H4.2+

---

## Artifacts created

| Path | Description |
| --- | --- |
| `poc/experiments/forensics/anchor-false-merges/FM-ANC-*.json` | 18 records |
| `poc/experiments/forensics/must-not-match/MNMT-ANC-*.json` | 4 records |
| `poc/experiments/forensics/supporting-suites/*` | Stat/Chl aggregates + deferral inventory |
| `poc/experiments/forensics/H41-*.json` | Summary, gaps, candidates |
| `poc/experiments/forensics/README.md` | Index |
| `poc/scripts/h41-static-inventory.ts` | Regenerator (static only) |
| This report | H4.1 stop report |

---

## Git commit

`0fcd46a4a7575b0ef1ec008e015cb9da0b1c3be5` — Complete Handover 04 H4.1 static forensic inventory from RB001 evidence.

---

## STOP

**H4.2 not begun.** Await architect review and explicit H4.2 authorization.
