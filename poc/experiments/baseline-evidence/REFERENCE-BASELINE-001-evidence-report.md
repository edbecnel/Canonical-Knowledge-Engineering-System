# Reference Baseline 001 — Evidence Report

[Home](../../../README.md) › [Project Index](../../../PROJECT_INDEX.md) › [Development](../../../docs/Development/README.md) › Baseline Evidence

> **Derived human-readable report** — does not modify immutable run-result JSON.
> **Manifest:** [REFERENCE-BASELINE-001-evidence-manifest.json](REFERENCE-BASELINE-001-evidence-manifest.json)
> **Designation:** `reference_baseline_001` → `RUN-REF-CLEAN-ANCHOR-002`
> **Closed:** Handover 03 Gate G6 (2026-09-19)

## Terminology

| Term | Meaning |
| --- | --- |
| **Anchor Suite** | Frozen benchmark **input** pack `CKES-BENCHMARK-ANCHOR-001` v1.0.0 |
| **Reference Baseline 001** | One **designated completed** clean Anchor run (`RUN-REF-CLEAN-ANCHOR-002`) |
| **Baseline evidence set** | Designated Anchor run + supporting Statistical/Challenge `-002` runs + linked artifacts |
| **Baseline anchors** | Fixed execution conditions (profile, scorer, isolation, revisions) |

Supporting Statistical and Challenge runs are **not** components of a composite baseline.

---

## A. Measurement validity

| Check | Anchor `-002` | Notes |
| --- | --- | --- |
| Frozen pack hash | `2d65a6cf…` | Unchanged since G3 |
| REF-CLEAN profile | `a69d5677…`, `dryRun: false` | |
| Scenarios executed | 40/40 | |
| Infrastructure errors | **0** | G4.1 remediation |
| `present_unmapped` | **0** | Pack-only corpus + evaluation mapping |
| Leakage / integrity | Passed at preflight | |
| Designation | `reference_baseline_001` sidecar | Points at immutable run JSON |

**Historical (invalid measurement, audit only):** `RUN-REF-CLEAN-ANCHOR-001` and other G4 `-001` runs — **not** in the valid baseline evidence set.

---

## B. CKES behavioral findings (POC benchmark — not production prevalence)

### Primary — Reference Baseline run `RUN-REF-CLEAN-ANCHOR-002`

| Metric | Value |
| --- | --- |
| False merges | **18** (**45.0%**; Wilson 95% CI **30.7%–60.2%**) |
| Must-not-match violations | **4** (`ANC-0018`, `ANC-0019`, `ANC-0020`, `ANC-0031`) |
| Critical false-merge scenario IDs | `ANC-0017`, `ANC-0018`, `ANC-0019`, `ANC-0020` |
| Missed match | **4** (10.0% of evaluated scenarios) |
| Unnecessary deferral | **1** (2.5%) |
| Pass / fail (incl. acceptable) | See immutable run aggregates |

### Supporting — `RUN-REF-CLEAN-STAT-002` (200 scenarios)

| Metric | Value |
| --- | --- |
| False merges | **59** (**29.5%**; CI **23.6%–36.2%**) |
| Must-not-match violations | 11 (see derived report) |
| High-severity false-merge IDs | `STA-0030`, `STA-0110`, `STA-0190` |
| Missed match | 26 (13.0%) |
| Unnecessary deferral | 8 (4.0%) |

### Supporting — `RUN-REF-CLEAN-CHALLENGE-002` (80 scenarios)

**Holdout:** `process_controlled_tuning_holdout` — **not** hidden, blind, or confidentiality-enforced.

| Metric | Value |
| --- | --- |
| False merges | **20** (**25.0%**; CI **16.8%–35.5%**) |
| Must-not-match violations | 6 |
| Critical false-merge IDs | `CHL-0012`, `CHL-0024`, `CHL-0048`, `CHL-0060`, `CHL-0072` |
| Missed match | 2 (2.5%) |
| Unnecessary deferral | **49** (**61.25%**) |

---

## C. Limitations

- Expectations generated via **deterministic G2 construction toolchain** — not independent real-world ground truth; epistemic status **not** upgraded at closeout.
- `deterministic_fixture` retrieval, `pg_trgm`, no vector index; deterministic adjudication path in POC.
- Challenge suite is a **process-controlled tuning holdout**, not a confidential blind set.
- Benchmark suites are deliberately constructed; results **do not** represent field prevalence.

---

## D. Architectural interpretation (non-normative)

Findings above are **empirical POC measurements** suitable as a **pre-improvement comparison point** for future CKES changes. They are **not**:

- ratified `CKES-0001` requirements;
- promotion of `CKES-PAR-*` provisionals;
- automatic acceptance of ADR hypotheses;
- claims of universal canonicalization behavior.

Improvement work (false-merge safety, deferral routing, corpus independence, stronger holdouts) remains **future authorized stages** — not part of this baseline.

---

## Immutable references

| Artifact | SHA-256 (file) |
| --- | --- |
| Designated run | `c5e690b260f5a061b24b59bb1cb5835adbf211d5ec418ea108af2b8f752ac573` |
| Statistical supporting | `46da0ab91b9fd5971f38121b0dc51de7622bd0d30c6afa979f677220e6ae0464` |
| Challenge supporting | `3b07c3a6d9477cf6be89bb38fd8ad687a3c37fcf5d38d3f236a7c689302f9f5a` |
| Evidence manifest | See `manifestSha256` in [manifest JSON](REFERENCE-BASELINE-001-evidence-manifest.json) |
