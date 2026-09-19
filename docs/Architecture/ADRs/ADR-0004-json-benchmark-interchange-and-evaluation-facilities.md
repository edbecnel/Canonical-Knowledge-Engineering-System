# ADR-0004 — JSON Benchmark Interchange and Three Evaluation Facilities

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Architecture](../README.md) › [ADRs](README.md) › ADR-0004

> **Status:** Proposed
> **Date:** 2026-09-19
> **Owner:** Architecture Team
> **Related ADRs:** [ADR-0001](ADR-0001-ckes-adopts-edf-asr-bootstrap.md), [ADR-0003](ADR-0003-economical-llm-canonicalization-cascade.md)

## Context

Handover 1 requires versioned JSON contracts for benchmark packs, run results, and run profiles; separation of corpus, reviewed, and exploratory evaluation; and structural prevention of expected-result leakage. YAML benchmark anchor fixtures compete with JSON authority.

[ADR-0001](ADR-0001-ckes-adopts-edf-asr-bootstrap.md) defers `CKES-0001+`. This ADR does not create normative specifications.

## Decision (proposed)

1. CKES POC **adopts JSON** as the authoritative interchange for benchmark definitions, run profiles, and run results (`poc/benchmark/schemas/`).
2. CKES defines **three evaluation facilities** (corpus, reviewed benchmark, exploratory) with non-combined metrics ([Benchmark Evaluation Architecture](../Benchmark_Evaluation_Architecture.md)).
3. Pack **content identity** uses RFC 8785 JCS + SHA-256 (`contentHash`), distinct from optional package attestation.
4. Pipeline inputs use **allowlist projection** (`@ckes/benchmark`); evaluator ground truth is stored outside pipeline query paths.
5. **Handover 1** does not implement a general benchmark runner; execution is deferred to Handover 2 `HarnessRunner`.

## Consequences

### Positive

- Comparable, versioned benchmark artifacts aligned with economical evidence program
- Clear leakage and facility boundaries

### Negative

- Migration effort from YAML baseline anchors to JSON run profiles
- Runner and reference baseline work remains in Handovers 2–3

## Acceptance

This ADR remains **Proposed** until explicit architectural acceptance. Implementation under Handover 1 does not imply acceptance.

## Related Documents

- [Benchmark Evaluation Architecture](../Benchmark_Evaluation_Architecture.md)
- [Handover 01 Integration Report](../../Development/Handover_01_Benchmark_Integration_Report.md)
