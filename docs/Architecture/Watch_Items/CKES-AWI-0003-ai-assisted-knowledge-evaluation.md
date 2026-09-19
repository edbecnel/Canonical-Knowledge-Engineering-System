# CKES-AWI-0003 — AI-Assisted Knowledge Evaluation

[Home](../../../README.md) › [Architecture](../README.md) › [Watch Items](README.md) › CKES-AWI-0003

> **Status:** Active
> **Owner:** Architecture Team
> **Classification:** CKES hypothesis under CRA AWI-0003

## Question

How can AI perform semantic work while canonical authority remains governed by explicit policy?

## CKES Experimental Approach

- Bounded AI semantic adjudication (top-N candidates only)
- Hybrid retrieval before expensive AI reasoning
- AI cost instrumentation per source item and corpus stage
- No direct AI mutation of canonical tables
- Prior adjudication reuse and batch assessment (see `CKES-PAR-0003`, `CKES-PAR-0008`; [AAR-0001](../Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md))

## Related Documents

- [CRA AWI-0003](https://github.com/edbecnel/Canonical-Representation-Architecture/blob/main/docs/Architecture/Watch_Items/AWI-0003-ai-assisted-knowledge-evaluation.md)
- [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md) — LLM assessment contract §9
