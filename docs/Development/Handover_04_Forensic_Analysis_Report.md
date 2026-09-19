# Handover 04 — Forensic Analysis Report (H4.4 Synthesis)

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › H4.4 Forensic Analysis

> **Status:** Complete — **H4.5 / H4.6 / H4.O not authorized**
> **Scope:** Reference Baseline 001 only — synthesis of H4.1–H4.3
> **Last updated:** 2026-09-19

## Executive forensic summary

Under **Reference Baseline 001** measurement conditions (REF-CLEAN profile, **deterministic AI off**, **deterministic_fixture** retrieval, pack-only clean corpus), the **dominant established mechanism** for Anchor **false merges** is **deterministic adjudication collapse**:

- **`EQUIVALENT`** when normalized label equality or score ≥ 0.95; or  
- **`SUBSUMED_BY_EXISTING`** when retrieval score ≥ 0.7,

using **candidate label text** and **top retrieval label/score** — **without** consuming richer canonical seed statements, benchmark relationship classes, qualifiers, or `mustNotMatchIdentities`.

**Policy** most often **faithfully executes** the adjudication class (`reuse_existing` for EQUIVALENT; `reject_new_identity` for some SUBSUMED cases). Where policy rejects, the scorer may still record **false_merge** because the **adjudication class** remains a merge-class relative to benchmark expectations.

**Retrieval** usually returns a **semantically plausible** top match for failing scenarios; H4.3 did **not** establish that incorrect ranking (case A) is the primary root cause for the investigated Anchor families. **Pass controls** show that **absence of retrieval match → DISTINCT** avoids false merge — an important architectural dependency, not yet a remediation prescription.

**Challenge unnecessary deferral** (49/49 `defer_human` failures in `-002`) reflects a **different** pattern: **no retrieval match → DISTINCT (high confidence) → `evaluate_new_identity`**, while the benchmark expects **`defer_human`**. Evidence **does not uniquely** distinguish benchmark intent (governance deferral vs ambiguity) without further benchmark-semantics review; H4.3 rules out “hidden uncertainty” in the CKES stack for the sampled cases.

**MNMT:** Failures are explainable **without** a negative-identity mechanism; `mustNotMatchIdentities` remains **evaluation ground truth**, not pipeline input.

This report does **not** claim the same defects apply to **future AI-backed adjudication** or non–REF-CLEAN configurations.

---

## Methodology and evidence boundary

| Source gate | Contribution |
| --- | --- |
| [H4.1](Handover_04_H41_Static_Forensic_Inventory_Report.md) | 18 FM records, MNMT inventory, evidence gaps, aggregates |
| [H4.2](Handover_04_H42_Causal_Clustering_Report.md) | Clusters, hypotheses, investigation matrix |
| [H4.3](Handover_04_H43_Debug_Forensic_Investigation_Report.md) | 22 `INV-*` repro + disposable traces |

**H4.4** adds no new reproductions. Conclusions are bounded to:

- Designated run **`RUN-REF-CLEAN-ANCHOR-002`** and supporting **`RUN-REF-CLEAN-STAT-002`**, **`RUN-REF-CLEAN-CHALLENGE-002`**
- Frozen packs and G4.1 evaluation infrastructure
- **Deterministic adjudication path** documented in `adjudication.ts`

Benchmark expectations are **construction-derived** (Handover 03 epistemic status unchanged). No population prevalence claims.

---

## RB001 conditions (conclusions apply only here)

| Anchor | Value |
| --- | --- |
| Profile | `CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001` |
| `deterministicAi` | true (no live OpenAI adjudication in official runs) |
| `retrievalMode` | `deterministic_fixture` / hybrid retrieve against pack seeds |
| Database | `clean` — corpus reset to pack `canonicalSeedMaterial` |
| Adjudication | `adjudicateSemantic` deterministic branch |
| Top match | `matches[0]` only |

---

## Established causal mechanisms

### Common mechanism (two branches)

| Branch | Code behavior | Anchor FMs (count) |
| --- | --- | ---: |
| **Deterministic EQUIVALENT** | Label equality or score ≥ 0.95 → EQUIVALENT | **10** |
| **Deterministic SUBSUMED** | Score ≥ 0.7 → SUBSUMED_BY_EXISTING | **8** |

**Primary layer:** adjudication (materially produces incorrect semantic class given benchmark intent).

**Contributing (all 18):** retrieval supplies comparison identity; **label-only** (or extraction-normalized) candidate representation.

**Downstream:** policy actions; scorer `false_merge` manifestation.

Machine-readable reconciliation: [`H44-ANCHOR-18FM-RECONCILIATION.json`](../../poc/experiments/forensics/h44/H44-ANCHOR-18FM-RECONCILIATION.json)

### Semantic failure taxonomy (orthogonal to mechanism)

| Semantic failure type | Example IDs | Typical adjudication |
| --- | --- | --- |
| Adversarial / MNMT label identity | 0018–0020, 0031 | EQUIVALENT |
| Related distinct after extraction | 0017 | EQUIVALENT |
| Qualification → equivalence | 0024, 0036 | EQUIVALENT |
| Supporting observation / neighbor | 0040, 0028 | EQUIVALENT |
| Contradiction → subsumption | 0023 | SUBSUMED |
| Direction (objective/method) | 0027, 0028, 0039 | SUBSUMED / EQUIVALENT |
| Compound / paraphrase / context | 0029, 0033, 0037 | SUBSUMED |
| Scope (narrow/broad) | 0035, 0036 | SUBSUMED / EQUIVALENT |
| Revalidation / process | 0025, 0032 | SUBSUMED / EQUIVALENT |

Same **deterministic branches**; different **benchmark semantic intents**. Do not collapse semantic types when planning H4.5 hypotheses.

---

## Anchor 18/18 false-merge reconciliation

| Status | Count | Meaning |
| --- | ---: | --- |
| `established_direct_inv` | **11** | H4.3 `INV-*` repro + trace |
| `strong_transfer_same_adjudication_branch` | **7** | Same terminal class/branch as investigated representative + `adjudication.ts` path |
| `provisional_transfer` | **0** | — |
| `unresolved` | **0** | — |

| scenarioId | Branch | Status | Key evidence |
| --- | --- | --- | --- |
| ANC-0017 | EQUIV | direct INV | INV-0017 extraction → Deep fry exact match |
| ANC-0018–0020, 0031 | EQUIV | direct INV | MNMT INV + literal label match |
| ANC-0023 | SUB | direct INV | contradict → SUBSUMED |
| ANC-0024 | EQUIV | direct INV | qualification → EQUIVALENT |
| ANC-0025 | SUB | transfer ← 0027 | emerging_process / SUBSUMED |
| ANC-0027 | SUB | direct INV | vs control 0038 empty retrieval |
| ANC-0028 | EQUIV | transfer ← 0040 | method_to_objective / EQUIVALENT |
| ANC-0029 | SUB | direct INV | compound |
| ANC-0032 | EQUIV | transfer ← 0019 | revalidation / EQUIVALENT |
| ANC-0033 | SUB | transfer ← 0029 | paraphrase / SUBSUMED |
| ANC-0035 | SUB | direct INV | narrow applicability |
| ANC-0036 | EQUIV | transfer ← 0024 | broaden / EQUIVALENT |
| ANC-0037 | SUB | transfer ← 0029 | context change / SUBSUMED |
| ANC-0039 | SUB | transfer ← 0027 | method_to_objective / SUBSUMED |
| ANC-0040 | EQUIV | direct INV | vs control 0030 DISTINCT |

Quantification: [`H44-MECHANISM-QUANTIFICATION.json`](../../poc/experiments/forensics/h44/H44-MECHANISM-QUANTIFICATION.json)

---

## Retrieval vs adjudication (H4.2 concern revisited)

| Case | H4.4 assessment |
| --- | --- |
| **A** Retrieval inappropriate ranking | **Not established** as primary root for investigated Anchor FMs; top match is often the seed label the benchmark also references |
| **B** Plausible match, adjudication collapses distinction | **Established** for 18/18 FMs under deterministic rules |
| **C** Representation lost before adjudication | **Established** for label-only `directCandidate`; **ANC-0017** adds extraction normalization; seed **statements exist in DB** but are **not inputs** to deterministic adjudication |
| **D** Multi-layer | **Yes** — retrieval + representation contribute; **first material semantic error** at adjudication |

**`matches[0]` only:** Confirmed architectural constraint. H4.3 did **not** test whether adjudicating additional candidates would prevent failures. Record as **open hypothesis** for H4.5, not established remedy.

---

## Representation sufficiency

| Information type | Available to CKES at adjudication? | Used by deterministic adjudication? |
| --- | --- | --- |
| Candidate label / extracted text | Yes | Yes |
| Canonical seed **statement** (DB `description`) | In corpus, not in adjudication prompt path | **No** (H4.3) |
| Pack qualifiers / applicability / semanticRoles | Not in projection (allowlist) | No |
| Benchmark `expectedDecisionClass` | Scorer only | No |
| `mustNotMatchIdentities` | Scorer only | No |

**MNMT synthesis (six points):**

1. `mustNotMatchIdentities` is **evaluation ground truth**, not pipeline input.  
2. CKES must **not** be scored as if it knew that hidden field.  
3. Richer **seed statements** existed in the corpus.  
4. **Deterministic adjudication did not consume** them before equivalence/subsumption.  
5. Candidates were **often label-only** (or normalized to label).  
6. Observed MNMT scorer violations are **explainable without negative-identity architecture**.

**Negative identity:** **OPEN** optional hypothesis for future governance review — **not** promoted to CRA/CKES in H4.4.

---

## PASS / control synthesis

Investigated passes (**ANC-0038, 0030, 0034**): **empty `rankedRetrievalMatches` → DISTINCT → `evaluate_new_identity`**.

**Architectural implication (observation only):** Under RB001 deterministic behavior, **false-merge avoidance correlates strongly with retrieval failing to return a similar seed**. Safety is **not** demonstrated for “similar identity present but semantically distinct” cases — which dominate Anchor failures.

**ANC-0027 vs ANC-0038:** Same transformation family label in pack; failure had fuzzy hit on “Rest meat”, pass had **no** hit on “process of I2C”. Divergence begins at **retrieval presence**, then adjudication branch.

---

## Challenge deferral analysis

**Observed terminal chain (4/8 H4.3 sample, reproduced):**

`no match → DISTINCT (0.9) → evaluate_new_identity` vs expected **`defer_human`**.

Pack pattern for failing defer scenarios: synthetic **“ambiguous … process N”** strings with `labelConfidenceClass: expected_deferral`.

| Interpretation | Evidence fit |
| --- | --- |
| **A** Benchmark encodes ambiguity requiring human judgment despite confident DISTINCT | **Plausible** — construction labels scenarios as expected deferral |
| **B** Benchmark encodes governance deferral CKES policy does not implement | **Plausible** — policy maps DISTINCT → evaluate, not defer |
| **C** Benchmark overstates deferral | **Cannot confirm or deny** without construction intent doc beyond pack metadata |
| **D** Representation discarded ambiguity before DISTINCT | **Partially ruled out** for sample — candidates are intentionally non-matching strings; confidence is default deterministic DISTINCT, not nuanced uncertainty |
| **E** Scorer/policy vocabulary mismatch (`defer_human` vs `evaluate_new_identity`) | **Supported** as measurement surface |

**Cannot uniquely distinguish A vs B** from H4.3 traces alone. **Not** reducible to “benchmark wrong” or “CKES policy wrong” without further governance review.

**Limitation:** No passing `defer_human` cases in Challenge `-002` for in-suite control.

---

## Statistical / Challenge generalization

| Suite | Observation (not prevalence) |
| --- | --- |
| **Statistical `-002`** | 59 FMs concentrate in same five transformation types as deterministic grid; **STA-0014** / **STA-0008** reproduce EQUIVALENT / EQUIVALENT-on-contradiction patterns per H4.3 |
| **Challenge `-002`** | Deferral failures decouple from Anchor FM mechanism; shared **DISTINCT + evaluate** terminal class |

Language: mechanisms were **observed across multiple benchmark suites** under the same REF-CLEAN configuration.

---

## Policy synthesis

| Question | Finding |
| --- | --- |
| Policy as **root cause** for Anchor FMs? | **Generally no** — executes adjudication mapping |
| Policy as **downstream** for EQUIVALENT → reuse? | **Yes** (manifestation) |
| SUBSUMED + reject still false_merge? | **Yes** — scorer reacts to adjudication merge class vs expected non-merge / contradict / etc. |
| Challenge defer_human? | **Separate semantics** — policy does not emit `defer` for confident DISTINCT; benchmark expects defer action |

No threshold recommendations in H4.4.

---

## Observability synthesis

| H4.1 gap | H4.3 resolution |
| --- | --- |
| Ranked retrieval | Resolved in `INV` disposable traces |
| Adjudication branch / rationale | Resolved for investigated scenarios |
| Policy inputs | Resolved in traces |
| Persisted run JSON capture | **Not** added |

**H4.O necessity for H4.4 conclusions:** **Unnecessary** — disposable tracing sufficed.

**Future benchmark engineering / production diagnostics:** Optional persistence **useful** but not architecturally proven **necessary** from this gate alone.

---

## Architectural layer ownership

Full table: [`H44-LAYER-OWNERSHIP.json`](../../poc/experiments/forensics/h44/H44-LAYER-OWNERSHIP.json)

| Layer | Established defect / limitation | Confidence |
| --- | --- | --- |
| Benchmark projection | Eval-only constraints | High |
| Candidate construction | Label-only / extraction strip | High |
| Canonical representation | Statements unused at adjudication | High |
| Retrieval | Plausible top-1; not proven wrong root | Medium |
| Top-1 selection | Constraint only; remedy unproven | High / low |
| Adjudication | Deterministic collapse | **High** |
| Confidence | Fixed high on deterministic branches | Medium |
| Policy | Executor; defer mapping gap on Challenge | High |
| Scorer | Surfaces failures | High |

---

## Unresolved questions (for H4.5+)

1. Behavior under **non-deterministic (LLM) adjudication** with same packs.  
2. Whether **multi-candidate adjudication** would change outcomes (hypothesis only).  
3. Unique correct interpretation of Challenge **`defer_human`** vs **`evaluate_new_identity`**.  
4. Whether projecting **structured qualifiers** would suffice vs adjudication redesign.  
5. Negative-identity mechanisms — **optional**, not evidence-required.

---

## Established evidence vs hypotheses

| Established under RB001 deterministic | Hypothesis / not established |
| --- | --- |
| Deterministic adjudication collapse drives Anchor FMs | Same defect in all future CKES modes |
| Seed statements not consumed before deterministic merge | mustNotMatch must enter pipeline |
| Pass pattern depends on empty retrieval | Raising retrieval threshold fixes safety |
| Challenge defer = DISTINCT/evaluate vs defer_human expectation | Which side of expectation is “correct” governance |

---

## Immutability

Verified in [`H44-IMMUTABILITY.json`](../../poc/experiments/forensics/h44/H44-IMMUTABILITY.json) — anchor pack, `-002` runs, designation, manifest unchanged.

---

## Artifacts

| Path | Role |
| --- | --- |
| This report | H4.4 deliverable |
| `poc/experiments/forensics/h44/H44-*.json` | Reconciliation, quantification, layers |
| `poc/scripts/h44-forensic-synthesis.ts` | Regenerator |

Prior gates: `poc/experiments/forensics/` (H4.1–H4.3 trees).

---

## Git commit

Recorded after commit.

---

## STOP

**H4.5 not begun.** Await architect authorization.
