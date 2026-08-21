# Project Charter

[Home](README.md) › [Project Index](PROJECT_INDEX.md) › Project Charter

> **Status:** Approved
> **Owner:** Architecture Team
> **Applies To:** Canonical Knowledge Engineering System
> **Last Reviewed:** 2026-08-18
> **Review Frequency:** Annual

## Mission

Determine how CRA-adopting systems can acquire, organize, evaluate, canonicalize, retrieve, govern, evolve, and maintain canonical knowledge automatically, economically, and at scale — through reproducible experimentation rather than premature architectural certainty.

## Goals

- Implement and measure candidate canonicalization mechanisms aligned with CRA-0001–0003
- Produce experimental evidence on unresolved CRA watch items (AWI-0001–0003)
- Develop a CALS-targeted proof of concept using Recipe Vault-compatible source data
- Establish reproducible synthetic corpus methodology with hidden ground truth
- Measure canonical growth and AI cost maturity hypotheses
- Feed labeled findings back to CRA and related projects

## Non-Goals

- Becoming a CALS subproject or embedding culinary semantics in generic machinery
- Tightly coupling to Recipe Vault database implementation
- Treating synthetic POC data as authoritative production knowledge
- Prematurely normative CKES specifications before experimental evidence exists
- Resolving all CRA architectural questions without measurement

## Scope

### In Scope

- EDF-governed ASR repository structure and documentation
- Non-canonical POC reference implementation (`poc/`)
- Recipe Vault adapter and source-change contract
- Synthetic corpus generation, lifecycle simulation, and evaluation
- CALS Culinary Knowledge Canonicalization Policy (experimental)
- Instrumentation, metrics, and progressive corpus experiments

### Out of Scope

- Production CALS knowledge corpus governance
- Production Recipe Vault modifications (proposals only until validated)
- Cross-authority federation (AWI-0004 deferred)
- Multi-domain validation beyond CALS (ELS/EGLS — future phase)

## Stakeholders

| Role | Responsibility |
|------|----------------|
| Architecture Team | CKES program direction, CRA alignment |
| CALS project | Domain policy ownership, knowledge semantics |
| Recipe Vault project | Source schema, incremental change feed requirements |
| CRA program | Normative architectural specifications |

## Constraints

- Must adopt EDF ASR bootstrap with `profile: core`
- Must conform to CRA-0001–0003 at architectural level
- AI must not directly alter canonical state
- Vectors are derived representations, never canonical identity
- POC database isolated from production Recipe Vault and CALS data

## Related Documents

- [Project Index](PROJECT_INDEX.md)
- [CKES-0000](CKES-0000.md)
- [Architecture](docs/Architecture/README.md)
- [POC README](poc/README.md)
- [ASR Bootstrap Report](ASR_BOOTSTRAP_REPORT.md)
