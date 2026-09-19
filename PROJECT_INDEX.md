# Project Index

[Home](README.md) › Project Index

> **Navigation hub:** Begin with the project [README](README.md), then use this index to locate authoritative documentation.

## Purpose

Primary documentation hub for humans and AI assistants working on CKES.

## Core Documents

- [Project Charter](PROJECT_CHARTER.md)
- [CKES-0000 — Founding Discovery Record](CKES-0000.md)
- [Architecture Decisions](ARCHITECTURE_DECISIONS.md)
- [ASR Bootstrap Report](ASR_BOOTSTRAP_REPORT.md)
- [Architecture](docs/Architecture/README.md)
- [Reference Implementation Role and Domain Independence](docs/Architecture/Reference_Implementation_Role_and_Domain_Independence.md) — foundational CKES architectural direction
- [Economical LLM-Assisted Canonicalization, Discovery, and Revalidation](docs/Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md) — cascade, `CKES-PAR-*` provisionals, validation matrix, promotion gate
- [Benchmark Evaluation Architecture](docs/Architecture/Benchmark_Evaluation_Architecture.md) — JSON benchmark contracts, three evaluation facilities (Handover 1)
- [Specifications](docs/Specifications/README.md)
- [Development](docs/Development/README.md)
- [Pragmatic Canonicalization Research and Validation](docs/Development/Pragmatic_Canonicalization_Research_and_Validation.md) — research direction and validation program
- [Governance](docs/Governance/README.md)
- [Reference](docs/Reference/README.md)
- [Templates](docs/Templates/README.md)

## Proof of Concept

- [POC README](poc/README.md) — experimental, non-normative reference implementation
- [Source Change Contract](docs/Architecture/Source_Change_Contract.md)
- [Recipe Vault Source Integration](docs/Architecture/Recipe_Vault_Source_Integration.md) — TRV capabilities and CKES adapter mapping
- [CALS Canonicalization Policy](poc/packages/policy/CALS_Culinary_Knowledge_Canonicalization_Policy.md)

## External References

| Project | Link |
|---------|------|
| CRA | [Canonical-Representation-Architecture](https://github.com/edbecnel/Canonical-Representation-Architecture) — see [Pragmatic Canonicality and Delegated Authority](https://github.com/edbecnel/Canonical-Representation-Architecture/blob/main/docs/Architecture/Discovery_Records/Pragmatic_Canonicality_and_Delegated_Authority.md) (third-wave CRA discovery; §17 candidate principles) |
| CALS | [Culinary-Arts-Learning-System](https://github.com/edbecnel/Culinary-Arts-Learning-System) |
| Recipe Vault | [TheRecipeVault](https://github.com/edbecnel/TheRecipeVault) |
| EDF | [Engineering-Documentation-Framework](https://github.com/edbecnel/Engineering-Documentation-Framework) |

## Current Priorities

1. Vertical slice: synthetic recipe → canonical commit with metrics
2. Seed corpus and evaluator ground-truth evaluation (`npm run benchmark:validate` in `poc/`)
3. Progressive POC-1/2/3 experiments with preserved knowledge
4. Document labeled findings for CRA and Recipe Vault review

## AI Context

AI assistants should begin here, follow links to authoritative documents, classify outputs (CRA requirement / CKES hypothesis / experimental result), and avoid inventing project facts.

## Last Reviewed

2026-09-19
