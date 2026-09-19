# Handover 03 G2 Review Package

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Handover 03 G2 Review Package

> **Status:** Submitted for architect approval (G3 not authorized)
> **Owner:** Architecture Team
> **Applies To:** Handover 3 Gate G2
> **Last Reviewed:** 2026-09-19

## Authorization boundary

| Gate | Status |
| --- | --- |
| G2 Candidate packs + provenance + qualification | **This package** |
| G3 Freeze (official hash + derived Markdown under `benchmark/releases/`) | **Not performed** |
| G4 Official run matrix | **Not performed** |
| G5 `reference_baseline_001` designation | **Not performed** |
| G6 Evidence manifest + governance closeout | **Not performed** |

Packs remain `pack.status: reviewed`, `packVersion: 1.0.0-candidate-g2`. No scenario has `released` status. **Not** copied to `benchmark/releases/`.

## Candidate packs

| Pack ID | Suite | Scenarios | Culinary | Electronics | contentHash (candidate) |
| --- | --- | ---: | ---: | ---: | --- |
| CKES-BENCHMARK-ANCHOR-001 | anchor | 40 | 19 | 21 | `93471b95fb8f279731f5a8c432c7a801f5bf7508c290fa7ccd4def03ea3e5b3e` |
| CKES-BENCHMARK-STATISTICAL-001 | statistical | 200 | 100 | 100 | `a822be3a6455177f263101c06ee233bd128189afb3c87c87ddbfeaa7da1171ff` |
| CKES-BENCHMARK-CHALLENGE-001 | challenge | 80 | 40 | 40 | `0cf461f86949a3926e404b8e74d6b3d1b0bb096b4349afb6ce3727be3335cf7b` |

Paths:

- `poc/benchmark/candidates/anchor/CKES-BENCHMARK-ANCHOR-001.json`
- `poc/benchmark/candidates/statistical/CKES-BENCHMARK-STATISTICAL-001.json`
- `poc/benchmark/candidates/challenge/CKES-BENCHMARK-CHALLENGE-001.json`

Schema: **1.0.0**. Fictitious culinary + electronics (ELS) synthetic text only.

## Counts (generated / rejected / disputed / released)

| Pack | Generated | Rejected (quarantine) | Disputed | Released |
| --- | ---: | ---: | ---: | ---: |
| Anchor | 40 | 0 | 0 | 0 |
| Statistical | 200 | 0 | 0 | 0 |
| Challenge | 81 | 1 | 0 | 0 |

Challenge quarantine: `benchmark/generation/CKES-BENCHMARK-CHALLENGE-001/quarantine.json` (`CHL-REJECT-001`, `research_unresolved`).

## Provenance and review evidence

Per pack under `poc/benchmark/generation/<packId>/`:

- `provenance.json` — generator, seed hash, distributions, independence limitation, counts
- `review-log.jsonl` — human events for all **high/critical** `failureSeverity` scenarios; stratified independent sample (~12% via deterministic scenario-id rule)
- `qualify-report.json` — output of `benchmark:qualify --write-report`

**Generator:** `ckes-g2-pack-generator/1.0.0` (`poc/scripts/generate-g2-benchmark-candidates.ts`), deterministic construction rules — **not** LLM labels as ground truth.

**Independence limitation:** Single construction toolchain; `independentOfGenerator: false` in provenance. Stratified AI review entries use pseudonym `ai-reviewer-pseudonym-H3-G2-IND-01`. Human pseudonym `human-reviewer-pseudonym-H3-G2-01` on mandatory high/critical false-merge-risk rows.

**Human-review volume (review-log lines with human-reviewer):** Anchor 4, Statistical 3, Challenge 26 (challenge has more high/critical severity strata).

**Human approval event:** `g2-candidate-batch-2026-09-19-pending-architect` (awaiting your sign-off).

## Challenge holdout

**Process-controlled tuning holdout** (not hidden/blind):  
`benchmark/generation/CKES-BENCHMARK-CHALLENGE-001/holdout-process-controlled.json` — 16 scenario IDs (~20%), `confidentialityEnforced: false`.

## Qualification results

Command: `npm run benchmark:qualify -- --pack=<candidate.json> --write-report`

| Pack | passed | freezeReady | issues |
| --- | --- | --- | --- |
| Anchor | true | false | none |
| Statistical | true | false | none |
| Challenge | true | false | none |

`freezeReady: false` expected: pack not `released` and G3 not authorized.

## Leakage / integrity

`npm run benchmark:integrity -- --pack=<candidate.json>` — **leakage passed** for all three packs.

## CKES pipeline / semantics

**No changes** to `poc/packages/pipeline/` or policy adjudication in G2.

## Suspected CKES defects

None observed during generation/qualification (no execution runs in G2). Construction expectations are not validated against live pipeline until G4.

## Known limitations

- Expectations are **construction-derived**; POC generator is not independent external corpus authorship.
- `matchedSeedId` not populated by pipeline at runtime (G1 known gap); `mustNotMatchIdentities` enforced in pack JSON for traps.
- Candidate content hashes will change if generator is re-run with new `createdAt`; G3 freeze will pin official hash.
- Review-log AI stratified entries are **documentary** for POC process, not a substitute for architect review of this package.

## Tooling added in G2

- `npm run benchmark:generate-g2-candidates`
- `poc/benchmark/candidates/` layout + README

## Tests / validation executed

- `npm run benchmark:generate-g2-candidates`
- `npm run benchmark:qualify` (×3, `--write-report`)
- `npm run benchmark:integrity` (×3)
- `npm run benchmark:test` (32/32)
- `npm run harness:test` (8/8)

## Git commit

**`b291e5c`** — Add Handover 3 G2 candidate benchmark packs and review package.

## Architect decision requested

Approve candidate pack **contents** for G3 freeze, or request revisions (pack version bump, quarantine adjustments, additional human review evidence).

Do **not** proceed to G3 without explicit authorization.
