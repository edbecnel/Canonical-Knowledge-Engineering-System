# Handover 04 H4.2 — Causal Clustering and Investigation Selection Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › H4.2 Report

> **Status:** Complete — **H4.3 not authorized**
> **Gate:** H4.2 only (clustering / experiment selection)
> **Generated:** 2026-09-19

## Confirmations

| Item | Status |
| --- | --- |
| New benchmark / reproduction runs | **No** |
| Debug mode used | **No** |
| CKES behavioral changes | **No** |
| Root cause established | **No** (by design) |

Immutability re-verified in [`h42-causal-clustering.ts`](../../poc/scripts/h42-causal-clustering.ts) (same anchors as H4.1).

---

## H4.2 questions answered (static)

| Question | Answer (provisional) |
| --- | --- |
| Shared structural mechanisms? | Nine mechanism-oriented clusters (see registry); heavy overlap between MNMT adversarial, EQUIVALENT+reuse, and SUBSUMED+reject patterns |
| Materially different failures? | Yes — contradiction (`ANC-0023`), full_pipeline outlier (`ANC-0017`), MNMT safety quartet, direction/scope families |
| Greatest diagnostic value? | Tier 0 + representatives with pass controls (`ANC-0038`/`ANC-0027`, `ANC-0030`/`ANC-0040`) |
| Answerable statically? | Pipeline uses `matches[0]` only; deterministic adjudication collapse rules; `mustNotMatchIdentities` excluded from projection |
| Requires repro + Debug? | First-divergence layer per scenario; retrieval rank; live adjudication branch |
| Minimum H4.3 set? | **32** matrix rows — **24** Debug-required (not all 18 FMs individually if representatives + controls suffice for some clusters) |

---

## Anchor 18-FM cluster registry

Full JSON: [`poc/experiments/forensics/h42/H42-ANCHOR-FM-CLUSTER-REGISTRY.json`](../../poc/experiments/forensics/h42/H42-ANCHOR-FM-CLUSTER-REGISTRY.json)

| clusterId | Name | Members | Plausible shared mechanism |
| --- | --- | --- | --- |
| CL-MNMT-ADVERSARIAL | Must-not-match adversarial | 0018, 0019, 0020, 0031 | Literal/overlap candidate vs forbidden seed; MNMT scorer-only |
| CL-EQUIV-REUSE | EQUIVALENT + reuse_existing | 0017, 0018–0020, 0024, 0028, 0031–0032, 0036, 0040 | Merge class + policy reuse |
| CL-SUBSUMED-REJECT | SUBSUMED + reject_new_identity | 0023, 0025, 0027, 0029, 0033, 0035, 0037, 0039 | Subsumption signal vs benchmark non-merge expectation |
| CL-RELATION-DIRECTION | Objective/method direction | 0027, 0028, 0039 | Directional semantic role confusion |
| CL-SCOPE-QUALIFIER | Scope / qualification | 0024, 0035, 0036 | Qualifier/applicability not preserved in slice input |
| CL-CONTRADICTION | Contradiction | 0023 | contradict → SUBSUMED |
| CL-COMPOUND | Compound assertion | 0029 | Multi-claim candidate |
| CL-FULL-PIPELINE | Full pipeline | 0017 | Extraction/fallback path |
| CL-REVALIDATION | Process revalidation | 0025, 0032 | Evolution vs merge |

Scenarios may map to multiple clusters (`fmToClusters` in summary).

---

## Competing hypotheses (not root causes)

[`H42-COMPETING-HYPOTHESES.json`](../../poc/experiments/forensics/h42/H42-COMPETING-HYPOTHESES.json)

| ID | Summary |
| --- | --- |
| HYP-H42-RETRIEVAL-TOP1 | Wrong `matches[0]` drives merge |
| HYP-H42-ADJ-DETERMINISTIC-COLLAPSE | Deterministic path: high score / label equality → EQUIVALENT |
| HYP-H42-REPRESENTATION-INSUFFICIENT | `directCandidate.text` lacks distinguishing semantics |
| HYP-H42-POLICY-MANIFESTATION | Policy applies wrong adjudication (symptom) |
| HYP-H42-MNMT-BENCHMARK-ONLY | MNMT constraint never visible to pipeline |

Each hypothesis documents supporting/contradicting static evidence, gaps, discriminating scenarios, and expected Debug observations if true/false.

---

## Tier 0 H4.3 plan (mandatory)

**IDs:** `ANC-0017`, `ANC-0018`, `ANC-0019`, `ANC-0020`, `ANC-0031` — remain on queue regardless of clustering.

### MNMT triple (`ANC-0018` / `ANC-0019` / `ANC-0020`)

| Dimension | Assessment |
| --- | --- |
| Independent cases? | **Yes** — three seeds, two domains |
| Controlled variants? | **Yes** — same `adversarial_false_merge_candidate` + MNMT pattern |
| Debug strategy | Shared checklist; **separate `INV-*` per scenario**; batch efficient |

`ANC-0031` — second MNMT on culinary `Rest meat` / `CK-CUL-09` (related_distinct + forbidden seed).

Detail: [`H42-MNMT-CLUSTER-ANALYSIS.json`](../../poc/experiments/forensics/h42/H42-MNMT-CLUSTER-ANALYSIS.json)

---

## Ordinary FM representatives (beyond Tier 0)

| scenarioId | Why diagnostically useful | Control |
| --- | --- | --- |
| ANC-0023 | Sole `contradict_existing` FM | — |
| ANC-0024 | `qualify_existing` → EQUIVALENT | — |
| ANC-0027 | `objective_to_method` fail | **ANC-0038** pass |
| ANC-0029 | `compound_assertion` | — |
| ANC-0035 | `GPIO pin method` vs pin seed | **ANC-0018** |
| ANC-0040 | `supporting_observation` merge | **ANC-0030** pass |

Remaining FMs (e.g. 0025, 0028, 0032–0033, 0036–0037) are covered by cluster-level representatives unless H4.3 shows cluster-internal divergence.

---

## PASS / control scenarios

[`H42-CONTROL-SCENARIOS.json`](../../poc/experiments/forensics/h42/H42-CONTROL-SCENARIOS.json)

| Control | Pairs with |
| --- | --- |
| ANC-0030 | ANC-0040 |
| ANC-0038 | ANC-0027, 0028, 0039 |
| ANC-0034 | ANC-0032 |
| ANC-0001 | ANC-0002 (missed match) |
| CHL-0004 | Challenge deferral sample |

---

## Missed matches and Anchor deferral

| ID | Role in H4.2 |
| --- | --- |
| ANC-0002, 0006, 0010, 0014 | Contrast **over-conservative DISTINCT** vs false-merge mechanisms; optional matrix row `ANC-0002` + control `ANC-0001` |
| ANC-0026 | Anchor **unnecessary_deferral** — threshold/confidence contrast; not expanded to full analysis |

---

## Must-not-match cluster analysis

For each MNMT scenario, static analysis records:

- Expected preservation: `related_distinct` + forbidden seed
- Whether candidate text **equals** forbidden seed label (e.g. `GPIO pin`)
- Richer **seed statement** in pack vs minimal candidate string
- **`mustNotMatchIdentities` not in pipeline projection** (read-only: `forbidden-keys.ts`)

**Representation sufficiency** is an open question: if distinguishing semantics were only in benchmark metadata, that is not evidence CKES “should have known” the MNMT rule — but **literal identity overlap** may still explain deterministic equivalence without negative identity.

**Do not conclude** negative identity mechanism is required.

---

## Challenge deferral stratification

[`H42-CHL-DEFERRAL-STRATIFICATION.json`](../../poc/experiments/forensics/h42/H42-CHL-DEFERRAL-STRATIFICATION.json)

- **49/49** `defer_human` scenarios → `unnecessary_deferral` with actual `DISTINCT`
- **0** passing `defer_human` in Challenge `-002` (no in-suite “good defer” pass population)
- Controls: **CHL-0004** (related_distinct pass), **ANC-0026** (Anchor defer)

**H4.3 sample (8):** CHL-0003, 0010, 0002, 0006, 0009, 0014, 0005, 0025 — spread across transformation types and domains.

---

## Statistical supporting sample (7)

[`H42-STAT-SUPPORTING-SAMPLE.json`](../../poc/experiments/forensics/h42/H42-STAT-SUPPORTING-SAMPLE.json)

Purpose: test Anchor mechanisms in the 59 FM grid (not prevalence). Stat FMs concentrate in five transformation types (contradiction, qualification, irrelevant_near_neighbor, adversarial, revalidation). **Debug optional** for Stat rows unless Anchor INV pattern fails to transfer.

---

## Observability by investigation

[`H42-OBSERVABILITY-ASSESSMENT.json`](../../poc/experiments/forensics/h42/H42-OBSERVABILITY-ASSESSMENT.json)

| Class | Meaning |
| --- | --- |
| A | Normal Debug at H4.3 |
| B | Existing code/artifacts (e.g. `adjudication.ts`, `decision-slice.ts`) |
| C | Disposable tracing during repro (ranked `matches[]`, branch taken) |
| D | Persistent instrumentation → **H4.O** |

**Default Anchor FM path:** C suffices for retrieval/adjudication discrimination; **D** only if architect demands persisted rank/scores in run artifacts for all suites.

**Proposed H4.O:** optional persistence of ranked retrieval + adjudication rationale in harness output — **not implemented**.

---

## H4.3 investigation matrix

[`H42-INVESTIGATION-MATRIX.json`](../../poc/experiments/forensics/h42/H42-INVESTIGATION-MATRIX.json) — **32 rows**

| Priority | Count | Description |
| --- | ---: | --- |
| P0-tier0 | 5 | Mandatory Tier 0 |
| P1-representative | 6 | Ordinary FM representatives |
| P2-control | 5 | Anchor pass controls (+ missed-match contrast) |
| P2-deferral-sample | 8 | Challenge deferral |
| P3-stat-crosscheck | 7 | Statistical (Debug not required unless discrepancy) |

Each row includes clusters, hypotheses, control, repro/Debug flags, observations, `h4oRequired` (all **false** for current plan).

---

## Artifacts created

| Path |
| --- |
| `poc/experiments/forensics/h42/H42-*.json` (8 files) |
| `poc/scripts/h42-causal-clustering.ts` |
| This report |

Regenerate: `npm run benchmark:h42-clustering` (from `poc/`).

---

## Git commit

Recorded after commit.

---

## STOP

**H4.3 and H4.O not begun.** Await architect review and explicit H4.3 authorization.
