# AAR-0001: POC Reference Implementation vs Economical Canonicalization Direction

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Architecture](../README.md) › [Audits](README.md) › AAR-0001

## Document Metadata

| Field | Value |
|---|---|
| **Document Type** | Architectural Audit Record |
| **Normative** | No |
| **Audit ID** | AAR-0001 |
| **Audit Status** | Open |
| **Scope** | CKES POC (`poc/`) vs Proposed ADR-0003 direction and `CKES-PAR-*` provisional requirements |
| **Audit Date** | 2026-09-19 |
| **Owner** | Architecture Team |

## Purpose

Per [EDF AAR-0001](https://github.com/edbecnel/Engineering-Documentation-Framework/blob/main/docs/Specifications/AAR-0001-Architectural-Audit-Records.md), record whether the current POC implementation can validate the economical canonicalization architecture and whether introducing [ADR-0003](../ADRs/ADR-0003-economical-llm-canonicalization-cascade.md) and the foundational direction document is compatible with [ADR-0001](../ADRs/ADR-0001-ckes-adopts-edf-asr-bootstrap.md), the [Project Charter](../../../PROJECT_CHARTER.md), and CRA integration boundaries.

This audit is **not** deferred until `CKES-0001` exists: AAR-0001 evaluates **implementation vs declared direction and Accepted ADRs**, not vs ratified specifications.

## Requirements Basis

| Requirement | Link | Status | In scope |
|---|---|---|---|
| EDF ASR bootstrap; CKES-0001+ deferred | [ADR-0001](../ADRs/ADR-0001-ckes-adopts-edf-asr-bootstrap.md) | Accepted | Yes |
| Economical canonicalization direction | [ADR-0003](../ADRs/ADR-0003-economical-llm-canonicalization-cascade.md) | Accepted | Yes |
| Provisional requirements | [Economical LLM direction](../Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md) § CKES-PAR | Confirmed (pre-normative) | Yes |
| Charter POC-before-spec gate | [PROJECT_CHARTER](../../../PROJECT_CHARTER.md) | Approved | Yes |
| Reference implementation role | [Reference Implementation](../Reference_Implementation_Role_and_Domain_Independence.md) | Foundational direction | Yes |

## Implementation Scope

| Anchor | Value |
|---|---|
| Repository paths | `poc/packages/pipeline/`, `poc/packages/metrics/`, `poc/db/ckes/` |
| Branch / commit | Repository HEAD at audit date |
| Out of scope | Production CALS/TRV systems; normative `CKES-0001` (not created) |

## Findings

### Finding 1: ADR-0001 POC-before-specification preserved

| Field | Value |
|---|---|
| **Classification** | Conformant |
| **Requirement** | ADR-0001 |
| **Expected** | No `CKES-0001+` in `docs/Specifications/` until evidence gate |
| **Observed** | Integration created architectural direction and Proposed ADR-0003 only |
| **Evidence** | `docs/Specifications/README.md`; absence of `CKES-0001*.md` |
| **Remediation** | None |

### Finding 2: Discovery cascade incomplete in POC

| Field | Value |
|---|---|
| **Classification** | Gap |
| **Requirement** | CKES-PAR-0009, CKES-PAR-0010 |
| **Expected** | Layered discovery including vector retrieval; canonical store independent of vectors |
| **Observed** | `hybridRetrieve` uses exact + `pg_trgm` only; no vector index |
| **Evidence** | `poc/packages/pipeline/src/retrieval.ts` |
| **Remediation** | POC work item W-VEC (see integration report); matrix rows T-02, T-09 |

### Finding 3: Per-candidate LLM adjudication; no batching or reuse cache

| Field | Value |
|---|---|
| **Classification** | Gap |
| **Requirement** | CKES-PAR-0005, CKES-PAR-0008, CKES-PAR-0003 |
| **Expected** | Prior adjudication reuse; bounded batch assessment |
| **Observed** | `runner.ts` calls `adjudicateSemantic` per candidate; no adjudication store lookup |
| **Evidence** | `poc/packages/pipeline/src/runner.ts`, `adjudication.ts` |
| **Remediation** | POC work items W-BATCH, W-REUSE; matrix T-07, T-08 |

### Finding 4: Candidate lifecycle and identity separation minimal

| Field | Value |
|---|---|
| **Classification** | Gap |
| **Requirement** | CKES-PAR-0015, CKES-PAR-0027, CKES-PAR-0016 |
| **Expected** | Explicit states; separate source, candidate, and canonical identities |
| **Observed** | `candidates.status` largely `pending`; no distinct identity model in schema |
| **Evidence** | `poc/db/ckes/001_schema.sql`, `runner.ts` |
| **Remediation** | POC work item W-LIFECYCLE; matrix T-06, identity contract in direction doc |

### Finding 5: False-merge rollback not implemented

| Field | Value |
|---|---|
| **Classification** | Gap |
| **Requirement** | CKES-PAR-0031–CKES-PAR-0034 |
| **Expected** | Detect, remediate, preserve erroneous decision history |
| **Observed** | No rollback workflow in pipeline or schema |
| **Evidence** | `poc/packages/pipeline/` (no rollback module) |
| **Remediation** | POC work item W-ROLLBACK; matrix T-15 |

### Finding 6: Multi-domain evidence not yet produced

| Field | Value |
|---|---|
| **Classification** | Deferred |
| **Requirement** | Promotion gate (direction doc § Human promotion gate) |
| **Expected** | Evidence from ≥2 materially different domains before CKES-0001 |
| **Observed** | Corpus and adapters are culinary/recipe-centric |
| **Evidence** | `poc/packages/adapter/`, experiment manifests |
| **Remediation** | Add ELS-style fixtures; work item W-MULTI; AWI tracking |

### Finding 7: POC evidence program can validate architecture if work items execute

| Field | Value |
|---|---|
| **Classification** | Conformant (conditional) |
| **Requirement** | Direction doc POC baselines + matrix |
| **Expected** | Measurable baselines before claiming economic improvement |
| **Observed** | `@ckes/metrics` exists; baselines not yet recorded for new PAR set |
| **Evidence** | `poc/packages/metrics/`, `poc/experiments/results/` |
| **Remediation** | Execute baseline run per integration report § POC baselines |

### Finding 8: CRA semantics not redefined by direction doc

| Field | Value |
|---|---|
| **Classification** | Conformant |
| **Requirement** | Charter CRA-0001–0003 alignment; direction CRA mapping |
| **Expected** | CKES implements CRA; does not invent conflicting CRA normative semantics |
| **Observed** | CRA mapping distinguishes adopted vs proposed CRA artifacts |
| **Evidence** | Direction doc § CRA conformance baseline |
| **Remediation** | Update mapping when CRA-0004/0005 reach governed states |

## Summary

| Classification | Count |
|---|---|
| Conformant | 3 |
| Gap | 4 |
| Violation | 0 |
| Deferred | 1 |
| Out of scope | 0 |

## Remediation Tracker

- [ ] Close gaps via POC work items in [integration report](../../Development/Economical_Canonicalization_Handover_Integration_Report.md)
- [ ] Re-run audit as AAR-0002 when Proposed ADR-0003 becomes Accepted and major POC items land

## Parent

- [Architecture Audits](README.md)

## Related Documents

- [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md)
- [POC README](../../../poc/README.md)
