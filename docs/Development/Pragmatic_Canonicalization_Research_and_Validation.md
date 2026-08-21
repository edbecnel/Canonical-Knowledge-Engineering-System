[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Pragmatic Canonicalization Research and Validation

> **Status:** Draft
> **Owner:** Architecture Team
> **Classification:** CKES research direction / experimental program (non-normative)
> **Last Reviewed:** 2026-08-22

# CKES — Pragmatic Canonicalization Research and Validation

## Status

CKES Research Direction / Experimental Program

## 1. Purpose

This document defines how the Canonical Knowledge Engineering System (CKES) should investigate and validate the CRA architectural hypothesis that canonicality is a governance property and that canonical authority may be delegated, including to AI.

The corresponding CRA architectural position proposes that:

- canonicality is not equivalent to objective truth;
- canonicality exists within authority and scope;
- canonical authority may be delegated;
- automated systems, including AI, may exercise delegated authority;
- canonicalization rigor is governed rather than intrinsic to canonicality;
- pragmatic trade-offs between rigor, cost, speed, risk, and usefulness may be legitimate;
- and canonical representations must remain correctable and evolvable.

CKES is responsible for determining whether these ideas work in practice.

The central CKES research question becomes:

> **Can a system use delegated AI canonical authority to populate and maintain useful canonical knowledge quickly and economically, while preserving sufficient quality, provenance, governance, and correctability?**

---

## 2. Relationship to CRA

CRA and CKES have different responsibilities.

```text
CRA
 │
 ├─ defines candidate architectural principles
 ├─ defines authority and scope concepts
 ├─ distinguishes canonicality from truth
 └─ permits delegated canonical authority
        │
        ▼
CKES
 │
 ├─ implements candidate mechanisms
 ├─ tests AI canonicalization
 ├─ measures accuracy and cost
 ├─ tests escalation strategies
 ├─ tests provenance and evolution
 └─ reports findings
        │
        ▼
Experimental Evidence
        │
        ▼
CRA Refinement
```

CKES MUST distinguish between:

- existing CRA requirements;
- candidate CRA principles;
- CKES experimental constructs;
- domain-specific policies;
- implementation choices;
- and experimentally supported findings.

---

## 3. Revised CKES Assumption

CKES should no longer assume:

> AI may propose canonical changes but must never exercise canonical authority.

Instead, CKES should test:

> **AI may exercise canonical authority when a recognized governing authority explicitly delegates that authority within a defined scope.**

The AI's authority is not inherent.

It derives from the governing authority and applies only within the authorized scope.

---

## 4. Pragmatic Canonicalization

CKES should investigate **Pragmatic Canonicalization**.

The objective is not to maximize verification regardless of cost.

It is to determine the least expensive and least complex canonicalization process that produces knowledge of sufficient quality for its intended use and risk.

Conceptually:

```text
maximize useful canonical knowledge

subject to:
    acceptable quality
    acceptable risk
    acceptable cost
    acceptable latency
    available compute
    available human effort
```

This is an experimental objective, not a finalized mathematical optimization model.

---

## 5. Canonicalization Rigor Modes

CKES should support and compare multiple experimental rigor modes.

### 5.1 Pragmatic AI

```text
Source
 ↓
Designated AI Authority
 ↓
Domain Policy
 ↓
Canonical Commit
```

Purpose:

- rapid population;
- low processing cost;
- minimal human involvement;
- baseline measurement.

### 5.2 Verified AI

```text
Source
 ↓
AI Analysis
 ↓
Automated Retrieval / Validation
 ↓
Policy
 ↓
Canonical Commit
```

Potential verification:

- duplicate detection;
- contradiction detection;
- provenance checks;
- structured retrieval;
- lexical retrieval;
- vector retrieval;
- consistency checks.

### 5.3 Corroborated AI

```text
Source
 ↓
Primary AI
 ↓
Additional Source and/or Model Corroboration
 ↓
Policy
 ↓
Canonical Commit
```

Purpose:

- measure whether additional AI or source corroboration materially improves quality;
- measure the cost of that improvement.

### 5.4 Human-Governed

```text
Source
 ↓
AI Analysis
 ↓
Evidence / Validation
 ↓
Human or Expert Review
 ↓
Canonical Commit
```

Purpose:

- provide a higher-rigor comparison;
- investigate high-risk or contested knowledge;
- estimate human-review cost.

The exact modes and names remain experimental.

---

## 6. Default Versus Escalated Processing

CKES should test whether most ordinary knowledge can use an inexpensive default path while exceptional cases receive additional scrutiny.

```text
Incoming Knowledge
        ↓
Designated AI Authority
        ↓
Risk / Uncertainty / Policy Evaluation
        ├─────────────────┐
        ↓                 ↓
Ordinary Case       Exceptional Case
        ↓                 ↓
Canonicalize        Escalated Processing
                          ↓
                 Canonicalize / Defer /
                    Reject / Human Review
```

Potential escalation triggers include:

- low AI confidence;
- conflicting evidence;
- contradiction with existing canonical knowledge;
- high-risk subject matter;
- inadequate provenance;
- unexpected novelty;
- large canonical structural change;
- policy requirements;
- or repeated challenges to existing knowledge.

---

## 7. Knowledge Contributions Remain Useful

The earlier CKES concept of a **Knowledge Contribution** remains useful.

A Knowledge Contribution is:

> **A bounded semantic claim or coherent unit of potentially reusable knowledge extracted from source material and presented to CKES for evaluation.**

It is not automatically canonical knowledge.

For example:

```text
Recipe
    ↓
Knowledge Extraction
    ↓
Knowledge Contribution
    ↓
Canonicalization Authority
    ↓
Canonical Knowledge Decision
```

Pragmatic canonicalization does not eliminate the need to identify what knowledge a source contributes.

It changes how much verification must occur before that contribution can affect canonical state.

---

## 8. Source Traceability

Every canonicalized contribution should remain traceable according to applicable policy.

The POC should preserve a path conceptually equivalent to:

```text
Canonical Knowledge
        ↓
Canonicalization Decision
        ↓
Knowledge Contribution
        ↓
Source Fragment
        ↓
Source Revision
        ↓
Source System
```

For Recipe Vault experiments, useful traceability information includes:

```text
source_system
source_object_id
source_revision
source_fragment/path
source_fragment_hash
extraction model
extraction configuration
canonicalization model
canonicalization policy
canonicalization method
timestamp
```

This enables later re-evaluation when source material changes or a canonical decision is challenged.

---

## 9. Authority Metadata

The POC should represent sufficient information to identify canonical authority.

Conceptually:

```text
canonical_authority:
    CALS

delegated_authority:
    AI canonicalization service

authority_scope:
    ordinary culinary knowledge

canonicalization_method:
    PRAGMATIC_AI

policy:
    CALS Canonicalization Policy vX

canonical_since:
    [timestamp]
```

The exact schema remains an implementation decision.

---

## 10. Canonicalization Method Provenance

CKES should record how canonical status was established.

Possible experimental values include:

```text
PRAGMATIC_AI
VERIFIED_AI
CORROBORATED_AI
HUMAN_GOVERNED
```

This permits later analysis of error rates and quality by canonicalization method.

---

## 11. Canonicalization Budget

CKES should investigate whether canonicalization can be governed by an explicit or implicit resource budget.

Example:

```text
Canonicalization Budget

Default mode:
    PRAGMATIC_AI

Maximum ordinary-case AI cost:
    [experiment value]

Escalate when:
    high risk
    contradiction
    low confidence
    insufficient provenance

Higher-rigor budget:
    [experiment value]
```

The purpose is to determine whether canonical quality can be maintained without applying maximum-cost processing universally.

---

## 12. CALS as the Initial Experimental Domain

CALS remains the initial CKES target domain.

Culinary knowledge provides:

- ordinary low-risk knowledge;
- subjective knowledge;
- conflicting practices;
- regional differences;
- evolving knowledge;
- procedural knowledge;
- reusable techniques;
- recipe-specific knowledge;
- and higher-risk food-safety knowledge.

This makes CALS useful for testing whether canonicalization rigor can vary by risk and purpose.

CALS-specific policy MUST NOT automatically become generic CKES or CRA architecture.

---

## 13. Recipe Vault as the Initial Source Model

The Recipe Vault remains the initial source-data model and eventual production source for CALS knowledge acquisition.

The POC should continue using Recipe Vault-compatible synthetic source data because the current production corpus is not sufficiently large for controlled experiments.

The generic CKES pipeline should remain isolated behind a source adapter so synthetic input can later be replaced by actual Recipe Vault changes.

```text
POC:
Synthetic Recipe Vault-Compatible Source
        ↓
Recipe Vault Adapter
        ↓
CKES

Production:
Actual Recipe Vault
        ↓
Recipe Vault Adapter / Change Interface
        ↓
CKES
```

---

## 14. Synthetic Canonicalization Is Required

Synthetic source material must be allowed to produce canonical knowledge inside an isolated experimental canonical scope.

Synthetic provenance must prevent accidental promotion into authoritative production CALS knowledge.

It must NOT prevent the POC from exercising the full canonicalization path.

```text
Synthetic Recipe
        ↓
Knowledge Contributions
        ↓
Delegated AI Authority
        ↓
Experimental Canonical Knowledge
```

All synthetic-derived canonical knowledge must remain clearly marked experimental and non-production.

---

## 15. Bootstrap Modes

CKES should test at least two knowledgebase starting conditions.

### Minimal Bootstrap

Approximately:

- 10–25 concepts;
- a few relationships;
- 3–5 representative canonical knowledge objects.

Purpose:

> Measure organic knowledge discovery and canonical growth.

### Mature Bootstrap

Approximately:

- 100–200+ concepts;
- representative relationships;
- representative canonical knowledge objects.

Purpose:

> Measure reuse, duplicate detection, and operation against an established knowledgebase.

Where practical, equivalent corpora should be processed under both modes.

---

## 16. Controlled Synthetic Corpus

Synthetic generation should use controlled recipe families and known semantic conditions rather than simply requesting a large number of arbitrary recipes.

The corpus should include:

- exact duplicates;
- paraphrases;
- near duplicates;
- regional variants;
- technique-sharing recipes;
- extensions;
- contradictions;
- deliberate errors;
- genuinely novel knowledge;
- and information that should not become canonical.

Progressive corpus sizes may remain approximately:

| Stage | Recipes | Purpose |
|---|---:|---|
| Seed | 50 | Pipeline debugging |
| POC-1 | 500 | First meaningful comparison |
| POC-2 | 5,000 | Retrieval, cost, and canonical economy |
| POC-3 | 25,000 | Scalability and maturity |
| Stress | 100,000+ | Only after earlier stages justify it |

---

## 17. Knowledge-Level Ground Truth

Recipe-level ground truth is insufficient.

Synthetic generation should also provide hidden ground truth for expected Knowledge Contributions.

Example:

```text
Recipe R-103

KC-103-01
    expected: EQUIVALENT
    target: CK-0042

KC-103-02
    expected: NOVEL

KC-103-03
    expected: EXTENDS
    target: CK-0066

KC-103-04
    expected: NON_CANONICAL
```

The canonicalization engine MUST NOT receive this ground truth.

It exists solely for evaluation.

---

## 18. Single-AI Authority Experiment

A primary CKES experiment should determine whether one designated AI can economically populate a useful canonical knowledgebase.

```text
Source Changes
        ↓
Knowledge Extraction
        ↓
Designated AI Canonical Authority
        ↓
CALS Policy
        ↓
Experimental Canonical Commit
```

Measure:

- correct canonical admissions;
- incorrect admissions;
- duplicate creation;
- missed novelty;
- inappropriate rejection;
- contradiction handling;
- cost;
- latency;
- throughput;
- and later correction rate.

This provides the baseline against which more rigorous modes are compared.

---

## 19. Verification Value Experiment

Process comparable source material using:

```text
Mode A:
Single AI Authority
```

and:

```text
Mode B:
AI + Automated Verification
```

Compare quality improvement against additional cost.

The important question is not merely whether Mode B is more accurate.

It is:

> **How much more accurate is it, and is that improvement worth the additional cost and complexity for the governed domain?**

---

## 20. Corroboration Value Experiment

Where useful, compare:

```text
Single AI
```

with:

```text
Multiple AI models and/or stronger AI model
```

and/or:

```text
Multiple independent sources
```

Measure:

- quality gain;
- conflict detection;
- error reduction;
- cost increase;
- latency increase;
- and cases where corroboration changes the canonical decision.

This will test whether multi-model or multi-source canonicalization should be routine, selective, or unnecessary.

---

## 21. Risk-Based Canonicalization Experiment

CALS should include knowledge categories with different risk.

Examples:

### Ordinary / Lower Risk

- terminology;
- culinary history;
- technique descriptions;
- recipe classifications;
- stylistic practices.

### Higher Risk

- food safety;
- allergens;
- toxicity;
- preservation safety;
- hazardous preparation practices.

Test whether policy can route ordinary knowledge through pragmatic AI while escalating higher-risk knowledge.

The POC must not treat synthetic AI-generated food-safety information as authoritative real-world guidance.

---

## 22. Hybrid Retrieval Remains Valuable

Pragmatic canonicalization does not eliminate duplicate detection or semantic retrieval.

CKES should continue evaluating:

```text
Exact Identity Matching
        +
Normalized Matching
        +
Structured Matching
        +
Full-Text Retrieval
        +
Vector Similarity
        ↓
Candidate Existing Knowledge
```

The difference is that policy determines when expensive semantic adjudication is justified.

Cheap retrieval should be used wherever it reduces unnecessary AI processing.

---

## 23. Vectors Remain Derived Representations

Vector embeddings remain retrieval aids, not canonical authority.

```text
Canonical Knowledge
       │
       ├── Graph Representation
       ├── Search Representation
       └── Vector Representation
```

Vector similarity may identify likely related knowledge.

It must not independently establish canonical identity merely because a similarity threshold is exceeded.

---

## 24. Model and Provider Abstraction

The POC may initially use a particular AI provider and model, but generic CKES architecture should expose roles such as:

```text
KnowledgeExtractor
SemanticReasoner
EmbeddingProvider
CanonicalizationAuthority
```

rather than making CKES architecture dependent on one vendor.

This enables controlled comparison of:

- different models;
- stronger versus cheaper models;
- hosted versus local models;
- and future AI systems.

---

## 25. Separate Uncertainty Dimensions

CKES should avoid collapsing different kinds of uncertainty.

At minimum distinguish:

### Extraction Confidence

Did the system correctly understand what the source says?

### Semantic Resolution Confidence

How confidently does the contribution relate to existing knowledge?

### Canonicalization Confidence

How confidently does the delegated authority believe the canonical decision is appropriate under policy?

### Evidence Confidence

How strong is the supporting evidence, where evidence strength matters?

These may influence escalation differently.

---

## 26. Correctability Experiment

Pragmatic canonicalization is viable only if incorrect canonical decisions can be corrected efficiently.

The POC should deliberately introduce cases where initially canonicalized knowledge later encounters:

- contradictory source information;
- better evidence;
- a source correction;
- source deletion;
- policy changes;
- or a better AI model.

Test:

```text
Canonical K1
    ↓
Re-evaluation trigger
    ↓
Decision
    ├─ Retain K1
    ├─ Modify
    ├─ Split
    ├─ Merge
    └─ Supersede with K2
```

Historical canonical state must remain inspectable.

---

## 27. Re-Evaluation Triggers

CKES should investigate triggers such as:

- source revision;
- source deletion;
- new contradictory evidence;
- new corroborating evidence;
- user challenge;
- detected duplicate;
- policy revision;
- AI-model improvement;
- scheduled audit;
- risk reclassification;
- or major semantic graph restructuring.

Re-evaluation should be demand-driven where possible rather than requiring continuous reprocessing of the entire knowledgebase.

---

## 28. Cost Metrics

Measure at minimum:

```text
AI cost per source change
AI cost per extracted Knowledge Contribution
AI cost per canonicalization decision
AI cost per novel contribution
AI cost per accepted canonical object
AI cost per corrected canonical object
AI cost by rigor mode
AI cost by corpus maturity
```

Also measure:

- token usage;
- number of model calls;
- latency;
- throughput;
- retrieval cost;
- database growth;
- vector-index growth;
- and human-review time where applicable.

---

## 29. Quality Metrics

Potential metrics include:

```text
canonical admission precision
canonical admission recall
novelty precision
novelty recall
duplicate detection precision
duplicate detection recall
semantic adjudication accuracy
false canonical admission rate
false rejection rate
contradiction detection rate
later correction rate
human escalation rate
```

Metrics should be compared by canonicalization rigor mode.

---

## 30. Canonical Economy and Maturity

CKES should continue testing whether canonical growth slows relative to source growth as the knowledgebase matures.

Conceptually:

```text
Source Volume
     ↑↑↑

Canonical Novelty Rate
     ↓
```

Likewise, test whether AI cost per source contribution declines as known concepts and canonical knowledge accumulate.

If canonical identity growth remains approximately linear with source growth, investigate:

- overly permissive policy;
- excessive granularity;
- poor duplicate detection;
- failed concept reuse;
- or incorrect architectural assumptions.

---

## 31. Progressive Experiment

Preserve accumulated experimental canonical knowledge between primary corpus stages.

```text
Seed Corpus
    ↓
Knowledge V1
    ↓
Add POC-1
    ↓
Knowledge V2
    ↓
Add POC-2
    ↓
Knowledge V3
    ↓
Add POC-3
    ↓
Knowledge V4
```

Measure how maturity affects:

- novelty;
- reuse;
- retrieval;
- AI cost;
- correction rate;
- and canonical growth.

Separate reset-based runs may be used for reproducibility.

---

## 32. Experimental Processing Paths

CKES should support a short pragmatic path:

```text
Source Change
    ↓
Knowledge Extraction
    ↓
Knowledge Contribution
    ↓
Designated AI Authority
    ↓
Policy
    ↓
Canonical Commit
```

and a more rigorous path:

```text
Source Change
    ↓
Knowledge Extraction
    ↓
Knowledge Contribution
    ↓
Hybrid Retrieval
    ↓
Semantic Adjudication
    ↓
Evidence Evaluation
    ↓
Policy Validation
    ↓
Optional Corroboration / Human Review
    ↓
Canonical Commit
```

The experiment should determine when the longer path provides enough value to justify its cost.

---

## 33. Controlled Commit Still Matters

Delegated AI authority does not require the AI model to write directly into arbitrary database structures.

Authority and technical write access are distinct concerns.

A safe implementation may still use:

```text
AI Canonical Decision
        ↓
Structured Change Set
        ↓
Schema / Integrity Validation
        ↓
Canonical Commit Mechanism
        ↓
Canonical State
```

The commit mechanism can enforce structural integrity without overruling the AI's delegated semantic authority.

This preserves an important distinction:

> **Semantic authority does not require unrestricted database authority.**

---

## 34. Canonicalization Reports

Each experimental run should record:

```text
input source changes
knowledge contributions
canonical decisions
new canonical objects
existing-object mappings
conflicts
deferrals
rejections
escalations
corrections
canonicalization method
AI model
policy version
token usage
monetary cost
latency
database growth
quality metrics
```

Reports should allow direct comparison among rigor modes.

---

## 35. Research Questions

CKES should answer at least:

1. Can one designated AI authority produce a useful canonical knowledgebase?
2. At what error rate?
3. What kinds of errors dominate?
4. How expensive is single-AI canonicalization?
5. How much quality does automated verification add?
6. How much does that verification cost?
7. How much does multi-model corroboration add?
8. When is human review worth its cost?
9. What conditions should trigger escalation?
10. Can policy reliably route knowledge by risk?
11. How much provenance is needed for practical correctability?
12. How frequently must pragmatic canonical decisions later be corrected?
13. Does the correction cost negate the savings from pragmatic admission?
14. Does knowledgebase maturity reduce AI cost?
15. Does canonical novelty decline with corpus maturity?
16. Can a canonicalization budget be enforced effectively?
17. Can different AI models exercise the same delegated authority under the same policy with comparable results?
18. Which mechanisms are CALS-specific?
19. Which mechanisms generalize to other domains?
20. Which experimental findings should flow back into CRA?

---

## 36. Findings Flow Back to CRA

CKES should explicitly classify findings.

Example:

```text
Finding:
Single-AI pragmatic canonicalization achieved X quality
at Y cost under CALS experiment Z.

Classification:
CKES experimental result

Potential implication:
Supports / challenges CRA candidate principle
"Pragmatic Canonicalization Is Legitimate."
```

CKES must not silently convert experimental success into CRA architecture.

CRA should evaluate the evidence separately.

---

## 37. Initial Cursor Direction

The current CKES POC Plan should be revised against this research direction.

Cursor should:

1. preserve the existing Recipe Vault-compatible source strategy;
2. preserve Knowledge Contributions;
3. preserve source traceability;
4. preserve hybrid retrieval and vectors as optional tools;
5. remove assumptions that maximum verification is mandatory;
6. permit AI to exercise explicitly delegated canonical authority;
7. add multiple canonicalization rigor modes;
8. add authority/scope/method provenance;
9. preserve a controlled technical commit mechanism;
10. add single-AI versus verified/corroborated comparison experiments;
11. add risk-based escalation;
12. add canonicalization-budget experiments;
13. add correction and supersession experiments;
14. measure quality versus cost by rigor mode;
15. preserve experimental/non-production separation;
16. document findings for possible CRA feedback.

Large-scale corpus generation should not begin until the revised vertical slice demonstrates at least the pragmatic AI path and one higher-rigor comparison path.

---

## 38. Conclusion

CKES should no longer attempt to prove that every piece of canonical knowledge is the best representation obtainable through maximum verification.

Its research objective is more practical:

> **Determine how much canonicalization rigor is actually necessary to produce useful, governable, correctable canonical knowledge at acceptable cost.**

A single AI may prove sufficient for large portions of an ordinary domain.

Other knowledge may justify automated verification, corroboration, or human review.

CKES should measure those trade-offs rather than assume them.

The success criterion is not perfect knowledge.

It is a system that can:

- populate canonical knowledge rapidly;
- keep costs practical;
- maintain acceptable quality;
- preserve provenance;
- identify authority and scope;
- escalate where necessary;
- correct mistakes;
- evolve canonical state;
- and provide evidence that CRA can use to refine the architecture.

The fundamental experiment is therefore:

> **How close can we get to the best practical Canonical Representation while spending only the rigor that the knowledge, risk, and purpose actually justify?**
