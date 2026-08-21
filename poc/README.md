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

## Related Documents

- [Source Change Contract](../docs/Architecture/Source_Change_Contract.md)
- [ADR-0002](../docs/Architecture/ADRs/ADR-0002-poc-typescript-postgresql.md)
