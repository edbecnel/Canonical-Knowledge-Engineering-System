# ADR-0003 — Economical LLM-Assisted Canonicalization, Discovery, and Revalidation

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Architecture](../README.md) › [ADRs](README.md) › ADR-0003

> **Status:** Proposed
> **Date:** 2026-09-19
> **Owner:** Architecture Team
> **Supersedes:** None
> **Related ADRs:** [ADR-0001](ADR-0001-ckes-adopts-edf-asr-bootstrap.md) (remains authoritative on CKES-0001 deferral)

## Context

CKES must canonicalize large volumes of candidate knowledge without treating every candidate as a separate LLM inference problem. An architectural handover (integrated 2026-09-19) defines an economical cascade: reuse cheap discovery mechanisms first, persist governed adjudication outcomes, batch or piggyback LLM work where justified, and revalidate canonical understanding when evidence warrants the cost.

[ADR-0001](ADR-0001-ckes-adopts-edf-asr-bootstrap.md) defers normative `CKES-0001+` specifications until POC experiments produce evidence. This ADR records **direction** and points to **pre-normative** `CKES-PAR-*` requirements in the architectural direction document. Planning and documenting this architecture does **not** ratify every provisional requirement or implementation hypothesis.

## Decision

1. CKES **proposes** to adopt the economical LLM-assisted canonicalization, discovery, and revalidation architecture documented in [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md).
2. Traceable requirements for this architecture SHALL remain **provisional** (`CKES-PAR-*`) in that document until the human promotion gate defined therein is satisfied and [ADR-0001](ADR-0001-ckes-adopts-edf-asr-bootstrap.md)’s specification gate is met.
3. CKES SHALL **not** create `CKES-0001` or begin the numbered normative specification series as part of this decision.
4. The POC SHALL prioritize evidence collection aligned with the direction document’s validation matrix and POC evidence program (matching accuracy, false merges, escalation, LLM-cost reduction, prior-decision reuse, batching, vector-index rebuild, revalidation, multi-domain applicability).

## Consequences

### Positive

- Single coherent architectural direction with testable provisional requirements
- Preserves ADR-0001 POC-before-specification gate
- Clear separation between CRA semantics and CKES implementation choices

### Negative

- POC implementation gaps remain until traceable work items are executed ([AAR-0001](../Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md))
- Architect acceptance of this ADR is required before **Accepted** status

## Related Documents

- [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md)
- [Economical Canonicalization Handover Integration Report](../../Development/Economical_Canonicalization_Handover_Integration_Report.md)
- [Reference Implementation Role and Domain Independence](../Reference_Implementation_Role_and_Domain_Independence.md)
- [Pragmatic Canonicalization Research and Validation](../../Development/Pragmatic_Canonicalization_Research_and_Validation.md)
