# Derived benchmark run report
> **Derived artifact** — does not modify immutable run-result JSON.
| Field | Value |
| --- | --- |
| sourceRunId | RUN-REF-CLEAN-ANCHOR-002 |
| scorerVersion | 1.0.0-g1 |
| scorerContentHash | `bd2c0c6bed3375f4ec43b922b9946b33c4e81a7845172393f8f9772e0d925d55` |
| dryRun | false |
## False-merge safety (primary)
- **Count:** 18
- **Rate:** 45.00%
- **95% CI:** 30.71% – 60.17%
### High / critical false-merge scenario IDs
- critical: ANC-0017, ANC-0018, ANC-0019, ANC-0020
- high: (none)
## Other rates
- pass: 42.50%
- missed match: 10.00%
- unnecessary deferral: 2.50%
- infrastructure failure: 0.00%
## Limitations
- POC rates are not production accuracy or prevalence estimates.
- Composite pass rate must not override false-merge safety findings.