# Handover 04 H4.3 — Debug-Assisted Forensic Investigation Report

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › H4.3 Report

> **Status:** Complete — **H4.4 / H4.O / remediation not authorized**
> **Gate:** H4.3
> **Generated:** 2026-09-19

## Confirmations

| Item | Status |
| --- | --- |
| CKES remediation (retrieval/adjudication/policy fixes) | **None** |
| Persistent observability / H4.O | **Not implemented** |
| Frozen RB001 `-002` evidence modified | **No** (hash verified) |
| H4.4 synthesis | **Not started** |

**Disposable tracing:** Class C trace logic lives only in [`h43-forensic-investigate.ts`](../../poc/scripts/h43-forensic-investigate.ts) (harness repro + `hybridRetrieve` / `adjudicateSemantic` / `evaluatePolicy` inspection). **No** changes to `@ckes/pipeline` production modules. Tracing is not persisted in harness output.

**Reproduction environment:** Live repro used local Postgres (`localhost:5432`) with REF-CLEAN profile; terminal outcomes matched immutable `RUN-REF-CLEAN-*-002` rows for all 22 investigated scenarios (`reproduced_rb001`).

---

## Investigation scope (22 scenarios)

| Batch | IDs |
| --- | --- |
| Tier 0 | ANC-0017, 0018, 0019, 0020, 0031 |
| P1 representatives | ANC-0023, 0024, 0027, 0029, 0035, 0040 |
| Controls / contrasts | ANC-0038, 0030, 0034, 0001, 0002 |
| Challenge deferral sample | CHL-0003, 0010, 0002, 0006 |
| Statistical cross-check | STA-0014, 0008 |

**Not Debugged (adaptive skip):** Remaining Anchor FMs and Statistical matrix rows — mechanism transfer documented via established deterministic branches.

Regenerate: `DATABASE_URL=… npm run benchmark:h43-investigate -- all` then `npm run benchmark:h43-closeout`.

---

## Causal summary table

Full machine-readable table: [`H43-CAUSAL-TABLE.json`](../../poc/experiments/forensics/h43/H43-CAUSAL-TABLE.json)

| Scenario / cluster | Reproduced? | First divergence | Root cause | Contributing | Downstream | Confidence | INV |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ANC-0017 (CL-FULL-PIPELINE) | Yes | adjudication | adjudication | retrieval exact; extraction strips to “Deep fry” | policy reuse; scorer FM | high | INV-ANC-0017 |
| ANC-0018–0020, 0031 (MNMT) | Yes | adjudication | adjudication | exact label match; MNMT not in projection | policy reuse; scorer MNMT | high | INV-* |
| ANC-0024, 0040 (EQUIV) | Yes | adjudication | adjudication | exact/fuzzy retrieval | policy reuse | high | INV-* |
| ANC-0023, 0027, 0029, 0035 (SUBSUMED) | Yes | adjudication | adjudication | score≥0.7 fuzzy match | policy reject (some); scorer FM | high | INV-* |
| ANC-0038, 0030, 0034 (controls) | Yes | retrieval (empty) | n/a pass | no primary match | DISTINCT / evaluate | high | INV-* |
| ANC-0001 vs 0002 | Yes | mixed | 0001: adjudication equiv; 0002: retrieval/adj DISTINCT | paraphrase vs miss | scorer pass/fail | med | INV-* |
| CHL defer sample | Yes | policy expectation | benchmark_policy_semantics_mismatch | DISTINCT 0.9 conf; no defer action | unnecessary_deferral | medium | INV-CHL-* |
| STA-0014, 0008 | Yes | adjudication | adjudication | same as Anchor clusters | scorer FM | high | INV-STA-* |

---

## Tier 0 findings

### ANC-0017 (full_pipeline)

- `sourceText` = `technique: Deep fry` (G4.1 projection).
- Extraction: regex technique match yields candidate **`Deep fry`** (not full phrase).
- Retrieval: **exact** match to seed `CK-CUL-01` / label `Deep fry`, score 1.0.
- Adjudication: **deterministic EQUIVALENT** (label equality).
- **First material divergence:** adjudication (retrieval rank #1 is correct for literal label identity; benchmark expects related_distinct).
- Policy is downstream (**reuse_existing**).

### MNMT quartet (0018, 0019, 0020, 0031)

| Q | Finding |
| --- | --- |
| A | Candidate representation is **label-only** (`GPIO pin`, `Sous vide`, etc.) — no encoded “must not merge” or related_distinct qualifier |
| B | Canonical seed **statement** exists in DB (`description`) but **deterministic adjudication does not use it** — only candidate text, top label, score in prompt path; deterministic path uses label/score only |
| C | Distinguishing semantics in seed statement **not consumed** before equivalence decision |
| D | Benchmark `related_distinct` + MNMT may require semantics **beyond** what candidate carries; MNMT itself is scorer-only |
| E | **Yes** — literal equality → `deterministic_equivalent` |
| F | **No negative-identity mechanism required** to explain failure — representation + deterministic equivalence suffice |

Triple 0018/0019/0020: same mechanism, different seeds/domains; separate INV records.

---

## Ordinary false-merge representatives

- **Contradiction (0023):** Retrieved `Blanch vegetables` with score 0.8 → **SUBSUMED** (not CONTRADICTS) — adjudication root, not policy.
- **Qualification (0024):** EQUIVALENT path (representative of CL-EQUIV).
- **Direction (0027 vs control 0038):** 0027 fuzzy match `Rest meat` / “Rest meat method”; 0038 **no matches** → DISTINCT pass — divergence at **retrieval presence**, then adjudication branch.
- **Compound (0029):** SUBSUMED pattern (same as 0027 family).
- **Scope (0035):** GPIO pin method → exact GPIO pin seed → EQUIVALENT (links MNMT family).

---

## Challenge deferral (4/8 sample)

All reproduced. Pattern: **no retrieval matches** → DISTINCT (0.9) → **evaluate_new_identity** (synthetic auto-admit path). Benchmark expects **`defer_human`** (policy defer/escalate). Scorer: **unnecessary_deferral**.

**Interpretation:** Not “over-conservative DISTINCT” — CKES is **confidently distinct** while benchmark expects **human deferral** without a merge. No in-suite passing `defer_human` control (H4.2 limitation confirmed).

---

## Statistical cross-check

`STA-0014` (adversarial FM): same **EQUIVALENT** exact-match mechanism as Anchor MNMT family.  
`STA-0008` (contradiction FM): **EQUIVALENT** exact match — same adjudication collapse class as Anchor contradiction case but via equiv not subsumed (label-dependent).

Remaining five H4.2 Stat samples: transfer inferred from shared transformation grid without additional Debug.

---

## Updated clusters

[`H43-UPDATED-CLUSTERS.json`](../../poc/experiments/forensics/h43/H43-UPDATED-CLUSTERS.json) — split H4.2 `CL-EQUIV-REUSE` vs `CL-SUBSUMED-REJECT` into established deterministic branches; add `CL-CHL-DEFER-EXPECTATION`.

---

## Documented defect (not fixed)

Deterministic adjudication in [`adjudication.ts`](../../poc/packages/pipeline/src/adjudication.ts): `score >= 0.95` or normalized **label equality** → `EQUIVALENT` without using seed statements, qualifiers, or benchmark relationship class. Materially explains majority of Anchor false merges under REF-CLEAN deterministic AI off.

---

## Observability / H4.O

| Gap | H4.3 resolution |
| --- | --- |
| Ranked retrieval in run JSON | Captured in INV `disposableTrace` via script |
| Adjudication branch | Inferred + `rationale` from live `adjudicateSemantic` |
| Persistent harness capture | **Not required** for investigated cases |

**H4.O requested?** **No** for completed H4.3 scope. Optional future H4.O if architect requires ranked lists in every official run artifact without disposable scripts.

---

## Artifacts

| Path | Role |
| --- | --- |
| `poc/experiments/forensics/h43/investigations/INV-*.json` | 22 investigation records |
| `poc/experiments/forensics/h43/repro-runs/H43-REPRO-*.json` | Harness repro outputs (non-baseline IDs) |
| `poc/experiments/forensics/h43/H43-*.json` | Summary, causal table, clusters, immutability |
| `poc/scripts/h43-forensic-investigate.ts` | Diagnostic runner |
| `poc/scripts/h43-generate-closeout.ts` | Aggregate INV → table |

---

## Git commit

Recorded after commit.

---

## STOP

**H4.4 not begun.** Await architect authorization.
