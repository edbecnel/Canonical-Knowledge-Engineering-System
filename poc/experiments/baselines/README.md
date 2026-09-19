# POC run profiles and legacy anchors

Fixed **run profiles** describe intended execution inputs for reproducible corpus runs. A **reference baseline** is a designated completed benchmark run result (Handover 3)—not this directory’s JSON/YAML.

## Terminology

| Term | Meaning |
| --- | --- |
| **Run profile** | JSON configuration (`experiments/run-profiles/`) — git commit, manifest, policy, DB profile intent |
| **Anchor suite / benchmark pack** | Versioned JSON scenarios (`poc/benchmark/`) |
| **Reference baseline** | Stored `benchmark-run-result.json` selected for comparison (Handover 3) |

## Active run profile

| ID | File |
| --- | --- |
| CKES-BENCHMARK-RUN-PROFILE-001 | [CKES-BENCHMARK-RUN-PROFILE-001.json](../run-profiles/CKES-BENCHMARK-RUN-PROFILE-001.json) |

Migrate from legacy YAML:

```bash
cd poc
npm run benchmark:migrate-profile
```

## Legacy YAML anchors (deprecated)

| File | Status |
| --- | --- |
| [CKES-PAR-baseline-anchors-2026-09-19.yaml](CKES-PAR-baseline-anchors-2026-09-19.yaml) | Deprecated — use JSON run profile |

## Capture procedure (corpus evaluation)

```bash
cd poc
# Align checkout and .env with run profile anchors
npm run db:migrate
npm run bootstrap:knowledge
npm run corpus:seed

CKES_DETERMINISTIC_AI=true npm run pipeline:run -- --stage seed
npm run evaluate
```

See [Benchmark Evaluation Architecture](../../../docs/Architecture/Benchmark_Evaluation_Architecture.md) and [POC README](../../README.md).
