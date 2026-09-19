# Derived benchmark run report
> **Derived artifact** — does not modify immutable run-result JSON.
| Field | Value |
| --- | --- |
| sourceRunId | RUN-REF-CLEAN-STAT-002 |
| scorerVersion | 1.0.0-g1 |
| scorerContentHash | `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| dryRun | false |
## False-merge safety (primary)
- **Count:** 59
- **Rate:** 29.50%
- **95% CI:** 23.61% – 36.16%
### High / critical false-merge scenario IDs
- critical: (none)
- high: STA-0030, STA-0110, STA-0190
## Other rates
- pass: 53.50%
- missed match: 13.00%
- unnecessary deferral: 4.00%
- infrastructure failure: 0.00%
## Limitations
- POC rates are not production accuracy or prevalence estimates.
- Composite pass rate must not override false-merge safety findings.