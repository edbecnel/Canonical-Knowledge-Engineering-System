# Benchmark generation provenance (not pipeline input)

Per pack (`<packId>/`):

| File | Purpose |
| --- | --- |
| `provenance.json` | Generator, prompts, distributions, review independence, rejection counts |
| `review-log.jsonl` | AI/human review events |
| `qualify-report.json` | Output of `npm run benchmark:qualify --write-report` |
| `quarantine.json` | Disputed or rejected scenarios removed from a release version |

Holdout (Challenge): prefer access-controlled storage; in-repo holdouts are **process-controlled tuning holdouts** only.
