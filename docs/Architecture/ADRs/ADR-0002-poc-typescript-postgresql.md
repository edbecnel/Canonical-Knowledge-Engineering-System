# ADR-0002 — POC Uses TypeScript and PostgreSQL

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Architecture](../README.md) › [ADRs](README.md) › ADR-0002

> **Status:** Accepted
> **Date:** 2026-08-18
> **Owner:** Architecture Team
> **Classification:** CKES implementation choice

## Context

CKES requires an isolated, reproducible experimental environment with Recipe Vault-compatible source data. The Recipe Vault production stack uses TypeScript and PostgreSQL with Recipe JSON as the interchange contract. CRA is technology-independent; implementation choices must be labeled as such.

## Decision

The CKES proof-of-concept reference implementation in `poc/` SHALL use:

- **TypeScript** for pipeline, adapter, corpus, policy, and metrics packages
- **PostgreSQL** for isolated experimental database (Docker Compose)
- **OpenAI API** for AI knowledge discovery and semantic adjudication experiments

The POC is explicitly **non-normative** and isolated from `docs/Specifications/`.

## Consequences

### Positive

- Direct reuse of Recipe Vault type patterns and JSON schema validation
- Single-database hybrid retrieval (FTS, structured match, pgvector optional)
- Familiar tooling for Recipe Vault integration path

### Negative

- Implementation findings must be distinguished from CRA architectural requirements
- Python or other stacks would require separate adapter implementations for production

## Related Documents

- [POC README](../../../../poc/README.md)
- [Source Change Contract](../Source_Change_Contract.md)
