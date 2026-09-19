# Cost Optimization for CKES AI Operations

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [AI](README.md) › Cost Optimization

> **Status:** Draft
> **Owner:** Architecture Team
> **Applies To:** CKES canonicalization, POC instrumentation, future production AI usage
> **Classification:** CKES AI engineering guidance (non-normative; aligns with architectural direction)
> **Last Reviewed:** 2026-09-19

## Purpose

Explain how CKES should control LLM and embedding costs **without** treating economic efficiency as permission to weaken canonical integrity, provenance, or authorization boundaries.

This document is **authoritative for AI cost philosophy within CKES** at draft tier. Ratified numeric policies belong in future `CKES-0001` after the [human promotion gate](../Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md#13-human-promotion-gate-for-ckes-0001).

## Relationship to architectural direction

Economic canonicalization is defined in [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md):

- **Cascade first:** exact, structural, lexical/NLP, vector, relationship checks before LLM (`CKES-PAR-0005`).
- **Amortize reasoning:** persist governed adjudications for reuse (`CKES-PAR-0003`); never confuse assessment records with canonical truth (`CKES-PAR-0004`).
- **Batch and piggyback** only when isolation, provenance, tenancy, and attribution remain intact (`CKES-PAR-0007`, `CKES-PAR-0008`, `CKES-PAR-0024`).
- **Vectors are disposable indexes**; deleting them must not threaten canonical data (`CKES-PAR-0010`).

Provisional requirements use `CKES-PAR-*` identifiers; they are **not** ratified specification requirements.

## Principles

1. **Pay for judgment once.** Equivalent semantic conclusions should reuse stored governed decisions when policy allows.
2. **Escalate on evidence, not on default.** LLM calls are for novelty, ambiguity, contradiction, high impact, or explicit user value—not routine duplicates.
3. **Measure before claiming improvement.** Record baselines (candidates per source, LLM calls per candidate, tokens, USD, false-merge rate) before asserting maturity-driven cost decline (direction doc §12).
4. **Conservative auto-linking is cheaper than rollback.** False merges dominate long-run cost and risk (`CKES-PAR-0006`, `CKES-PAR-0031`–`0035`).
5. **Tenancy beats batch economics.** Never combine candidates across unauthorized boundaries to save tokens (`CKES-PAR-0024`).

## POC instrumentation

The experimental pipeline records per-run AI usage via `@ckes/metrics` and `canonicalization_decisions` (tokens, cost USD, `usedAi`). Extend instrumentation as POC work items land ([integration report](../Development/Economical_Canonicalization_Handover_Integration_Report.md)).

## Model and provider selection

POC defaults to economical models with deterministic fallback when no API key is set (`poc/README.md`). Production choices remain domain- and policy-driven; log `model_provenance` on each assessment (LLM contract §9 of direction doc).

## When not to optimize

- Food safety, high-voltage, or other high-tier policy domains may **require** human or higher-rigor paths regardless of cheap LLM confidence ([CALS policy](../../poc/packages/policy/CALS_Culinary_Knowledge_Canonicalization_Policy.md)).
- Budget exhaustion must **degrade gracefully** (queue, defer) without corrupting canonical state (`CKES-PAR-0025`).

## Related Documents

- [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md)
- [Pragmatic Canonicalization Research and Validation](../Development/Pragmatic_Canonicalization_Research_and_Validation.md)
- [CKES-AWI-0003](../Architecture/Watch_Items/CKES-AWI-0003-ai-assisted-knowledge-evaluation.md)
- [AI README](README.md)
