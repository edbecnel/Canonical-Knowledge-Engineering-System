# Handover 02 Benchmark Integration Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 02 Benchmark Integration Report

> **Status:** Maintained
> **Owner:** Architecture Team
> **Applies To:** 2026-09-19 Handover 2 (harness + Scenario Lab)
> **Last Reviewed:** 2026-09-19

## Permanent artifact

| From | To |
| --- | --- |
| `CKES_POC_Handover_02_Scenario_Harness_and_Lab.md` (repository root) | [CKES POC Handover 02 brief](CKES_POC_Handover_02_Scenario_Harness_and_Lab.md) (archived) |

## Package dependencies (locked)

- `@ckes/benchmark` — no dependency on harness, API, UI, or pipeline.
- `@ckes/harness` → `@ckes/benchmark`, `@ckes/pipeline`.
- `@ckes/scenario-lab-api` → `@ckes/harness` only.
- CLI → `@ckes/harness`.
- React UI → `@ckes/scenario-lab-contract` + API HTTP only.

## Isolation strategy (locked for Handover 2)

**Serial execution only** (`HARNESS_CONCURRENCY_MAX = 1`). **Not** transaction-only isolation.

Between each scenario: `TRUNCATE` of harness-selected `ckes.*` run tables (`ckes.staging_changes`, `ckes.canonicalization_decisions`, `ckes.candidates`, `ckes.canonical_commits`, `ckes.canonicalization_runs`, `ckes.metrics_snapshots`) plus `harness.isolation_log` entry.

Contamination tests: required in `harness:test` (browser projection); extend with DB integration when CI Postgres available.

## Reference designation

- Run-result JSON is **immutable** after write.
- Designations: `experiments/reference-designations/designations.jsonl` (append-only) + `reference-<runId>.json` snapshot.
- Labels: `smoke_reference`, `development_reference`, `harness_comparison_fixture`, `non_architectural_test_baseline` only.
- **No `REFERENCE-BASELINE-001`.**

## Scenario Lab API security

- Bind `127.0.0.1`; Host + Origin validation; `SameSite=strict` session cookie from `POST /session/bootstrap`.
- SSE uses `requireSession` (cookie or `Authorization` header) — **no** capability token in query strings.
- Tokens redacted from API error strings.

## Handover 2 boundary verification

| Check | Result |
| --- | --- |
| No production-sized Anchor/Statistical/Challenge suite | `CKES-SMOKE-HARNESS-001` only |
| No `REFERENCE-BASELINE-001` | Confirmed |
| No production TRV/CALS integration | Confirmed |
| No production auth/deploy | Local session cookie only |
| No vector/batch/reuse-cache/rollback | Confirmed |
| No CKES-0001 | Confirmed |
| CLI + UI → same harness | Confirmed |
| Expected data not in pipeline | `toPipelineInput` + browser projection |
| Smoke fixtures non-architectural | Pack description + metadata |

## Commands

```bash
cd poc
npm run harness:test
npm run benchmark:cli run --pack=CKES-SMOKE-HARNESS-001.json
npm run scenario-lab:api
npm run scenario-lab:dev
```
