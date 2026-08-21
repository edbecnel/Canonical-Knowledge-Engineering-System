# ADR-0001 — CKES Adopts EDF ASR Bootstrap with Core Profile

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Architecture](../README.md) › [ADRs](README.md) › ADR-0001

> **Status:** Accepted
> **Date:** 2026-08-18
> **Owner:** Architecture Team

## Context

CKES is an independent architectural research and prototyping program whose primary artifacts are specifications, experiments, and findings — not production application software. The Engineering Documentation Framework defines an Architecture Specification Repository (ASR) bootstrap path distinct from the software-engineering profile.

## Decision

CKES SHALL bootstrap as an EDF Architecture Specification Repository using `profile: core`, following the ASR Bootstrap Procedure. The founding discovery record (`CKES-0000.md`) SHALL be preserved at repository root as a non-normative historical artifact, mirroring the CRA precedent.

Normative `CKES-0001+` specifications in `docs/Specifications/` are deferred until POC experiments produce evidence.

## Consequences

### Positive

- Consistent engineering governance with CRA, CALS, and EDF sibling projects
- Clear separation between normative specs and experimental POC code
- Bootstrap tier conformance achievable without premature software-profile directories

### Negative

- Software-profile directories (`docs/API/`, `docs/Database/`) not created at bootstrap; POC documentation lives under `poc/`

## Related Documents

- [ASR Bootstrap Report](../../../ASR_BOOTSTRAP_REPORT.md)
- [CKES-0000](../../../CKES-0000.md)
