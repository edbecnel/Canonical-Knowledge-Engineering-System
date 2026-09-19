# Derived benchmark run report
> **Derived artifact** — does not modify immutable run-result JSON.
| Field | Value |
| --- | --- |
| sourceRunId | RUN-REF-CLEAN-STAT-001 |
| scorerVersion | 1.0.0-g1 |
| scorerContentHash | `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| dryRun | false |
## False-merge safety (primary)
- **Count:** 57
- **Rate:** 28.50%
- **95% CI:** 22.69% – 35.12%
### High / critical false-merge scenario IDs
- critical: (none)
- high: STA-0030, STA-0110, STA-0190
## Other rates
- pass: 50.00%
- missed match: 12.00%
- unnecessary deferral: 4.00%
- infrastructure failure: 5.50%
## Limitations
- POC rates are not production accuracy or prevalence estimates.
- Composite pass rate must not override false-merge safety findings.