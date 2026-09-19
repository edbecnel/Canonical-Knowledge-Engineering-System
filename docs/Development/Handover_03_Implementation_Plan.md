# Handover 03 Implementation Plan — Benchmark Generation and Reference Baseline

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 Implementation Plan

> **Status:** Approved — **G1 implemented** (awaiting G1 report review; G2–G6 not authorized)
> **Owner:** Architecture Team
> **Applies To:** CKES POC Handover 3 of 3
> **Last Reviewed:** 2026-09-19
> **Source brief:** [CKES POC Handover 03](CKES_POC_Handover_03_Benchmark_Generation_and_Reference_Baseline.md)

## Build gate

**Do not implement or execute scored baseline runs** until this plan has been externally reviewed, amended, architect-approved, and Cursor has been explicitly authorized to build.

Handover 2 is complete (`66685a9` on `main`): harness, CLI, Scenario Lab, smoke pack, sidecar reference designations, serial TRUNCATE isolation, and package boundaries are in place.

## Purpose

One integrated program for **qualification → import → freeze → execute → designate Reference Baseline 001 → report evidence**. The architect does not manually author the full scenario corpus. Externally generated JSON packs conform to Handover 1 schema `1.0.0`; Cursor must not silently change expected outcomes. Schema or semantic defects are reported for correction, not patched in-repo without a new pack version.

This stage produces **POC evidence** for future human promotion decisions. It does **not** create `CKES-0001` or ratify `CKES-PAR-*` requirements.

## Terminology (locked)

| Term | Handover 3 usage |
| --- | --- |
| Anchor / Statistical / Challenge **suites** | Versioned **pack** releases (`suiteClass` in JSON) |
| **Reference Baseline 001** | One **designated completed benchmark run** (immutable run-result + sidecar designation), not a suite |
| **Baseline anchors** | Fixed run conditions in a **run profile** (git commit, models, DB profile, isolation, trials) — not synonymous with Anchor Suite |
| **Run profile** | `benchmark-run-profile.schema.json` artifact; records reproducibility anchors |
| H2 comparison labels | `smoke_reference`, `development_reference`, etc. — **not** official baseline |

## Outcomes

1. Three suite-class releases (schema-valid, qualified, frozen, hashed, Markdown-derived).
2. Multi-domain coverage (culinary/TRV/CALS **and** a materially different domain, e.g. electronics/ELS).
3. Reference Baseline 001 captured under recorded clean (and warm where implemented) profiles.
4. Metrics report with explicit limitations and invalid claims ruled out.
5. Governance artifacts updated with exact pack/run hashes and AAR/matrix traceability.

## Target releases and POC sizing

Final `packId` values must match schema and repository conventions. Planned identifiers:

| Release | `packId` (target) | `suiteClass` | Nominal size | POC phase 1 (if cost/maturity requires) |
| --- | --- | --- | --- | --- |
| Anchor | `CKES-BENCHMARK-ANCHOR-001` | `anchor` | 50–100 | **Minimum 40** released scenarios after qualification |
| Statistical | `CKES-BENCHMARK-STATISTICAL-001` | `statistical` | 500–2,000 | **Minimum 200** with stratified sampling plan documented |
| Challenge | `CKES-BENCHMARK-CHALLENGE-001` | `challenge` | 100–500 | **Minimum 80** with holdout subset called out |

**Statistical claims at reduced size:**

| Claim | Justified at POC minimum | Not justified at POC minimum |
| --- | --- | --- |
| Directional safety (false-merge rate on high-severity strata) | Yes, with wide confidence intervals | Sub-percent point precision |
| Regression detection vs Reference Baseline 001 on **same frozen pack hash** | Yes for large deltas | Detecting small effect sizes |
| Domain-general prevalence | No | Any real-world frequency inference |
| Challenge “unseen” performance | Only on **documented holdout** never used for tuning | Reporting tuned-on challenge as unseen |

Phase 1 may ship smaller packs as `packVersion` `1.0.0` with explicit `description` and integration-report limits; corrections require **new pack version** and new hash, never in-place edits after freeze.

## Repository layout (proposed)

```
poc/benchmark/
  releases/
    anchor/CKES-BENCHMARK-ANCHOR-001.json
    anchor/CKES-BENCHMARK-ANCHOR-001.md          # derived, committed
    statistical/CKES-BENCHMARK-STATISTICAL-001.json
    statistical/CKES-BENCHMARK-STATISTICAL-001.md
    challenge/CKES-BENCHMARK-CHALLENGE-001.json
    challenge/CKES-BENCHMARK-CHALLENGE-001.md
  generation/                                     # provenance only (not pipeline input)
    README.md
    <packId>/provenance.json                      # tool, prompt versions, taxonomy coverage
    <packId>/review-log.jsonl                     # AI/human review events
  fixtures/                                       # existing smoke (unchanged role)
experiments/
  run-profiles/
    CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001.json
    CKES-BENCHMARK-RUN-PROFILE-REF-WARM-001.json
  runs/                                           # immutable run results (existing)
  reference-designations/                         # append-only (existing)
  baseline-evidence/
    REFERENCE-BASELINE-001-manifest.json          # pointers: run ids, hashes, profiles, packs
docs/Development/
  Handover_03_Benchmark_Integration_Report.md     # created at build closeout
```

`npm run benchmark:validate` will be extended to validate `benchmark/releases/**` and verify committed `.md` matches renderer output.

## External generation workflow

The architect does **not** label every case. Generation happens **outside** the tested pipeline:

1. **Seed authoring** — Fictitious culinary/TRV-aligned and ELS (or equivalent) canonical seed material; stored in pack `canonicalSeedMaterial` or versioned external seed artifact with `canonicalSeedRef` (hash mismatch → `fail`).
2. **Synthetic scenario construction** — Declared `transformationType` per scenario (taxonomy below); `labelConfidenceClass` per Handover 1 enums.
3. **Export** — Single JSON per pack; no expected fields in `sourceText` or candidate payloads destined for `toPipelineInput()`.
4. **Delivery** — PR or secure drop into `poc/benchmark/releases/` only after qualification gates pass locally.

**Taxonomy coverage** (pack-level checklist in `generation/<packId>/provenance.json`):

- paraphrase_same_identity
- terminology_substitution_same_identity
- narrow_applicability / broaden_applicability
- change_subject_object_context
- objective_to_method / method_to_objective
- supporting_observation
- contradiction
- qualification
- related_distinct
- compound_assertion
- genuinely_novel
- irrelevant_near_neighbor
- adversarial_false_merge_candidate
- emerging_process_revalidation

Provenance and transformation metadata live in pack scenario fields (`transformationType`, `expectedRationale`, review flags) and generation sidecars — **never** passed through `toPipelineInput()` or browser projection allowlists.

**Model-in-the-loop labeling:** Prefer construction-derived expectations (`deterministic_by_construction`). AI labels use `strong_expectation`, `acceptable_result_set`, or `expected_deferral` as appropriate. Where practical, **independent model/prompt family** reviews labels used in scoring strata (document reviewer model in `review-log.jsonl`).

## Domain coverage

Mandatory domains in the **combined** Anchor + Statistical + Challenge program:

| Domain bucket | Examples | Minimum anchor scenarios |
| --- | --- | --- |
| Culinary / TRV / CALS-aligned | Techniques, ingredients, process steps | ≥ 40% of anchor pack |
| Structured engineering (ELS) | Components, signals, constraints | ≥ 25% of anchor pack |
| Cross-domain collision (optional) | Shared terms with different meaning | ≥ 5 scenarios if present |

Evidence from culinary-only subsets must **not** be promoted as full POC conclusions.

## Qualification pipeline

Automated and human gates before `pack.status = released`:

### A. Automated (CI + local)

| Step | Tool / location | Fail action |
| --- | --- | --- |
| JSON Schema | `npm run benchmark:validate` + AJV on releases | Block import |
| Content hash | `@ckes/benchmark` JCS SHA-256 recompute | Block freeze |
| Duplicate `scenarioId` | Qualification script | Block |
| Contradictory expectations (same seed + incompatible classes) | Qualification script | Block or flag `disputed` |
| Transformation ↔ expectation consistency | Rule table by `transformationType` | Block release for deterministic cases |
| `mustNotMatchIdentities` on false-merge cases | Schema + lint | Required on high-severity merge traps |
| Leakage scan | Assert no forbidden keys in serialized pipeline input per scenario | Block |
| Markdown drift | Regenerate `.md`; diff must be empty | Block commit |

New script: `npm run benchmark:qualify -- --pack=<releases/...json>` (plan: implement at build time).

### B. AI-assisted review

- Stratified sample (e.g. 10% per domain, 100% of `failureSeverity: critical|high`).
- Output: `generation/<packId>/review-log.jsonl` with `reviewer`, `scenarioId`, `verdict`, `notes`.
- Disputed labels → `scenario.status = reviewed` with `labelConfidenceClass: human_review_required` until resolved; unresolved cases excluded from **official** denominators.

### C. Human spot review

- Mandatory sign-off on all high-severity and adversarial false-merge scenarios.
- Pack-level `humanReviewStatus` on `pack` metadata when released.

### D. Review status matrix

| Level | `draft` | `reviewed` | `released` | `retired` |
| --- | --- | --- | --- | --- |
| Pack | Generation in progress | Qualification passed except human sign-off | Frozen hash; scored runs allowed | Historical only |
| Scenario | Not scored | Qualification / dispute | In official denominators | Excluded |

## Freeze and version

Once qualified:

1. Set `pack.status` to `released`; bump `packVersion` semver for any content change.
2. Recompute and commit `contentHash` and `canonicalSeedHash`.
3. Run deterministic Markdown render; commit sibling `.md`.
4. Record in pack metadata: `compatibleHarnessVersions`, schema `1.0.0`, harness git tag or commit range.
5. **Prohibit mutation** of frozen JSON during scored runs (CI: hash check before harness start).
6. Corrections → new `packVersion`, new files, retirement of prior version optional.

## Execution plan (Reference Baseline capture)

Use existing `@ckes/harness` with Handover 2 isolation (**concurrency = 1**, TRUNCATE between scenarios). Extend CLI/API only as needed for profiles below.

### Run profiles (new artifacts)

**`CKES-BENCHMARK-RUN-PROFILE-REF-CLEAN-001`**

- `databaseProfile`: `clean`
- `retrievalMode`: `deterministic_fixture` (anchor/statistical primary); document if any scenario requires `live`
- `deterministicAi`: recorded boolean + env snapshot
- `gitCommit`, `node` version, `DATABASE_URL` host fingerprint (not secret)
- `isolation`: `truncate_between_scenarios`
- `trials`: `1` default; LLM-required scenarios: `trials: 3` if budget allows (record actual count per scenario in run result)

**`CKES-BENCHMARK-RUN-PROFILE-REF-WARM-001`**

- Same as clean except `databaseProfile`: `warm`
- **Prerequisite:** Implement warm seeding per pack `executionRequirements` (versioned prior decisions injected after reset policy — document exact mechanism in integration report). If warm orchestration is incomplete at build time, run warm profile **only for scenarios explicitly marked warm-compatible** and disclose non-comparable clean-only baseline.

### Run matrix

| Run ID (convention) | Packs executed | Profile | Purpose |
| --- | --- | --- | --- |
| `RUN-REF-CLEAN-ANCHOR-001` | Anchor only | REF-CLEAN | Primary interpretable baseline |
| `RUN-REF-CLEAN-STAT-001` | Statistical (sample or full per POC size) | REF-CLEAN | Volume metrics |
| `RUN-REF-CLEAN-CHALLENGE-001` | Challenge (exclude holdout if designated) | REF-CLEAN | Boundary behavior |
| `RUN-REF-WARM-ANCHOR-001` | Anchor subset or full | REF-WARM | Prior-decision reuse (if implemented) |

**Reference Baseline 001 designation:** After a **completed** clean anchor run (or architect-selected composite — default: single clean anchor run that is the official comparison point), append sidecar designation:

- Extend `ReferenceDesignationLabel` with `reference_baseline_001` (official Handover 3 label only).
- Event in `designations.jsonl` + `reference-<runId>.json`; **never** embed designation into run-result JSON.
- `experiments/baseline-evidence/REFERENCE-BASELINE-001-manifest.json` lists: designated `runId`, `runResultHash`, pack ids/versions/hashes, profile ids, timestamps, `designatedBy`, limitations.

Statistical and challenge runs support evidence but are not automatically “the” baseline unless architect designates separately (default: one anchor clean run = Reference Baseline 001).

### Pre-baseline POC inventory

Document in integration report **before** economical mechanisms land:

- Which ADR-0003 cascade stages exist vs mocked
- LLM call paths, batching, reuse cache, rollback — implemented or stubbed
- Known mocks in retrieval/adjudication/policy

## Metrics and reporting

### Scoring extensions (build phase)

Current `@ckes/benchmark` `scoreScenario` is minimal. Extend with:

- `acceptable_result_set` and `acceptableAlternatives` handling
- `qualify_existing`, `contradict_existing`, `revalidation_candidate`, `propose_new_identity`
- Stratified aggregates: domain, `labelConfidenceClass`, `transformationType`, `failureSeverity`, execution mode
- Infrastructure failures separate from decision failures (`failureLayer` already in run-result schema)

### Required report sections (`Handover_03_Benchmark_Integration_Report.md`)

| Metric family | Examples |
| --- | --- |
| Accuracy | same-identity, related-distinct, novel-candidate |
| Safety | false-merge rate, missed-match rate |
| Routing | correct-deferral rate, unnecessary deferral |
| Semantics | applicability, objective/method, contradiction/revalidation |
| Economics | LLM calls, tokens, cost, latency (per run + per scenario class) |
| Reuse | warm-profile prior-decision hits (if implemented) |
| Operations | human-review demand proxy, infrastructure failure rate |
| Stability | trial variance on LLM scenarios |

**Rule:** Do not claim improvement from pass rate alone if false merges, cost, or instability worsen.

Deliverables:

- `npm run benchmark:report -- --run=<path>` → JSON summary + optional Markdown
- Committed summary under `experiments/baseline-evidence/`

## Comparative experiment protocol (documented)

For post-baseline CKES changes:

1. Identical frozen pack `contentHash`(es).
2. Record changed components (git diff scope, model IDs, config).
3. Comparable clean/warm profiles.
4. Quantify accuracy, safety, cost, latency, stability deltas vs Reference Baseline 001 manifest.
5. Investigate all new high-severity failures.
6. Disclose non-comparable conditions (profile, pack version, mock boundaries).
7. **No tuning on hidden challenge holdout** then reporting as unseen — maintain documented holdout list in `generation/CKES-BENCHMARK-CHALLENGE-001/holdout-scenario-ids.json` (IDs only; expectations remain in frozen pack for execution but excluded from tuning feedback loops by process).

`compareRunCompatibility` already blocks pack hash and profile mismatches; surface in CLI report.

## Data quality and security

- Fictitious / approved synthetic text only; no secrets, PII, or unlicensed corpora.
- Sanitize `sourceText` for prompt-injection patterns in qualification linter (warn/block per severity).
- Harness continues to execute against isolated DB; no writes to production canonical state.
- Redact capability tokens and secrets from logs (carry forward Handover 2 API rules).

## Package and boundary constraints (unchanged)

- `@ckes/benchmark` ↛ harness, API, UI, pipeline.
- `@ckes/harness` → benchmark + pipeline.
- Qualification scripts may depend on `@ckes/benchmark` only.
- No new UI requirement for Handover 3; Scenario Lab may **display** released packs but official runs via CLI/CI.

## Implementation work packages (after approval)

| WP | Description | Depends on |
| --- | --- | --- |
| WP1 | Release directory layout + validate/qualify scripts | — |
| WP2 | Import externally generated JSON (three packs) | WP1 + external JSON |
| WP3 | Qualification + AI/human review logs | WP2 |
| WP4 | Freeze, hash, render Markdown | WP3 |
| WP5 | Run profile JSON (clean/warm) + harness warm path if missing | WP4 |
| WP6 | Execute run matrix; capture run results | WP5 + Postgres |
| WP7 | Designate Reference Baseline 001 + manifest | WP6 |
| WP8 | Scoring/report CLI extensions | WP6 |
| WP9 | Integration report, AAR/matrix updates, architecture doc reconciliation | WP7–WP8 |
| WP10 | EDF Framework Advisor run + affected-doc checklist | WP9 |

## Governance and affected documents

| Document | Planned update |
| --- | --- |
| [Handover_03_Benchmark_Integration_Report.md](Handover_03_Benchmark_Integration_Report.md) | Create at closeout |
| [Benchmark_Evaluation_Architecture.md](../Architecture/Benchmark_Evaluation_Architecture.md) | Reference baseline evidence, holdout policy |
| [AAR-0001](../Architecture/Audits/AAR-0001-poc-vs-economical-canonicalization-direction.md) | Evidence tiers with pack/run hashes |
| [Economical_LLM_Assisted_Canonicalization…](../Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md) | Matrix rows T-* / `CKES-PAR-*` sufficiency statements |
| [Pragmatic_Canonicalization_Research_and_Validation.md](Pragmatic_Canonicalization_Research_and_Validation.md) | Benchmark evidence pointers |
| [poc/README.md](../../poc/README.md) | Releases, qualify, baseline commands |
| [docs/Development/README.md](README.md) | Links |
| [ADR-0004](../Architecture/ADRs/ADR-0004-json-benchmark-interchange-and-evaluation-facilities.md) | Evidence status if advisor recommends |

**Not in scope:** `CKES-0001`, production TRV integration, automatic `CKES-PAR` promotion.

## EDF validation (at closeout)

- Document metadata headers on new artifacts per `edf-adoption.yaml` (`profile: core`).
- Reconcile affected Markdown (not link-only).
- Run Framework Advisor; store report under `reports/conformance/`.
- ADR/AAR impact: update AAR-0001; ADR-0004 may move toward Accepted only if advisor + architect agree.

## Acceptance criteria mapping

| Criterion (Handover 03 brief) | Plan element |
| --- | --- |
| Three suite classes produced, schema-valid | WP2, WP4, validate script |
| Qualified, frozen, hashed, Markdown | WP3–WP4 |
| ≥ two domains | Domain table + qualification lint |
| High-severity explicit review | AI 100% + human mandatory |
| Reference Baseline 001 is a run, not a suite | WP7 designation + manifest |
| Clean/warm + trials recorded | Run profiles + run result fields |
| Full metrics report | WP8, integration report |
| Leakage excluded | Qualification + existing `toPipelineInput` tests |
| Limitations documented | Integration report § invalid claims |
| POC/AAR/matrix exact hashes | WP9 |
| No automatic CKES-0001 | Out of scope |

## Open decisions for architect review

1. **POC phase 1 minimum sizes** — Accept table above or mandate full nominal counts before any baseline designation?
2. **Reference Baseline 001 scope** — Anchor clean run only vs bundle manifest referencing multiple runs.
3. **Challenge holdout** — Percentage and whether holdout scenarios are in a separate `packId` vs flagged in-pack.
4. **Warm profile** — Block baseline until warm seeding is implemented, or document clean-only official baseline?
5. **LLM trial budget** — Max spend cap for statistical suite execution.
6. **External generator** — Single vendor/tool vs multiple (affects independence rules).

## External review checklist

- [ ] Pack IDs and paths approved
- [ ] POC minimum sizes and statistical-claim limits approved
- [ ] Reference Baseline 001 designation rules approved
- [ ] Warm vs clean baseline policy approved
- [ ] Holdout policy approved
- [ ] New designation label `reference_baseline_001` approved
- [ ] Explicit authorization to build recorded

---

*This plan satisfies Handover 03 instruction: one plan for qualification, import, execution, and evidence capture. Implementation awaits architect approval.*
