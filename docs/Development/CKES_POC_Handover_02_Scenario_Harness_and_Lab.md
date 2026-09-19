[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › CKES POC Handover 02

> **Status:** Archived (integrated 2026-09-19)
> **Owner:** Architecture Team

# CKES POC Handover 02: Scenario Harness and Scenario Lab

## Instructions to Cursor Plan

This is **Handover 2 of 3**. Begin planning only after Handover 1 has been built, validated, and architect-accepted. Use the schemas and terminology produced by Handover 1; do not redesign competing formats.

Create one plan for this handover only. Do not build until the plan has been externally reviewed, amended, architect-approved, and explicitly authorized for build.

Apply current EDF requirements and reconcile all affected Markdown. Do not create CKES-0001.

## Outcome

Implement the reusable execution engine, CLI, and local Scenario Lab UI that consume validated JSON benchmark packs, exercise CKES through isolated test paths, display decisions and economic behavior, generate result JSON and derived Markdown, and compare experiment runs with a selected reference baseline.

This UI is primarily a batch experiment and analysis tool, not a manual data-entry application.

## Shared runner architecture

Create one shared harness package used by both CLI and UI. The UI must not implement a second evaluation path.

The runner must:

1. import and validate benchmark JSON;
2. verify schema compatibility and integrity;
3. establish the declared clean/warm database profile;
4. isolate scenario state;
5. apply benchmark seed material;
6. execute full-pipeline or decision-slice mode;
7. keep expected results outside the pipeline;
8. capture retrieval, adjudication, policy, provenance, timing, and cost artifacts;
9. evaluate actual results only after pipeline completion;
10. write result JSON validated by the result schema;
11. generate human-readable Markdown reports;
12. support cancellation, retry of infrastructure failures, and idempotent reruns.

## CLI requirements

Provide commands equivalent to:

- validate a pack;
- inspect pack metadata;
- run one scenario;
- run a filtered subset;
- run an entire pack;
- execute repeated LLM trials;
- capture/select a reference baseline;
- compare a run with a baseline;
- generate Markdown from pack/result JSON;
- migrate legacy YAML fixtures one way into JSON.

Exact names should follow repository conventions.

## Scenario Lab UI

Implement a local-development UI with these functional areas.

### Pack library and import

- Import JSON files or a defined pack archive.
- Show schema/version/integrity validation.
- Display pack ID, version, suite class, domains, case counts, provenance, and review status.
- Reject unsupported schema versions with actionable errors.
- Show exact JSON paths for validation failures.

### Benchmark runner

- Select one or more reviewed packs.
- Filter by suite, domain, category, confidence, execution mode, severity, CKES-PAR, and validation row.
- Run one, filtered, or all scenarios.
- Configure allowed concurrency, trial count, cost ceiling, and clean/warm profile within pack constraints.
- Show projected and actual LLM usage.
- Display progress, pause/cancel, and retry infrastructure failures.

### Results and comparison

- Show expected versus actual only after execution.
- Show retrieved candidates, scores, compatibility checks, route, adjudication, policy action, and provenance.
- Clearly label live, mocked, hinted, and deterministic retrieval.
- Highlight false merges and high-severity failures.
- Show aggregate metrics and results by category/domain/confidence.
- Compare an experiment run with a selected reference baseline.
- Distinguish statistical change from cases not comparable because configuration or packs differ.
- Export JSON and derived Markdown reports.

### Exploratory Scenario Builder

Provide an auxiliary form for one-off experiments:

- source text or direct candidate;
- domain/subdomain;
- candidate type;
- context/applicability;
- optional canonical seed selection;
- human-expected outcome and acceptable alternatives;
- allowed escalation/cost policy.

Exploratory runs are not scored benchmark evidence. Allow export as a **draft JSON scenario or draft pack**. It enters scored suites only through later review/versioning.

The architect must not be required to manually enter the large benchmark corpus.

## Baseline behavior

The UI must use “Reference Baseline” only for a selected run result, never for a suite.

A reference baseline records how a specific CKES build performed against exact pack versions under an exact run configuration. Comparison must verify pack and configuration compatibility and prominently disclose differences.

## Evaluation repair integration

Complete or integrate the stable source/change/recipe/candidate linkage from Handover 1. Ensure `evaluate` produces nonzero evaluated cases where applicable, while preserving the distinction between corpus evaluation and reviewed benchmark scoring.

## State and data safety

- Never run scored scenarios against production data.
- Use local/disposable POC state.
- Prevent cross-scenario contamination except declared ordered warm suites.
- Do not cross tenant/user boundaries for batching.
- Redact secrets and protected source content from committed artifacts.
- Separate infrastructure failures from semantic failures.
- Do not make benchmark execution mutate accepted canonical state outside the test environment.

## Reporting

Generate:

- pack-readable Markdown;
- per-run Markdown;
- baseline comparison Markdown;
- machine-readable JSON for every result;
- compact summaries suitable for AAR evidence.

Reports must include limitations, mocked/unimplemented components, trial count, configuration, pack hashes, and evidence confidence. A green scenario is bounded evidence, not universal conformance proof.

## Initial smoke fixtures

Use only enough schema-conforming fixtures to prove the harness and UI:

- exact match;
- clear paraphrase;
- similar-but-distinct pastry/cookie case;
- ambiguous top-two defer case;
- one objective/method case;
- one non-culinary electronics/ELS-style case.

These are implementation smoke fixtures, not the final Anchor/Statistical/Challenge releases of Handover 3.

## Testing

Test at least:

- valid and invalid pack import;
- unsupported schema version;
- deterministic Markdown rendering;
- no expected-result leakage;
- isolation/reset behavior;
- clean/warm profile differences;
- full-pipeline versus decision-slice execution;
- repeated LLM trials;
- cancellation and cost ceiling;
- partial/infrastructure failure handling;
- CLI/UI identical runner results;
- baseline compatibility checks;
- legacy YAML migration;
- result-schema validation;
- false-merge classification;
- secret/protected-data exclusion.

## Out of scope

- Large benchmark generation.
- Production TRV/CALS integration.
- Full vector, batching, reuse-cache, rollback, or revalidation implementation unless already separately authorized.
- CKES-0001 promotion.
- Treating exploratory inputs as accepted canonical knowledge.

## Acceptance criteria for Handover 2

- CLI and UI consume the same validated JSON packs through the same runner.
- Batch import and execution work without manual scenario entry.
- The UI distinguishes suites from runs and reference baselines.
- Expected results cannot leak into CKES decisions.
- Results are separate JSON artifacts with derived Markdown.
- Scenario state is isolated and reproducible.
- Full-pipeline and decision-slice modes work.
- Clean/warm profiles work.
- False merges, routing, LLM usage, tokens, cost, latency, reuse, and human review are visible.
- Exploratory cases export as drafts but do not silently enter benchmarks.
- Smoke fixtures demonstrate multiple domains.
- AAR/POC documentation states evidence limitations.
- No large final benchmark corpus and no CKES-0001 are created.

