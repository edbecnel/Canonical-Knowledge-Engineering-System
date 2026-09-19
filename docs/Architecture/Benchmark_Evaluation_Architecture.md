# Benchmark Evaluation Architecture (POC)

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Architecture](README.md) › Benchmark Evaluation Architecture

> **Status:** Maintained (Handover 1)
> **Owner:** Architecture Team
> **Classification:** POC / pre-normative (not `CKES-0001`)
> **Last Reviewed:** 2026-09-19

## Purpose

Define how CKES evaluates canonicalization decisions using versioned JSON contracts, three distinct evaluation facilities, and leakage-safe boundaries—without claiming CRA normative conformance or designating reference baselines (Handover 3).

## Terminology

| Term | Meaning |
| --- | --- |
| Benchmark Suite | Versioned collection of scenarios and expected outcomes |
| Benchmark Pack | Importable JSON artifact (`benchmark-pack.schema.json`) |
| Run profile | JSON run configuration (`benchmark-run-profile.schema.json`) — **not** a reference baseline |
| Benchmark Run | One execution under a run profile (Handover 2 runner) |
| Reference Baseline | A designated completed run result (Handover 3) |

## Three evaluation facilities

| Facility | Measures | Metrics mixing |
| --- | --- | --- |
| **Corpus evaluation** | Synthetic corpus extraction + pipeline; evaluator ground truth | Corpus-only aggregates |
| **Reviewed benchmark** | Frozen JSON packs with expected outcomes | Pack/stratified aggregates (Handover 2+) |
| **Exploratory** | Draft scenarios | **No** official scores until `released` pack |

Do not combine facility metrics as one headline number.

## JSON vs YAML

JSON is authoritative for benchmark packs, run profiles, and run results. YAML remains valid for corpus manifests, bootstrap knowledge, docker-compose, and EDF adoption metadata.

## Execution modes and profiles

- **full_pipeline:** source → extraction → candidate → retrieval → adjudication → policy
- **decision_slice:** supplied candidate → retrieval → adjudication → policy

- **clean:** fixed seed; no prior scenario adjudications
- **warm:** versioned prior decisions (orchestration Handover 2)

Handover 1 implements schema fields and documentation only—not warm orchestration.

## Leakage prohibition

Expected outcomes, prohibited identities, scoring metadata, and retrieval hints MUST NOT reach the pipeline. `@ckes/benchmark` `toPipelineInput()` is an **allowlist** projection. Evaluator ground truth lives in `synthetic.evaluator_ground_truth` and is not queried by `poc/packages/pipeline/`.

## Content hashing

Pack `contentHash` = SHA-256(RFC 8785 JCS(hash document)). See [poc/benchmark/schemas/README.md](../../poc/benchmark/schemas/README.md).

## Handover 2 boundary

Execution is implemented by `HarnessRunner` (interfaces in `@ckes/benchmark`). Handover 1 provides `benchmark:smoke` (contract validation only).

## Related documents

- [Benchmark Terminology and Decision Vocabulary](../Reference/Benchmark_Terminology_and_Decision_Vocabulary.md)
- [ADR-0004 (Proposed)](ADRs/ADR-0004-json-benchmark-interchange-and-evaluation-facilities.md)
- [Handover 01 Integration Report](../Development/Handover_01_Benchmark_Integration_Report.md)
