# AAR-0002: Handover 03 Reference Baseline Establishment

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Architecture](../README.md) › [Audits](README.md) › AAR-0002

## Document Metadata

| Field | Value |
| --- | --- |
| **Document Type** | Architectural Audit Record |
| **Normative** | No |
| **Audit ID** | AAR-0002 |
| **Audit Status** | Closed |
| **Scope** | Handover 03 gates G1–G6; Reference Baseline `reference_baseline_001`; benchmark evidence chain |
| **Audit Date** | 2026-09-19 |
| **Owner** | Architecture Team |

## Purpose

Record completion of Handover 03: benchmark qualification tooling, frozen official packs, official execution, measurement-validity remediation, designation of Reference Baseline 001, and G6 evidence consolidation — without promoting benchmark empirical results to normative CRA/CKES architecture.

## What Handover 03 set out to establish

- Authoritative JSON benchmark contracts and harness execution (building on Handover 1–2).
- Official Anchor, Statistical, and Challenge packs with provenance and freeze.
- Qualified scorer and immutable run-result evidence.
- A **single designated** Reference Baseline (`reference_baseline_001`) capturing pre-improvement CKES behavior under REF-CLEAN measurement.

## Gate history

| Gate | Outcome |
| --- | --- |
| G1 | Qualification/scoring/reporting tooling |
| G2 | Candidate packs generated/imported |
| G3 | Official pack freeze |
| G3.1 | Evaluation identity capture (`evaluationMatchedIdentityRef`) |
| G4 | First official matrix (`-001` runs) — **invalid measurement** preserved |
| G4.1 | Baseline validity remediation; superseding `-002` runs |
| G5 | Designation `reference_baseline_001` → `RUN-REF-CLEAN-ANCHOR-002` |
| G6 | Evidence manifest, AAR, documentation/EDF closeout |

## Significant architectural decisions

1. **Reference Baseline = one run**, not a suite composite; Statistical/Challenge are supporting evidence only.
2. **Measurement validity** separated from **semantic performance** — false merges are baseline findings, not designation blockers after G4.1.
3. **`RUN-REF-CLEAN-ANCHOR-001` not designated** — infra errors and `present_unmapped`; preserved as audit lineage.
4. **Designation via append-only sidecar** — run-result JSON never embeds designation.
5. **No normative promotion at G6** — no `CKES-0001`, no `CKES-PAR-*` ratification, no ADR status changes from benchmark scores.

## Deviations from anticipated path

- Anchor run ID `002` designated while label remains `reference_baseline_001` (intentional).
- G4.1 required harness projection (`sourceText`), corpus isolation, and full_pipeline fallback — evaluation/infrastructure only.
- Warm official runs not executed (deferred).

## Evidence supporting designation

- Manifest: `poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-manifest.json`
- Designation: `poc/experiments/reference-designations/reference_baseline_001.json`
- Immutable run: `poc/experiments/baseline-evidence/g4-1-official-runs/RUN-REF-CLEAN-ANCHOR-002.json` (SHA-256 in manifest)

## Known limitations

- POC retrieval/adjudication mocks and deterministic paths ([AAR-0001](AAR-0001-poc-vs-economical-canonicalization-direction.md) gaps remain).
- G2 deterministic expectation construction — not independent ground truth.
- Challenge holdout is process-controlled, not confidential blind evaluation.

## Unresolved risks / findings (empirical — not closed by baseline)

- Elevated false-merge rates on Anchor/Statistical/Challenge.
- Must-not-match violations on designated and supporting runs.
- High deferral rate on Challenge suite.
- See [REFERENCE-BASELINE-001-evidence-report.md](../../../poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-report.md) § B–D.

## Confirmation

Benchmark observations documented as **empirical findings** only. No silent promotion to normative architecture at G6.

## Related Documents

- [Handover 03 G6 Closeout Report](../../Development/Handover_03_G6_Final_Evidence_and_Governance_Closeout_Report.md)
- [Benchmark Evaluation Architecture](../Benchmark_Evaluation_Architecture.md)
- [AAR-0001](AAR-0001-poc-vs-economical-canonicalization-direction.md) (Open — implementation gaps vs economical direction)
