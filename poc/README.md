# CKES Proof of Concept

> **Status:** Experimental — **not normative**
> **Classification:** CKES implementation choice

Non-canonical reference implementation for CKES canonicalization experiments. Findings may inform future `CKES-0001+` specifications but do not constitute CRA requirements.

## Stack

- TypeScript (npm workspaces)
- PostgreSQL 16 (Docker Compose)
- OpenAI API (optional — deterministic fallback when `OPENAI_API_KEY` unset)

## Recipe Vault Compatibility

POC reuses Recipe Vault JSON shape and a compatible PostgreSQL subset. Schema provenance documented in `db/recipe-vault/README.md`. Production Recipe Vault types are not vendored; POC defines a minimal compatible contract in `packages/adapter/src/types.ts`.

## Quick Start

```bash
cd poc
cp .env.example .env
docker compose -f db/docker-compose.yml up -d
npm install
npm run db:migrate
npm run bootstrap:knowledge
npm run corpus:seed
npm run pipeline:run -- --stage seed
npm run experiment:progressive
```

## Packages

| Package | Purpose |
|---------|---------|
| `@ckes/adapter` | Source adapter, change contract |
| `@ckes/pipeline` | Canonicalization pipeline |
| `@ckes/corpus` | Synthetic generation, ground truth, lifecycle |
| `@ckes/policy` | CALS policy engine |
| `@ckes/metrics` | Instrumentation and reports |

## Target architecture (direction vs current)

Authoritative direction: [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../docs/Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md) (`CKES-PAR-*` provisionals). [AAR-0001](../docs/Architecture/Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md) records gaps.

| Capability | Direction | POC today |
|------------|-----------|-----------|
| Discovery cascade | Exact → lexical/NLP → vector → compatibility | Exact + `pg_trgm` in `hybridRetrieve` |
| LLM adjudication | Escalation-gated; batch/reuse | Per-candidate `adjudicateSemantic` |
| Prior decision reuse | Adjudication store | Not implemented |
| Vector indexes | Derived, rebuildable | Not implemented |
| Candidate lifecycle | Explicit states; identity layers | `pending` candidates only |
| False-merge rollback | PAR-0031–0035 | Not implemented |
| Multi-domain evidence | Required for CKES-0001 promotion | Culinary/recipe-centric |

This documentation pass does **not** implement deferred features; see work items below.

## POC evidence program

Record **baselines** before claiming improved economics (direction doc §12): corpus mix, candidates per source, LLM calls per candidate, tokens/USD, matching accuracy, false-merge and missed-match methods, latency, human review effort, comparable runs at fixed policy version and commit.

**Collect evidence for:** matching accuracy; false merges; escalation; LLM-cost reduction; prior-decision reuse; batching; vector-index rebuild; revalidation; multi-domain applicability (W-MULTI).

## Traceable work items

Linked to [integration report](../docs/Development/Economical_Canonicalization_Handover_Integration_Report.md#poc-work-items-deferred-implementation): W-VEC, W-BATCH, W-REUSE, W-LIFECYCLE, W-REVAL, W-ROLLBACK, W-MULTI — each maps to `CKES-PAR-*` and validation matrix rows T-01–T-16.

## Related Documents

- [Reference Implementation Role and Domain Independence](../docs/Architecture/Reference_Implementation_Role_and_Domain_Independence.md)
- [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](../docs/Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md)
- [Source Change Contract](../docs/Architecture/Source_Change_Contract.md)
- [ADR-0002](../docs/Architecture/ADRs/ADR-0002-poc-typescript-postgresql.md)
- [ADR-0003](../docs/Architecture/ADRs/ADR-0003-economical-llm-canonicalization-cascade.md) (Accepted)
