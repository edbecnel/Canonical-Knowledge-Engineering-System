# Economical LLM-Assisted Canonicalization, Discovery, and Revalidation

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Architecture](README.md) › Economical LLM-Assisted Canonicalization, Discovery, and Revalidation

> **Status:** Accepted Foundational Architectural Direction
> **Owner:** Architecture Team
> **Applies To:** CKES generic core, POC alignment, future normative specifications
> **Classification:** CKES architectural direction — includes **pre-normative** `CKES-PAR-*` requirements (not ratified `CKES-0001+`)
> **Last Reviewed:** 2026-09-19
> **Related ADR:** [ADR-0003](ADRs/ADR-0003-economical-llm-canonicalization-cascade.md) (Accepted)

## Pre-normative requirements notice

Requirements in this document use identifiers **`CKES-PAR-NNNN`** (Provisional Architectural Requirement). They are **not** ratified CKES specification requirements. [ADR-0001](ADRs/ADR-0001-ckes-adopts-edf-asr-bootstrap.md) defers `CKES-0001+` until POC evidence is reviewed.

**Architect confirmation (2026-09-19):** `CKES-PAR-0001` through `CKES-PAR-0036` are **Confirmed** as the authoritative provisional set for POC implementation, AAR traceability, and the validation matrix. **Confirmed** does not equate to normative `CKES-0001` requirements; promotion follows §13.

Each `CKES-PAR-*` entry may state **Provisional requirement strength: MUST if promoted** (or SHOULD / MAY) to preserve testable intent without implying current normative force.

Integration provenance for this document is recorded in [Economical Canonicalization Handover Integration Report](../Development/Economical_Canonicalization_Handover_Integration_Report.md).

---

## 1. Purpose

CKES should use LLM broad knowledge to judge generalizability, relationship to existing canonical knowledge, applicability boundaries, and need for revalidation—without invoking an LLM for every candidate or rediscovering the same conclusion repeatedly.

**Central objective:**

> Use LLM intelligence where it adds material canonicalization value, minimize separate inference operations, and persist governed results as reusable knowledge capital.

CKES remains a **domain-general** CRA implementation. Culinary examples reflect TRV/CALS proving grounds; the architecture must also support ELS, EGLS, electronics, CAD, engineering, manufacturing, science, and troubleshooting.

**Core conclusions (preserve):**

> LLMs can make valuable, reasonable canonicality assessments; the architectural problem is using that capability economically and governably.

> Every successful LLM-assisted canonicality judgment should create durable reusable knowledge.

> Discovery should use a cascade of increasingly expensive mechanisms; LLM adjudication is for novelty, ambiguity, contradiction, high impact, or immediate user value.

> Vector similarity finds candidates; it does not establish canonical identity.

> Embeddings and discovery indexes are disposable and rebuildable without changing canonical knowledge.

> Revalidation should be evidence-driven and preserve full history.

> As CKES matures, the share of candidates requiring new LLM reasoning should decline while canonical quality and reuse increase.

---

## 2. Governing CRA boundary

CKES **implements** [CRA](https://github.com/edbecnel/Canonical-Representation-Architecture); it does **not** redefine CRA semantics.

CKES must preserve these constraints (handover-derived; mapped in § CRA conformance):

1. Canonicalization establishes semantic identity, not uniform wording.
2. Similarity retrieves candidates; it does not prove identity.
3. Canonical status is distinct from epistemic status.
4. Canonical identity may be durable while understanding and applicability evolve.
5. Embeddings, search indexes, rankings, and caches are derived and rebuildable.
6. Objectives are distinct from methods.
7. Revalidation preserves provenance, lineage, and historical states.
8. Candidate or processing identity must not be mistaken for accepted canonical identity.

Where CRA specifications are not yet adopted by CKES, use bounded provisional terminology and record dependencies (§ CRA conformance baseline).

---

## 3. CRA conformance baseline

**Baseline recorded:** 2026-09-19. Update this section when CRA artifacts change governed state.

| CRA artifact | CKES treatment | Notes |
|--------------|----------------|-------|
| [CRA-0000](https://github.com/edbecnel/Canonical-Representation-Architecture/blob/main/CRA-0000.md) | Historical context | Non-normative discovery record |
| CRA-0001–0003 | **Adopted** architectural alignment per [PROJECT_CHARTER](../../PROJECT_CHARTER.md) | CKES goals and constraints reference these; CKES does not claim full implementation |
| CRA-0004 (evidence promotion) | **Proposed / not adopted** | Candidate lifecycle in CKES is provisional until CRA-0004 is accepted and mapped |
| CRA-0005 and later | **Unresolved dependency** | Do not claim conformance |
| CRA watch items AWI-0001–0003 | **Tracked** via [CKES watch items](Watch_Items/README.md) | Experimental hypotheses |

**Mapping categories** (each `CKES-PAR-*` row in § CRA mapping table tags one):

- **Adopted CRA** — aligns with charter-stated CRA-0001–0003 obligations
- **Proposed CRA** — anticipates CRA-0004+ without claiming conformance
- **Handover provisional** — CKES direction pending POC evidence
- **CKES implementation** — engineering choice testable in POC
- **Unresolved CRA** — blocked on external specification state

**Follow-up trigger:** When CRA-0004 and CRA-0005 reach Accepted (or equivalent governed state in the CRA repository), revise § CRA mapping and [CKES-AWI-0001](Watch_Items/CKES-AWI-0001-knowledge-evolution-and-canonicalization.md); consider promotion gate inputs for `CKES-0001`.

---

## 4. Problem statement

Source and AI-generated artifacts yield many reusable knowledge candidates. A naive architecture performs separate LLM canonicality assessment per candidate, multiplying cost and repeating equivalent conclusions. CKES needs a **cascade**: least expensive reliable mechanism first, escalate when necessary, persist each resolved judgment for reuse.

---

## 5. Architectural principles (summary)

The following principles are expanded as `CKES-PAR-*` requirements in §7.

1. LLM-assisted canonicality assessment is a first-class capability; output is governed input, not automatic truth.
2. Amortize LLM reasoning by persisting governed assessment results separately from canonical truth.
3. Reuse before rediscovery (IDs, structure, lexicon, vectors, relationships, prior decisions, then LLM).
4. Piggyback extraction/assessment on existing AI work when economical and safe.
5. Prefer bounded batch assessment over one-call-per-candidate when quality and isolation are preserved.
6. Cost-aware discovery cascade with explicit separation of discovery, adjudication, governance, persistence.
7. Vectors are discovery indexes, never canonical state.
8. NLP/lexical analysis complements vectors; remains discovery evidence.
9. Relationship and applicability compatibility beyond text similarity.
10. Escalation considers uncertainty, impact, novelty, cost, tenancy, and policy—not a single threshold.
11. Explicit candidate and decision states.
12. Preserve original source assertions and provenance layers.
13. Semantic anchoring over mandatory canonical wording.
14. Evidence-driven revalidation with accumulated pressure.
15. Multi-valued, historical revalidation outcomes.
16. Emerging clusters are signals, not decisions.
17. Economic improvement via reuse without lowering correctness or provenance standards.

---

## 6. Component model and processing stages

Aligns with [Reference Implementation Role and Domain Independence](Reference_Implementation_Role_and_Domain_Independence.md) three-layer model (generic core, domain integration, source integration).

| Component | Responsibility |
|-----------|----------------|
| `SourceIntake` | Artifact identity, authorization, provenance, tenant scope, domain, purpose |
| `CandidateExtraction` | Reusable knowledge candidates; source span traceability |
| `CandidateDecomposition` | Compound passages → typed assertions |
| `DiscoveryCascade` | Exact → structural → lexical/NLP → vector → relationship neighborhood |
| `CompatibilityAnalysis` | Type, roles, applicability, contradiction filtering |
| `EscalationRouter` | Reuse, unresolved, batch queue, piggyback LLM, dedicated LLM, human review, reject |
| `LLMAssessmentService` | Bounded-context adjudication; structured contract (§9) |
| `GovernedDecision` | Policy, promotion, provenance; separate recommendation from acceptance |
| `AdjudicationStore` | Prior assessments for reuse (not canonical truth) |
| `HumanReviewQueue` | Configurable review; reviewer decisions as reusable evidence |
| `RevalidationAccumulator` | Pressure signals before expensive review |
| `DerivedIndexManager` | Embeddings, lexical indexes; rebuild and migration |
| `MetricsCollector` | Cost, latency, quality, reuse (§ POC evidence program) |

**Stages 1–11:** Source intake → extraction → decomposition → cheap discovery → semantic discovery → compatibility → escalation routing → LLM adjudication (when needed) → governed decision → persistence and index update → feedback and measurement.

```text
Source artifact or user interaction
    -> candidate extraction and normalization
    -> exact/structural/alias matching
    -> lexical and NLP matching
    -> vector semantic retrieval
    -> relationship-neighborhood and applicability checks
    -> confidence/risk decision
       -> reuse existing canonical identity
       -> retain as unresolved candidate
       -> request human review
       -> batch/defer LLM assessment
       -> invoke immediate LLM adjudication
    -> governed decision and provenance
    -> canonical knowledge or candidate-state update
    -> rebuild/update derived discovery indexes
```

---

## 7. Identity, candidate state, and equivalence

### 7.1 Identity layers (must not be conflated)

| Layer | Description | Becomes canonical? |
|-------|-------------|-------------------|
| **Source artifact identity** | Stable ID for imported or user artifact | No |
| **Source assertion identity** | What the source actually expressed (span/quote) | No (preserved as provenance) |
| **Extraction / candidate processing identity** | Durable tracking ID for a candidate under evaluation | **No** — tracking ≠ canonical |
| **Proposed semantic identity** | System proposal for a new canonical entity | No until promotion |
| **Proposed match** | Candidate linked to existing canonical ID for evaluation | No — hypothesis only |
| **Accepted canonical identity** | Governed canonical entity ID | Yes (within authority/scope) |
| **Accepted equivalence assertion** | Governed record that two representations share identity | Yes (as relationship/decision, not retrieval score) |
| **Rejected / unresolved / superseded match** | Negative or deferred decision with history | No canonical merge |

**Rules (see CKES-PAR-0027–0030):** A candidate tracking ID does not imply canonical identity. An LLM match recommendation does not establish equivalence. A high-confidence retrieval result does not constitute accepted canonical identity.

### 7.2 Candidate and decision states (minimum)

Extracted candidate; possible match found; match unresolved; proposed new identity; LLM assessed; human reviewed (where required); accepted canonical identity or relationship; rejected or source-specific; queued for revalidation. Align with CRA Evidence Promotion when CRA-0004 is adopted.

---

## 8. Provisional architectural requirements (`CKES-PAR-*`)

### 8.1 Requirement registry

| ID | Summary | Strength if promoted | Architect status | Provenance |
|----|---------|----------------------|--------|------------|
| CKES-PAR-0001 | LLM canonicality assessment is a first-class CKES capability | SHOULD | Confirmed | Handover §1 |
| CKES-PAR-0002 | LLM output is not authoritative solely because a model produced it | MUST | Confirmed | Handover §1 |
| CKES-PAR-0003 | Persist governed LLM/adjudication outcomes for reuse | SHOULD | Confirmed | Handover §2 |
| CKES-PAR-0004 | Distinguish durable canonical knowledge from model assessment records | MUST | Confirmed | Handover §2 |
| CKES-PAR-0005 | Reuse cascade before new LLM adjudication | SHOULD | Confirmed | Handover §3 |
| CKES-PAR-0006 | Auto-link thresholds conservative, explainable, testable | MUST | Confirmed | Handover §3 |
| CKES-PAR-0007 | Piggyback candidate work on existing AI when economical | SHOULD | Confirmed | Handover §4 |
| CKES-PAR-0008 | Batch assessment with per-candidate provenance and isolation | SHOULD | Confirmed | Handover §5 |
| CKES-PAR-0009 | Explicit separation discovery / adjudication / governance / persistence | MUST | Confirmed | Handover §6 |
| CKES-PAR-0010 | Canonical store correct if all embeddings/vector indexes deleted | MUST | Confirmed | Handover §7 |
| CKES-PAR-0011 | Rebuilding embeddings must not change canonical identity or accepted relationships | MUST | Confirmed | Handover §7 |
| CKES-PAR-0012 | NLP/lexical signals are discovery evidence, not identity proof | MUST | Confirmed | Handover §8 |
| CKES-PAR-0013 | Compatibility analysis uses type, applicability, relationships | SHOULD | Confirmed | Handover §9 |
| CKES-PAR-0014 | Escalation policy multi-factor, not single similarity threshold | SHOULD | Confirmed | Handover §10 |
| CKES-PAR-0015 | Explicit candidate lifecycle states | MUST | Confirmed | Handover §11 |
| CKES-PAR-0016 | Candidate/processing ID must not imply accepted canonical identity | MUST | Confirmed | Handover §11, CRA-8 |
| CKES-PAR-0017 | Preserve source expression and provenance layers | MUST | Confirmed | Handover §12 |
| CKES-PAR-0018 | Semantic anchoring; canonical wording optional | MAY | Confirmed | Handover §13 |
| CKES-PAR-0019 | Evidence-driven revalidation | MUST | Confirmed | Handover §14 |
| CKES-PAR-0020 | Revalidation outcomes historical; no silent overwrite | MUST | Confirmed | Handover §15 |
| CKES-PAR-0021 | Emerging clusters are signals only | SHOULD | Confirmed | Handover §16 |
| CKES-PAR-0022 | Economic metrics without lowering correctness standards | MUST | Confirmed | Handover §17 |
| CKES-PAR-0023 | Canonical integrity must not depend on live LLM or vector service | MUST | Confirmed | Handover failure § |
| CKES-PAR-0024 | Tenancy/authorization boundaries in batching and prompts | MUST | Confirmed | Handover privacy § |
| CKES-PAR-0025 | Defined failure behavior (LLM, budget, partial batch, index corruption) | MUST | Confirmed | Handover failure § |
| CKES-PAR-0026 | Configurable human review; reviewer decisions reusable | SHOULD | Confirmed | Handover governance § |
| CKES-PAR-0027 | Eight identity layers distinguished in data model and APIs | MUST | Confirmed | Architect amendment §6 |
| CKES-PAR-0028 | Similarity alone must not establish canonical identity | MUST | Confirmed | CRA constraint 2 |
| CKES-PAR-0029 | LLM match recommendation does not establish equivalence | MUST | Confirmed | Architect amendment §6 |
| CKES-PAR-0030 | High-confidence retrieval does not constitute accepted identity | MUST | Confirmed | Architect amendment §6 |
| CKES-PAR-0031 | Detect false merges via audits, contradictions, human review, metrics | MUST | Confirmed | Handover failure § |
| CKES-PAR-0032 | Rollback: separate incorrect provenance; restore or split identities | MUST | Confirmed | Architect amendment §7 |
| CKES-PAR-0033 | On correction: invalidate affected derived indexes/caches; rebuild | MUST | Confirmed | Architect amendment §7 |
| CKES-PAR-0034 | Record corrective decision; retain erroneous decision in history | MUST | Confirmed | Architect amendment §7 |
| CKES-PAR-0035 | Identify downstream consumers; reprocess/notify per policy | SHOULD | Confirmed | Architect amendment §7 |
| CKES-PAR-0036 | Deferred processing idempotent and retryable with correlation IDs | MUST | Confirmed | Handover failure § |

### 8.2 Implementation hypotheses (POC evidence required)

| Hypothesis | Related PAR | Evidence needed |
|------------|-------------|-----------------|
| Cascade reduces LLM calls without excess false merges | PAR-0005, PAR-0006, PAR-0022 | Baseline vs mature corpus metrics |
| Prior adjudication reuse matches semantically equivalent candidates | PAR-0003, PAR-0004 | Reuse hit rate; no erroneous auto-link |
| Batching preserves per-candidate provenance and isolation | PAR-0008, PAR-0024 | Matrix T-07, T-14 |
| Vector retrieval improves paraphrase recall without merge inflation | PAR-0010–0012, PAR-0028 | T-02, T-03, false-merge rate |
| Index delete/rebuild leaves canonical store unchanged | PAR-0010, PAR-0011 | T-09 |
| Embedding model migration changes scores only | PAR-0011 | T-10 |
| Revalidation triggers only after accumulated pressure | PAR-0019, PAR-0021 | T-11 |
| Rollback restores integrity after incorrect merge | PAR-0031–0035 | T-15 |
| Policies generalize beyond culinary domain | Promotion gate | ≥2 domains |

---

## 9. LLM canonicality assessment contract (provisional)

Structured response (version `ckes.llm-assessment.v0-provisional`). Validates against schema in POC; not a ratified API spec.

**Required fields:**

- `assessment_id`, `candidate_processing_id` (not canonical ID)
- `source_artifact_id`, `source_assertion_refs[]`
- `relationship_candidates[]`: `{ canonical_id?, class, confidence, rationale }` — **recommendation only**
- `proposed_semantic_identity` (optional, if novel)
- `applicability`, `qualifications`, `exceptions`
- `epistemic_assessment`
- `assertion_decomposition[]` (if multi-assertion source)
- `objective_vs_method_classification`
- `promotion_recommendation`: `reuse_existing | new_identity | unresolved | human_review | reject_source_specific`
- `confidence`, `requested_human_review`, `contradiction_flags`
- `model_provenance`: provider, model, version, prompt_policy_id
- `decision_evidence` (structured rationale)

**Governed acceptance** occurs only after policy engine and commit path; field `governed_decision_id` links assessment to acceptance record.

---

## 10. Requirements-to-test / validation matrix

| Test ID | Scenario (handover) | Primary PAR | POC hook | Pass criteria (initial) |
|---------|---------------------|-------------|----------|------------------------|
| T-01 | Exact/alias bypass LLM | PAR-0005 | `hybridRetrieve` exact path | 0 LLM tokens; correct link |
| T-02 | Paraphrase via vector | PAR-0010, PAR-0012 | Future vector index | Recall in top-K; no auto-merge without policy |
| T-03 | Close but distinct not merged | PAR-0006, PAR-0028, PAR-0013 | Ground-truth negatives | No false merge |
| T-04 | Objective vs method | PAR-0013 | LLM contract + typing | Correct classification |
| T-05 | Applicability blocks invalid match | PAR-0013 | Compatibility module | Match rejected |
| T-06 | Ambiguous top matches conservative | PAR-0006, PAR-0014 | Policy engine | Unresolved or human review |
| T-07 | Batch with per-candidate provenance | PAR-0008 | Batch adjudication W-BATCH | Independent audit trail per candidate |
| T-08 | Reuse prior adjudication | PAR-0003 | Adjudication store W-REUSE | No second LLM call |
| T-09 | Vector index delete; canonical intact | PAR-0010 | W-VEC rebuild test | Byte-level canonical equality |
| T-10 | Embedding migration | PAR-0011 | Re-embed job | Identity graph unchanged |
| T-11 | Revalidation gated | PAR-0019 | Revalidation worker | No review on single anomaly |
| T-12 | History after refine/split/merge | PAR-0020 | Schema + commit | Prior states queryable |
| T-13 | LLM failure / budget | PAR-0025 | Inject faults | Retry/defer; no corrupt canonical |
| T-14 | Tenant isolation in batching | PAR-0024 | Multi-tenant fixture | No cross-tenant batch |
| T-15 | False merge rollback | PAR-0031–0035 | W-ROLLBACK | Corrected identities; history preserved |
| T-16 | Declining LLM calls as KB matures | PAR-0022 | Progressive experiment | Reproducible baseline → mature comparison |

Use **multi-domain fixtures** (culinary + ELS-style electronics) for T-03–T-06 and promotion gate.

---

## 11. CRA mapping (selected PAR)

| CRA basis | PAR IDs | Category |
|-----------|---------|----------|
| Identity ≠ wording | PAR-0018, PAR-0028 | Adopted CRA |
| Similarity ≠ proof | PAR-0012, PAR-0028–0030 | Adopted CRA |
| Epistemic vs canonical | PAR-0004, PAR-0002 | Adopted CRA |
| Derived indexes | PAR-0010, PAR-0011, PAR-0033 | Adopted CRA |
| Objectives vs methods | PAR-0013, LLM contract | Adopted CRA |
| Revalidation history | PAR-0019, PAR-0020 | Adopted CRA |
| Candidate ≠ canonical | PAR-0016, PAR-0027 | Adopted CRA |
| Evidence promotion lifecycle | PAR-0015 | Proposed CRA (CRA-0004) |
| CKES cascade economics | PAR-0005–0008, PAR-0022 | CKES implementation |
| Tenancy / batching | PAR-0024 | CKES implementation |

---

## 12. POC evidence program and baselines

**Do not claim** declining LLM cost or improved reuse without reproducible baselines.

### 12.1 Baselines to record (before/after comparisons)

| Metric | Method |
|--------|--------|
| Corpus composition | Stage manifests (`poc/experiments/manifests/`), domain mix % |
| Candidates per source artifact | Pipeline metrics |
| LLM calls per candidate / per source | `@ckes/metrics`, `canonicalization_decisions` |
| Matching accuracy | Ground truth (`@ckes/corpus`) |
| False-merge / missed-match rate | Labelled negatives + audit |
| Tokens and cost USD | Adjudication records; model pricing table |
| Latency p50/p95 | Run timestamps |
| Human review minutes | Manual log until automated |
| Comparable runs | Same corpus stage, policy version, commit hash |

### 12.2 Evidence collection priorities

Matching accuracy; false merges; escalation paths; LLM-cost reduction; prior-decision reuse; batching; vector-index rebuild; revalidation behavior; **multi-domain applicability**.

---

## 13. Human promotion gate for `CKES-0001`

**Architect confirmed (2026-09-19):** Gate criteria and process below are correct. The gate is **not** satisfied until steps 1 and 3–7 are complete.

| Step | Requirement |
|------|-------------|
| 1 | [ADR-0001](ADRs/ADR-0001-ckes-adopts-edf-asr-bootstrap.md) evidence gate closed (human decision recorded—typically amended ADR or charter update) |
| 2 | [ADR-0003](ADRs/ADR-0003-economical-llm-canonicalization-cascade.md) **Accepted** by architect — **done** (2026-09-19) |
| 3 | POC evidence reviewed; findings classified in [CRA Findings Report](../Development/CRA_Findings_Report.md) |
| 4 | Validation matrix rows marked **evidence satisfied** for in-scope PAR |
| 5 | **≥2 materially different domains** (e.g. culinary + electronics/ELS-style); culinary-only evidence **insufficient** |
| 6 | Architect approves PAR subset for promotion—not automatic inclusion of all `CKES-PAR-*` |
| 7 | Create `CKES-0001` in `docs/Specifications/` via EDF Architecture Specification template; reconcile IDs to normative requirement numbering |

---

## 14. Example: pastry working state

See integrated handover example: refrigerated pastry resting vs cookie-dough warming; engineered fat cluster triggering revalidation—preserve traditional knowledge and narrow applicability.

---

## 15. Subscribing applications, privacy, failure, review

**Applications:** Domain partitions, contributed candidates, local vs central promotion, targeted canonical context for app AI, versioned contracts—see [Reference Implementation](Reference_Implementation_Role_and_Domain_Independence.md) and [Recipe Vault Source Integration](Recipe_Vault_Source_Integration.md).

**Privacy / tenancy:** Classes from private user content through public knowledge; no cross-tenant batching for economy (PAR-0024); prompt injection and poisoning considered in PAR-0025.

**Failure handling:** Embedding/LLM outage, budget exhaustion, staleness, model change, concurrent promotion conflicts, partial batch failure, review backlog, source deletion, **false merge rollback** (PAR-0031–0035), corrupted derived indexes.

**Human review:** When ambiguity, high-impact false merge risk, canonical change, sparse evidence, regulated domain, split/merge/supersede recommendations, or policy mandates.

---

## 16. Unresolved questions and watch items

| # | Question | Tracker |
|---|----------|---------|
| 1 | Candidate lifecycle vs CRA Evidence Promotion | [CKES-AWI-0001](Watch_Items/CKES-AWI-0001-knowledge-evolution-and-canonicalization.md) |
| 2 | Automation vs human vs domain policy | CALS policy + PAR-0026 |
| 3 | Identity representation in schema | [AAR-0001](Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md) W-LIFECYCLE |
| 4–6 | LLM contract, adjudication reuse indexing | [CKES-AWI-0003](Watch_Items/CKES-AWI-0003-ai-assisted-knowledge-evaluation.md) |
| 7–8 | Risk policy; vector composition | AWI-0003, POC W-VEC |
| 9–10 | Index lifecycle; revalidation routing | [CKES-AWI-0005](Watch_Items/CKES-AWI-0005-revalidation-pressure-and-history.md) |
| 11–16 | Cost attribution, consent, poisoning, context tokens, economics metrics | Integration report backlog |

---

## 17. Related documents

- [ADR-0003](ADRs/ADR-0003-economical-llm-canonicalization-cascade.md) (Accepted)
- [AAR-0001](Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md) (Open)
- [Reference Implementation Role and Domain Independence](Reference_Implementation_Role_and_Domain_Independence.md)
- [Pragmatic Canonicalization Research and Validation](../Development/Pragmatic_Canonicalization_Research_and_Validation.md)
- [Economical Canonicalization Handover Integration Report](../Development/Economical_Canonicalization_Handover_Integration_Report.md)
- [POC README](../../poc/README.md)
- [Cost Optimization](../AI/Cost_Optimization.md)
