# Handover 01 Benchmark Integration Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 01 Benchmark Integration Report

> **Status:** Maintained
> **Owner:** Architecture Team
> **Applies To:** 2026-09-19 Handover 1 (benchmark architecture)
> **Last Reviewed:** 2026-09-19

## Purpose

Record Handover 1 delivery: JSON benchmark contracts, evaluator-isolated ground truth, documentation reconciliation, and EDF validation—without Scenario Lab UI, large packs, reference baselines, or `CKES-0001`.

## Permanent artifact

| From | To |
| --- | --- |
| `CKES_POC_Handover_01_Benchmark_Architecture_and_JSON_Contracts.md` (repository root) | [CKES POC Handover 01 brief](CKES_POC_Handover_01_Benchmark_Architecture_and_JSON_Contracts.md) (archived) |

Agent integration instructions from the handover are summarized in the integration report and architecture documents; the root copy was removed after integration.

## Affected documents

| Document | Change |
| --- | --- |
| [Benchmark Evaluation Architecture](../Architecture/Benchmark_Evaluation_Architecture.md) | Created |
| [Benchmark Terminology](../Reference/Benchmark_Terminology_and_Decision_Vocabulary.md) | Created |
| [ADR-0004](../Architecture/ADRs/ADR-0004-json-benchmark-interchange-and-evaluation-facilities.md) | Created (Proposed) |
| [AAR-0001](../Architecture/Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md) | Evidence tiers updated |
| [ARCHITECTURE_DECISIONS.md](../../ARCHITECTURE_DECISIONS.md) | ADR-0004 index |
| [PROJECT_INDEX.md](../../PROJECT_INDEX.md) | Benchmark navigation |
| [poc/README.md](../../poc/README.md) | Benchmark scripts + facilities |
| [poc/experiments/baselines/README.md](../../poc/experiments/baselines/README.md) | Run profile terminology |
| [docs/Architecture/README.md](../Architecture/README.md) | Architecture list |
| [docs/Reference/README.md](../Reference/README.md) | Terminology link |
| [docs/Development/README.md](README.md) | Integration report link |

## Partial candidate ground truth (Handover 1 scope)

| Topic | Handover 1 |
| --- | --- |
| Labeled roles | `knowledge_object` only |
| Unlabeled roles | `concept`, `relationship` (and any future extractor outputs) |
| Denominators | Corpus metrics use **labeled** evaluator rows only; unlabeled candidates excluded from precision/recall |
| Coverage | **Partial** — recipe-level legacy rows retained for transition |
| Handover 3 | Full multi-candidate labeling, large packs, reference baseline designation |

## Evidence tiers (AAR-0001)

| Tier | Handover 1 deliverable |
| --- | --- |
| Architectural contract | JSON schemas, architecture doc, ADR-0004 Proposed |
| Working implementation | Evaluator GT store, structural joins, `@ckes/benchmark` library |
| Smoke test | `npm run benchmark:smoke`, `benchmark:validate` |
| Deferred H2 | HarnessRunner, warm orchestration, multi-trial execution |
| Deferred H3 | Reference baseline, production-sized suites |

Schema validation alone does **not** close POC implementation gaps in AAR-0001.

## Handover 1 boundary verification (§20)

| Check | Result |
| --- | --- |
| No Scenario Lab UI | Confirmed |
| No production-sized Anchor/Statistical/Challenge pack | Confirmed (example pack only) |
| No general benchmark runner | Confirmed (`benchmark:smoke` only) |
| No reference baseline claimed | Confirmed (run profile ≠ baseline) |
| No CKES-0001 artifact | Confirmed |
| Expected-result data cannot reach tested pipeline | Allowlist projection + evaluator table separation + tests |
| No machine-specific permanent links | Confirmed at authoring |
| Schemas/examples/docs indexed and validated | `npm run benchmark:validate` |

## EDF validation

**Executed:** 2026-09-19 — report [`reports/conformance/framework-advisor-20260919-120132.txt`](../../reports/conformance/framework-advisor-20260919-120132.txt)

| Metric | Score |
| --- | --- |
| Overall | 27% |
| Structure | 89% |
| Navigation | 0% |
| Governance | 0% |

Follow-up: breadcrumb navigation on new benchmark docs (same class of gaps as economical integration report).

## Validation commands

```bash
cd poc
npm run benchmark:test
npm run benchmark:validate
npm run benchmark:smoke
```
