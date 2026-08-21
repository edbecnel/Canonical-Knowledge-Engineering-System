# Cursor Plan Handover — Canonical Knowledge Engineering System (CKES)

We are creating a new independent project named:

**Canonical Knowledge Engineering System (CKES)**

The introductory architectural document is:

`CKES_PROJECT_INTRODUCTION.md`

Read that document completely before proposing implementation work.

CKES is an architectural research, experimentation, and prototyping project intended to determine how CRA-adopting systems can acquire and maintain canonical knowledge automatically, economically, and at scale.

## Project Relationships

CKES is a new project/repository.

It is NOT a CALS subproject.

CKES has explicit relationships with:

- **EDF** — CKES must be bootstrapped and governed using applicable Engineering Documentation Framework requirements.
- **CRA** — provides the architectural foundation and unresolved architectural questions that CKES will experimentally investigate.
- **CALS** — serves as CKES's first target knowledge domain.
- **The Recipe Vault** — provides the initial source-data schema/model and eventually the real production source of culinary knowledge contributions.

The generic CKES architecture must not become dependent upon CALS or The Recipe Vault.

## Repository Discovery

Before implementation:

1. Inspect EDF and determine the applicable bootstrap process.

2. Inspect CRA and identify relevant work concerning:
   - canonical knowledge;
   - canonical identity;
   - canonical relationships;
   - context;
   - provenance;
   - derived representations;
   - and architectural evolution.

3. Inspect CALS and identify its current architecture and knowledge requirements.

4. Inspect The Recipe Vault and identify:
   - current database technology;
   - recipe schema;
   - JSON/domain models;
   - identifiers;
   - ingredient representation;
   - instruction representation;
   - source/provenance representation;
   - revision/change tracking;
   - AI-generation metadata if present;
   - import metadata;
   - and potentially reusable implementation assets.

5. Determine how CKES should reference these repositories without unnecessary copying or coupling.

## Recipe Vault Production Relationship

The CKES POC must anticipate eventual production use of the actual Recipe Vault database.

Do NOT design the POC around a permanent synthetic database interface that cannot later be replaced.

The intended transition is:

```text
POC:

Synthetic Recipe Vault-Compatible Source
                 │
                 ▼
        Recipe Vault Adapter
                 │
                 ▼
                CKES
```

becoming:

```text
Production:

Actual Recipe Vault
        │
        ▼
Recipe Vault Adapter / Change Interface
        │
        ▼
       CKES
```

Investigate which Recipe Vault changes are legitimately required to support efficient incremental knowledge acquisition.

Distinguish carefully between:

1. information that properly belongs in Recipe Vault itself; and
2. CKES processing state that should remain in CKES.

Potential legitimate Recipe Vault improvements include:

- stable source identity;
- recipe revision identity;
- revision history;
- content fingerprints;
- change timestamps;
- provenance;
- import origin;
- AI-generation origin where applicable;
- and meaningful ingredient/instruction change tracking.

Do NOT place CKES-specific vectors, prompts, canonicalization state, or CALS knowledge structures into Recipe Vault merely for convenience.

## Source Change Contract

Design an experimental source-change contract capable of identifying:

- source system;
- source object;
- source revision;
- previous revision;
- change type;
- changed fields;
- content fingerprint;
- and timestamp.

The contract should ultimately be capable of supporting source systems other than Recipe Vault.

## POC Database

Design an isolated, disposable, reproducible experimental database.

Reuse the Recipe Vault schema where practical.

Extend the experimental environment where CKES requires additional structures.

Do not modify production Recipe Vault or CALS data during the POC.

## Synthetic Corpus

Do NOT begin with hundreds of thousands of recipes.

Use progressive corpus stages approximately as follows:

- Seed: ~50 recipes
- POC-1: ~500 recipes
- POC-2: ~5,000 recipes
- POC-3: ~25,000 recipes
- Stress testing: 100,000+ only after earlier stages justify it

These are starting recommendations, not immutable requirements.

Propose adjustments if repository inspection or implementation constraints warrant them.

## Controlled Generation

Do not simply prompt AI to "generate 5,000 recipes."

Design a reproducible synthetic corpus manifest.

Create controlled recipe families containing known semantic relationships such as:

- exact duplicate;
- paraphrase;
- near duplicate;
- regional variant;
- minor variation;
- major variation;
- extension;
- shared technique;
- contradiction;
- deliberate error;
- genuinely novel contribution;
- and information that should not become canonical.

Representative families should cover sufficiently diverse culinary areas.

## Ground Truth

Synthetic generation must produce separate experimental ground-truth metadata.

For example:

```text
recipe_0042
    derived_from: recipe_0007
    expected_relationship: PARAPHRASE

recipe_0043
    derived_from: recipe_0007
    expected_relationship: NEAR_DUPLICATE

recipe_0044
    derived_from: recipe_0007
    expected_relationship: EXTENSION

recipe_0045
    derived_from: recipe_0007
    expected_relationship: CONTRADICTION
```

Ground truth MUST NOT be visible to the canonicalization engine during evaluation.

Use it afterward to measure accuracy.

## Simulated Recipe Vault Lifecycle

Do not treat the synthetic corpus only as a static bulk import.

Simulate an evolving Recipe Vault.

Create scenarios involving:

- recipe creation;
- import;
- modification;
- ingredient changes;
- instruction changes;
- provenance changes;
- deletion;
- and repeated revisions.

Measure whether CKES can avoid unnecessary reprocessing.

## Progressive Knowledge Growth

Preserve accumulated canonical knowledge between primary corpus stages.

The main scale experiment should resemble:

```text
Seed Corpus
    ↓
Knowledge V1
    ↓
Add ~500 recipes
    ↓
Knowledge V2
    ↓
Add ~5,000 recipes
    ↓
Knowledge V3
    ↓
Add ~25,000 recipes
    ↓
Knowledge V4
```

Do not reset the canonical knowledgebase between these primary maturity stages.

Separate clean-reset experiments may also be run where useful.

## Canonical Growth Measurement

Measure whether canonical novelty declines as the knowledgebase matures.

Track at minimum by corpus stage:

- new concepts per 1,000 source items;
- new relationships per 1,000 source items;
- new canonical knowledge objects per 1,000 source items;
- mappings to existing knowledge;
- evidence-only outcomes;
- rejected/deferred candidates;
- and conflicts.

If canonical concepts and CK objects grow approximately linearly with source recipe count, treat that as an architectural warning requiring investigation.

## AI Cost Maturity

Measure whether AI processing becomes cheaper as CALS knowledge matures.

Track:

- AI calls per source item;
- tokens per source item;
- cost per source item;
- cost per accepted canonical object;
- percentage resolved without expensive semantic reasoning;
- average semantic candidate-set size;
- and cost by corpus maturity stage.

Do not assume that cost will flatten.

The experiment exists to determine whether it does.

## Canonicalization Pipeline

Plan an incremental implementation of:

```text
Source
  ↓
Adapter
  ↓
Change Detection
  ↓
Cheap Filtering
  ↓
AI Discovery
  ↓
Candidate Knowledge
  ↓
Hybrid Retrieval
  ↓
AI Semantic Adjudication
  ↓
Canonicalization Policy
  ↓
Proposed Change Set
  ↓
Validation
  ↓
Controlled Canonical Commit
  ↓
Canonical Knowledge
```

## Hybrid Retrieval

Evaluate:

- exact matching;
- normalized matching;
- structured concept matching;
- relationship/context matching;
- full-text search;
- vector similarity;
- and bounded AI semantic reasoning.

Vectors are derived representations.

They must never constitute canonical identity or canonical authority.

Do not assume a dedicated vector database is necessary.

## Canonicalization Policy

Design an initial CALS Culinary Knowledge Canonicalization Policy in both:

1. human-readable form; and
2. machine/AI-consumable form.

It should govern:

- concept creation and reuse;
- knowledge boundaries;
- canonical granularity;
- canonical economy;
- semantic novelty;
- contexts;
- relationships;
- evidence;
- provenance;
- uncertainty;
- conflicts;
- risk;
- admission;
- rejection;
- deferral;
- merge;
- split;
- supersession;
- and retirement.

## Authority and Commit

AI must not directly alter canonical state.

Design:

```text
AI Proposal
    ↓
Staging
    ↓
Policy Evaluation
    ↓
Validation
    ↓
Canonical Commit
```

Only the controlled commit mechanism should alter canonical state.

## Initial Vertical Slice

The first implementation should be the smallest useful experiment capable of exercising:

```text
Synthetic Recipe
      ↓
Recipe Vault-Compatible Source Record
      ↓
Source Change
      ↓
Candidate Knowledge
      ↓
Existing Semantic Retrieval
      ↓
AI Comparison
      ↓
Policy Decision
      ↓
Staged Canonical Change
      ↓
Measured Result
```

Do not build the complete envisioned system before this vertical slice works and can be measured.

## Research Discipline

For every significant result, distinguish whether it is:

- an existing CRA requirement;
- a CKES hypothesis;
- a CKES implementation choice;
- a CALS domain policy;
- a Recipe Vault requirement;
- a Recipe Vault integration detail;
- an experimental result;
- or a candidate architectural finding for later CRA consideration.

Failures are valuable experimental evidence.

## Requested Plan

Produce a detailed CKES bootstrap and proof-of-concept Plan that includes:

1. EDF bootstrap requirements.
2. CKES repository bootstrap.
3. Cross-repository reference strategy.
4. Relevant CRA dependencies and unresolved questions.
5. CALS domain boundary.
6. Current Recipe Vault schema analysis.
7. Proposed Recipe Vault changes, clearly separated from CKES-only state.
8. Recipe Vault adapter design.
9. Source-change contract.
10. Experimental database architecture.
11. Synthetic corpus manifest design.
12. AI synthetic recipe-generation strategy.
13. Ground-truth generation.
14. Simulated Recipe Vault lifecycle.
15. Bootstrap canonical knowledgebase.
16. CALS canonicalization policy.
17. Hybrid retrieval.
18. Vector analysis.
19. AI semantic adjudication.
20. Staging and controlled canonical commit.
21. Instrumentation and metrics.
22. Seed/500/5,000/25,000 progressive experiments.
23. Canonical-growth measurement.
24. AI-cost maturity measurement.
25. Source revision and deletion experiments.
26. Reproducibility strategy.
27. Risks and expected failure modes.
28. Staged implementation milestones.
29. Unresolved architectural questions.
30. User decisions required before broad implementation.
31. Potential findings that may later flow back into CRA.

Do not begin broad implementation until the Plan has been reviewed.