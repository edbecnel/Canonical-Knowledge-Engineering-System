# Derived benchmark run report
> **Derived artifact** — does not modify immutable run-result JSON.
| Field | Value |
| --- | --- |
| sourceRunId | RUN-REF-CLEAN-CHALLENGE-002 |
| scorerVersion | 1.0.0-g1 |
| scorerContentHash | `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| dryRun | false |
## False-merge safety (primary)
- **Count:** 20
- **Rate:** 25.00%
- **95% CI:** 16.81% – 35.48%
### High / critical false-merge scenario IDs
- critical: CHL-0012, CHL-0024, CHL-0048, CHL-0060, CHL-0072
- high: CHL-0033
## Other rates
- pass: 11.25%
- missed match: 2.50%
- unnecessary deferral: 61.25%
- infrastructure failure: 0.00%
## Limitations
- POC rates are not production accuracy or prevalence estimates.
- Composite pass rate must not override false-merge safety findings.