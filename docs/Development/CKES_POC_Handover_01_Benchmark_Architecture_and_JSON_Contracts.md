[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › CKES POC Handover 01

> **Status:** Archived (integrated 2026-09-19)
> **Owner:** Architecture Team
> **Classification:** Handover brief (historical); authoritative integration in [Handover 01 Benchmark Integration Report](Handover_01_Benchmark_Integration_Report.md) and [Benchmark Evaluation Architecture](../Architecture/Benchmark_Evaluation_Architecture.md)

# CKES POC Handover 01: Benchmark Architecture and JSON Contracts

## Instructions to Cursor Plan

This is **Handover 1 of 3**. Create one implementation plan for this handover only. Do not build the plan until the architect has submitted the plan for external review, returned the review amendments, approved the revised plan, and explicitly instructed Cursor to build it.

Do not incorporate Handover 2 or Handover 3 into this plan. This handover establishes the foundations that those later handovers depend upon.

Apply all current EDF requirements. Inspect the CKES repository before deciding filenames, locations, headers, statuses, ADR/AAR consequences, affected documents, or validation steps. Reconcile all related Markdown documents; do not merely add links. Do not create CKES-0001 or weaken ADR-0001's POC-before-normative-specification gate.

## Outcome

Establish a coherent, versioned benchmark architecture for evaluating CKES canonicalization decisions. Define machine-readable JSON contracts, terminology, evaluation boundaries, ground-truth identity, reproducibility rules, and provisional traceability before implementing the Scenario Lab UI or generating large benchmark packs.

## What the benchmark is intended to prove

The POC must measure whether CKES can economically and safely decide that incoming candidate information:

1. matches existing canonical knowledge;
2. is related but canonically distinct;
3. represents potentially new canonical knowledge;
4. qualifies, contradicts, narrows, expands, or creates revalidation pressure on existing knowledge; or
5. is ambiguous and should be deferred.

It must also measure whether CKES uses the least expensive sufficiently reliable path and avoids dangerous false merges.

The benchmark does not prove universal truth or full CRA conformance. It produces bounded experimental evidence about a particular implementation, corpus, configuration, and run.

## Required terminology

Use these distinctions consistently:

| Term | Meaning |
| --- | --- |
| Benchmark Suite | Versioned collection of scenarios and expected outcomes. |
| Anchor Benchmark Suite | Small, interpretable core suite, normally 50–100 cases. |
| Statistical Benchmark Suite | Large controlled synthetic suite, normally 500–2,000 cases. |
| Challenge Benchmark Suite | Difficult, ambiguous, adversarial, and boundary suite, normally 100–500 cases. |
| Benchmark Pack | Importable JSON artifact containing one versioned suite and its supporting seed definitions. |
| Run Configuration | Exact code, schema, seed, policies, models, database profile, and execution settings. |
| Benchmark Run | One execution of a specified pack under a specified run configuration. |
| Reference Baseline | A selected reproducible benchmark run used as the comparison point. |
| Experiment Run | A later run compared with the reference baseline. |

The Anchor Suite is an input to a baseline; it is not itself the baseline.

## Separate evaluation facilities

Define three related but distinct facilities:

### Corpus evaluation

Measures extraction and processing across generated source artifacts. Repair the current recipe/candidate ground-truth linkage, but do not present recipe-level labels as sufficient candidate-level truth.

### Reviewed benchmark evaluation

Runs frozen JSON packs with assertion- or candidate-level expected outcomes. This is the primary source for comparable accuracy, false-merge, deferral, routing, and economic measurements.

### Exploratory evaluation

Supports architect-created or AI-generated draft scenarios. Exploratory cases do not affect benchmark scores until reviewed and released in a versioned pack.

Do not combine their metrics as though they measure the same thing.

## Authoritative formats

JSON is the authoritative benchmark interchange. Markdown is a deterministic derived representation for human review.

Create or plan the correct repository equivalents of:

- `benchmark-pack.schema.json`
- `benchmark-run-result.schema.json`
- deterministic JSON-to-Markdown rendering rules
- schema-version compatibility and explicit migration rules

Do not retain YAML as a competing authoritative fixture format. If current YAML fixtures exist, plan a one-way migration utility and retirement path.

The JSON benchmark artifact is authoritative only as a test definition. It is not canonical domain knowledge in the CRA sense.

## Benchmark-pack contract

The formal schema must support at least:

### Pack metadata

- schema version;
- pack ID, name, suite class, semantic version, status, and description;
- creation timestamp;
- generation method, generating model/tool, prompt/template version, and human-review status;
- domains and subdomains;
- dependencies and compatible harness versions;
- canonical-seed ID/version/hash;
- pack integrity hash or deterministic hashing rules.

### Execution requirements

- supported execution modes;
- default execution mode;
- clean or warm database profile;
- scenario isolation requirements;
- whether live LLM, live retrieval, mocked retrieval, or retrieval hints are allowed;
- cost ceiling and concurrency policy where applicable.

### Canonical seed material

- stable benchmark-local seed identity;
- entity/assertion/concept type;
- human label and statement;
- domain and applicability;
- relationships required by the scenario;
- reference to an externally versioned seed when not embedded.

### Scenario definition

- scenario ID, title, status, suite, domain, and subdomain;
- full-pipeline or decision-slice execution mode;
- source text and/or direct candidate;
- candidate type;
- context and applicability;
- objective/method and semantic-role information;
- expected decision class;
- expected identity where applicable;
- related identities;
- must-not-match identities;
- acceptable alternative outcomes with conditions;
- expected/prohibited escalation routes;
- LLM policy: required, allowed, not required, or prohibited;
- maximum cost tier;
- expected rationale;
- label-confidence class;
- controlled transformation type;
- failure severity;
- CKES-PAR and validation-matrix traceability;
- generation provenance and human-review status.

### Expected decision vocabulary

Define a provisional, repository-aligned vocabulary that can express at least:

- match existing;
- related but distinct;
- propose new identity;
- qualify existing;
- contradict existing;
- revalidation candidate;
- defer to LLM;
- defer to human; and
- reject as source-specific/non-reusable.

Do not invent CRA normative semantics. Mark the vocabulary provisional and map it to the adopted CRA baseline.

### Label confidence

Support at least:

- deterministic by construction;
- strong expectation;
- acceptable result set;
- expected deferral;
- human review required; and
- research unresolved.

An AI-generated expected answer is not automatically objective truth.

## Run-result contract

Results must be stored separately from fixed benchmark definitions. The result schema must support:

- run ID and run type;
- benchmark pack ID, version, and hash;
- start/end timestamps;
- CKES commit and working-tree state;
- database migration level;
- canonical-seed version/hash;
- policy/configuration versions;
- retrieval and adjudication implementations;
- LLM/embedding provider, model, version, and relevant settings;
- clean/warm profile and random seed;
- scenario-level actual decision, identity, route, pass/fail/acceptable-alternative result, explanation, latency, LLM usage, tokens, cost, and error information;
- aggregate metrics by domain, category, confidence class, execution mode, and failure severity.

Never write actual results into the benchmark pack.

## Evaluation leakage prohibition

Expected identities, prohibited identities, expected decisions, transformation labels, scoring metadata, and retrieval hints MUST NOT be supplied to the CKES pipeline under test.

Mocked, hinted, deterministic-fixture, and live retrieval runs must be labeled separately and must not be mixed in the same score without explicit stratification.

## Ground-truth repair

Repair the broken current evaluation join. Stable source/change/recipe/candidate identities must replace title-text matching.

However, recipe-level ground truth remains insufficient for canonicalization accuracy because one recipe can generate multiple candidates. Establish a migration toward candidate- or assertion-level expected outcomes, including prohibited matches and acceptable deferrals.

## Execution modes

The contracts must support:

- **Full pipeline:** source text → extraction → candidate → retrieval → adjudication → policy.
- **Decision slice:** supplied candidate → retrieval → adjudication → policy.

Results must state the mode. Decision-slice tests isolate canonicalization from extraction defects; full-pipeline tests evaluate the combined behavior.

## Reproducibility and isolation

Define clean and warm profiles separately:

- Clean: fixed canonical seed and no prior scenario adjudications.
- Warm: same seed plus explicitly versioned prior decisions/reuse records.

Each scored scenario must run in a transaction, disposable schema/database, or deterministic reset environment unless an ordered warm-state suite explicitly declares dependencies.

Every comparable run must preserve the benchmark pack and run-configuration hashes.

## Scoring and severity

Measure at least:

- correct match;
- missed match;
- false merge;
- correct related-distinct result;
- correct novel-identity proposal;
- unnecessary new identity;
- correct deferral;
- unnecessary deferral;
- applicability/context error;
- objective/method error;
- contradiction/revalidation error;
- policy violation.

False merges are the highest-risk ordinary matching failure and must not be hidden in a generic failure count.

## Economic measurements

Record at least:

- LLM called/not called;
- number of calls;
- tokens and estimated/actual cost;
- latency;
- route selected;
- number of retrieved candidates;
- prior decision reused;
- human review requested;
- final policy action.

Improvement means acceptable or better decision quality with fewer unnecessary expensive operations, not merely a higher raw pass rate.

## LLM variability

The contract and future runner must allow repeated trials for LLM-dependent scenarios. Single observations must be labeled as such. Deterministic non-LLM stages should be exactly reproducible.

## Derived Markdown

Define deterministic rendering of benchmark and result JSON to Markdown. Generated files must state:

> Generated from the referenced JSON artifact. Do not edit directly.

For large suites, produce summaries and compact appendices rather than unreadable monolithic prose.

## EDF and governance constraints

- Do not create CKES-0001.
- Use provisional CKES-PAR traceability where applicable.
- Identify the adopted/proposed/unavailable CRA baseline precisely.
- Determine ADR/AAR impact under current EDF rules.
- Remove machine-specific `file://` links from permanent documentation.
- Reconcile architecture, POC, validation, glossary/terminology, indexes, watch items, and README documents as required.

## Acceptance criteria for Handover 1

- Terminology clearly distinguishes suites, runs, and reference baselines.
- JSON schemas are versioned and validate representative examples.
- Benchmark definitions and run results are separate.
- Markdown is derived from JSON.
- YAML is migrated or has a documented retirement path.
- Expected-result leakage is structurally prevented.
- Full-pipeline and decision-slice modes are defined.
- Clean/warm profiles and isolation rules are defined.
- Candidate-level ground-truth direction is established.
- False merges and economic measurements are first-class.
- No Scenario Lab UI or large benchmark corpus is built under this handover.
- No CKES-0001 is created.
- EDF validation and affected-document reconciliation are complete or tracked.
