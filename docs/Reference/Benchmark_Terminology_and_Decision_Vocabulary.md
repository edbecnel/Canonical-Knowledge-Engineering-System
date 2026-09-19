# Benchmark Terminology and Decision Vocabulary (Provisional)

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Reference](README.md) › Benchmark Terminology and Decision Vocabulary

> **Status:** Maintained (provisional; not `CKES-0001`)
> **CRA baseline:** CRA-0001–0003 adopted for charter alignment per [Economical LLM direction](../Architecture/Economical_LLM_Assisted_Canonicalization_Discovery_and_Revalidation.md) §3; CRA-0004+ not adopted as normative CKES semantics.

## Decision class (provisional)

CKES-facing expected decisions in benchmark packs:

- `match_existing`
- `related_distinct`
- `propose_new_identity`
- `qualify_existing`
- `contradict_existing`
- `revalidation_candidate`
- `defer_llm`
- `defer_human`
- `reject_source_specific`

`false_merge` is **not** a decision class.

## Evaluation outcome

- `pass`
- `fail`
- `acceptable_alternative`
- `infrastructure_error`
- `not_evaluated`

## Failure classification (scoring)

- `false_merge` (highest-risk ordinary matching failure)
- `missed_match`
- `unnecessary_new_identity`
- `unnecessary_deferral`
- `applicability_error`
- `policy_violation`

## Label confidence

- `deterministic_by_construction`
- `strong_expectation`
- `acceptable_result_set`
- `expected_deferral`
- `human_review_required`
- `research_unresolved`

## Pack / scenario status and scoring

| Status | Official scored evidence |
| --- | --- |
| `draft` | Never |
| `reviewed` | Qualification only |
| `released` | Comparable benchmark input (when runner exists) |
| `retired` | Historical; excluded from default runs |

## Composite identity

`packId + packVersion + scenarioId`
