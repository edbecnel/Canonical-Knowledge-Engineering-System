# CKES Experimental Findings for CRA Review

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › CRA Findings Report

> **Status:** Draft
> **Owner:** Architecture Team
> **Classification:** Candidate CRA findings (experimental)
> **Last Reviewed:** 2026-08-22

## Purpose

Labeled findings from CKES POC experiments that may inform CRA specifications, watch item resolution, or adoption patterns.

## Classification Key

| Label | Meaning |
|-------|---------|
| CRA requirement | Established by CRA-0001–0003; CKES conformed |
| CKES hypothesis | Under test; not yet CRA |
| CKES implementation choice | Technology-specific; not architectural |
| CALS domain policy | Culinary-specific |
| Experimental result | Measured outcome |
| Candidate CRA principle | Proposed in [CRA Pragmatic Canonicality and Delegated Authority](https://github.com/edbecnel/Canonical-Representation-Architecture/blob/main/docs/Architecture/Discovery_Records/Pragmatic_Canonicality_and_Delegated_Authority.md) §17; under CRA evaluation via [AWI-0005](https://github.com/edbecnel/Canonical-Representation-Architecture/blob/main/docs/Architecture/Watch_Items/AWI-0005-delegated-authority-and-pragmatic-canonicalization.md) |
| Candidate CRA finding | May warrant formalization |

## Findings

### F-001: Source-Change Contract Pattern

**Classification:** Candidate CRA finding

Bounded `KnowledgeSourceChange` contract with `(source_system, source_object_id, source_revision, content_hash)` enables incremental processing without full repository re-analysis. Generalizes beyond Recipe Vault.

**Evidence:** POC adapter + change events table. See [Source Change Contract](../Architecture/Source_Change_Contract.md).

### F-002: AI Proposal / Policy / Commit Separation

**Classification:** CRA requirement (AWI-0003) + Experimental result

Pipeline enforces: AI adjudication → policy evaluation → staging → controlled commit. No code path from AI to canonical tables.

**Evidence:** `poc/packages/pipeline/src/runner.ts`, `commit.ts`

### F-003: Hybrid Retrieval Before AI

**Classification:** CKES hypothesis + Experimental result

Exact → normalized (pg_trgm) → full-text narrowing reduces candidate set before semantic adjudication. Deterministic mode achieves zero AI cost for seed corpus.

**Evidence:** `poc/packages/pipeline/src/retrieval.ts`

### F-004: Vectors as Derived Representations

**Classification:** CRA requirement (CRA-0003 RF-1–RF-7)

Embeddings stored in `ckes.embeddings` with model metadata. Not used for canonical identity. pgvector deferred; array storage sufficient for POC.

### F-005: Canonical Economy Measurement

**Classification:** CKES hypothesis (CKES-0000 §45)

Progressive experiment tracks `newConceptsPer1000`, `mappingRate`, `aiCostPerSourceItem` per corpus stage. Linear growth triggers policy investigation.

**Evidence:** `poc/scripts/run-progressive-experiment.ts`, `poc/packages/metrics/`

**Measured result (2026-08-18):** New concepts per 1,000 source items declined from 20.0 (seed) → 14.0 (poc1) → 1.6 (poc2) → 0.28 (poc3) across ~25,000 synthetic recipes with preserved canonical knowledge.

### F-006: Ground Truth Separation

**Classification:** CKES implementation choice

`synthetic.ground_truth` schema inaccessible to pipeline. Enables objective duplicate/novelty evaluation.

### F-007: Discovery / Resolution / Retrieval Layers

**Classification:** Candidate CRA finding (extends ADR-0003)

CKES operationalizes: change feed (discovery) → source adapter fetch (resolution) → hybrid retrieval (candidate narrowing) → adjudication.

### F-008: Cross-Authority Federation

**Classification:** Deferred (AWI-0004)

Out of POC scope. Single `ckes:cals` scope only.

## Recommended CRA Actions

1. Promote source-change contract to adoption guidance or ADR
2. Resolve AWI-0001 partial findings on candidate→canonical lifecycle
3. Add informative guidance on hybrid retrieval + bounded AI adjudication (AWI-0003)
4. Charter CRA-0004 (evidence promotion) informed by CKES evidence-only outcomes

## Related Documents

- [CKES Watch Items](../Architecture/Watch_Items/README.md)
- [Recipe Vault Change Proposals](Recipe_Vault_Change_Proposals.md)
- [POC Results](../../poc/experiments/results/)
