# Handover 03 G6 — Final Evidence and Governance Closeout Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G6 Report

> **Status:** Handover 03 **closed** (2026-09-19)
> **Owner:** Architecture Team
> **Applies To:** G6 evidence consolidation and governance reconciliation

## Declaration

**Handover 03 is fully closed.** Reference Baseline 001 is established. No CKES behavioral tuning was performed during G6.

---

## Reference Baseline designation

| Field | Value |
| --- | --- |
| Designation ID | `reference_baseline_001` |
| Designated run | `RUN-REF-CLEAN-ANCHOR-002` |
| Designation sidecar | `poc/experiments/reference-designations/reference_baseline_001.json` |
| Sidecar file SHA-256 | `0e085fefa4d1d59645fc82f4c480cf629ff9d2721e13c299a7a3e58ca4a967a2` |

---

## Evidence manifest

| Field | Value |
| --- | --- |
| Path | `poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-manifest.json` |
| `manifestSha256` | `67ff15095e9b8d1ee5fb22a99412b0407a3de8e19bea123ff5abef32ff55bae0` |
| Human report | `poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-report.md` |

---

## Immutable run paths / hashes

| Run | Role | SHA-256 |
| --- | --- | --- |
| `RUN-REF-CLEAN-ANCHOR-002` | **Reference Baseline** | `c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573` |
| `RUN-REF-CLEAN-STAT-002` | Supporting | `46da0ab91b9fd5971f38121b0dc51de7622bd0d30c6afa979f677220e6ae0464` |
| `RUN-REF-CLEAN-CHALLENGE-002` | Supporting | `3b07c3a6d9477cf6be89bb38fd8ad687a3c37fcf5d38d3f236a7c689302f9f5a` |

---

## Frozen pack hashes (unchanged)

| Pack | contentHash |
| --- | --- |
| CKES-BENCHMARK-ANCHOR-001 v1.0.0 | `2d65a6cf59c486ffba20c3571d69a918ac414f1d89d2641d25973f29e249a76c` |
| CKES-BENCHMARK-STATISTICAL-001 v1.0.0 | `5e5d0af0a409548ba0f889f8c0f4d5d96334d2c2412d746a8a535ff057dfcc18` |
| CKES-BENCHMARK-CHALLENGE-001 v1.0.0 | `00d339d3c33c09d6c2276ac9222c588d22c1a28d1510b2c310da8da40e954ecc` |

---

## Baseline anchors

| Anchor | Value |
| --- | --- |
| Profile | `CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001` / `a69d5677856931ab7617ef64eb0072e2fb1b52254952077035d0acbcc14586de` |
| Scorer | `1.0.0-g1` / `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| CKES git (at run) | `956c93f9e7b2e2a519fbc8a909667df9de8f454c` |
| Evaluation infra | `g4.1-baseline-validity-2026-09-19` |
| Schema | `1.0.0` |

---

## Baseline behavioral findings (preserved, not sanitized)

**Anchor designated run:** 18 false merges (45%); 4 must-not-match violations; critical FM `ANC-0017`–`ANC-0020`; 4 missed matches; 1 unnecessary deferral.

**Supporting:** Statistical 59 false merges (29.5%); Challenge 20 false merges (25.0%), 61.25% unnecessary deferral — see evidence report.

---

## AAR

Created: [AAR-0002-handover-03-reference-baseline-establishment.md](../Architecture/Audits/AAR-0002-handover-03-reference-baseline-establishment.md) (**Closed**).

---

## EDF Framework Advisor

| Item | Value |
| --- | --- |
| Command | `Engineering-Documentation-Framework/scripts/run_conformance_validation.sh` on repo root |
| Report (local, may be gitignored) | `reports/conformance/framework-advisor-20260919-173720.txt` |
| Summary (committed) | `poc/experiments/baseline-evidence/G6-EDF-FRAMEWORK-ADVISOR-SUMMARY.json` |
| Status | **Completed** (exit 0) |
| Overall | 27% |
| Structure | 89% |
| AI | 20% |
| Navigation | 0% |
| Governance | 0% |

Accepted for Handover 3 scope: documentation-tier scores; navigation/governance improvements remain deferred work items — **not** blockers for baseline discoverability (manifest + indexes updated).

---

## Immutability verification (G6)

`npm run benchmark:g6-closeout` — verified:

- Pack `contentHash` values match G3 manifest.
- Designated and supporting run file hashes match G5/G4.1 evidence.
- Designation sidecar unchanged.
- **No** modifications to frozen pack JSON, run-result JSON, or pipeline decision code during G6.

---

## Governance / documentation updates

- Development README — Handover 03 complete; G6 report linked.
- PROJECT_INDEX — Reference Baseline 001 pointer.
- `poc/experiments/baseline-evidence/README.md` — manifest + report.
- Architecture Audits README — AAR-0002 indexed.
- Handover 03 Implementation Plan — status note (G6 complete).

---

## Files changed (G6)

- `poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-manifest.json`
- `poc/experiments/baseline-evidence/REFERENCE-BASELINE-001-evidence-report.md`
- `poc/scripts/g6-finalize-evidence-manifest.ts`
- `docs/Architecture/Audits/AAR-0002-handover-03-reference-baseline-establishment.md`
- `docs/Architecture/Audits/README.md`
- `docs/Development/Handover_03_G6_Final_Evidence_and_Governance_Closeout_Report.md`
- `docs/Development/README.md`, `PROJECT_INDEX.md`, `poc/package.json`
- `poc/experiments/baseline-evidence/G6-EDF-FRAMEWORK-ADVISOR-SUMMARY.json`

## Git commit

Recorded after commit.

---

## Unresolved follow-up (not part of Handover 3)

- False-merge and must-not-match safety investigation / CKES improvement (new authorization).
- Deferral routing on Challenge suite.
- Independent benchmark corpus and reviewer workflows.
- Stronger holdout methodology evolution.
- EDF navigation/governance documentation scores.
- [AAR-0001](../Architecture/Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md) implementation gaps (vectors, batching, reuse).

---

## Confirmations

| Item | Status |
| --- | --- |
| CKES decision semantics unchanged in G6 | ✓ |
| Frozen packs / immutable runs unmodified | ✓ |
| G6 evidence manifest finalized | ✓ |
| Handover 03 closed | **Yes** |

**Do not begin post-baseline CKES improvement without new architect authorization.**
