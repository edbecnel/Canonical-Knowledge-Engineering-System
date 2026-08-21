# Experiment Results

Timestamped run outputs from `npm run experiment:progressive`.

Raw JSON reports are gitignored; reproduce via `npm run reproduce` in `poc/`.

## Latest Run Summary (2026-08-18)

| Stage | Recipes | New concepts/1000 | Mapping trend |
|-------|---------|-------------------|---------------|
| seed | ~50 | 20.0 | Baseline |
| poc1 | ~500 | 14.0 | Economy improving |
| poc2 | ~5,000 | 1.6 | Strong reuse |
| poc3 | ~25,000 | 0.28 | Maturity hypothesis supported |

Canonical novelty rate declined as knowledgebase matured — see [CRA Findings Report](../../../docs/Development/CRA_Findings_Report.md) F-005.
