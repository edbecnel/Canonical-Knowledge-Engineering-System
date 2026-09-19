# Benchmark Evaluation Architecture (POC)

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Architecture](README.md) › Benchmark Evaluation Architecture

> **Status:** Maintained (Handover 1)
> **Owner:** Architecture Team
> **Classification:** POC / pre-normative (not `CKES-0001`)
> **Last Reviewed:** 2026-09-19

## Purpose

Define how CKES evaluates canonicalization decisions using versioned JSON contracts, three distinct evaluation facilities, and leakage-safe boundaries—without claiming CRA normative conformance.

**Reference-baseline capture and comparison capability** exists in Handover 2 (`@ckes/harness`, Scenario Lab). **First official reference-baseline evidence** (`REFERENCE-BASELINE-001`) is Handover 3.

## Terminology

| Term | Meaning |
| --- | --- |
| Benchmark Suite | Versioned collection of scenarios and expected outcomes |
| Benchmark Pack | Importable JSON artifact (`benchmark-pack.schema.json`) |
| Run profile | JSON run configuration (`benchmark-run-profile.schema.json`) — **not** a reference baseline |
| Benchmark Run | One execution under a run profile (Handover 2 runner) |
| Reference Baseline (official) | Designated completed run — official series in Handover 3 |
| Comparison reference (H2) | Sidecar designation on a completed run (smoke/dev/harness fixture labels only) |

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

## Handover 2 execution

- **`@ckes/harness`**: serial runs (`concurrency = 1`), `TRUNCATE`/reset isolation between scenarios (see Handover 02 integration report), CLI + Scenario Lab API.
- **`@ckes/benchmark`**: contracts, hashing, `toBrowserPackView`, pure scoring/render — no dependency on harness.
- **Scenario Lab**: Vite + React → localhost API (`127.0.0.1`) → harness only.
- **Designations**: append-only sidecar JSONL — never mutates immutable run-result files.

## Related documents

- [Benchmark Terminology and Decision Vocabulary](../Reference/Benchmark_Terminology_and_Decision_Vocabulary.md)
- [ADR-0004 (Proposed)](ADRs/ADR-0004-json-benchmark-interchange-and-evaluation-facilities.md)
- [Handover 01 Integration Report](../Development/Handover_01_Benchmark_Integration_Report.md)
