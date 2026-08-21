# Recipe Vault Change Proposals

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Development](README.md) › Recipe Vault Change Proposals

> **Status:** Superseded (framing)
> **Owner:** Architecture Team
> **Classification:** Historical — POC synthetic schema notes
> **Last Reviewed:** 2026-08-22

## Superseded

The **requirements framing** of this document (that Recipe Vault production should adopt the POC schema extensions) has been **superseded**.

**Authoritative document:** [Recipe Vault Source Integration](../Architecture/Recipe_Vault_Source_Integration.md) (Architecture domain, EDF `docs/Architecture/`).

That document records:

- What Recipe Vault **already provides** for the [Source Change Contract](../Architecture/Source_Change_Contract.md)
- CKES **adapter responsibilities** (polling, fingerprinting, change synthesis)
- POC synthetic schema as **CKES-only** experimental substrate
- **Deferred** optional TRV schema optimizations until a joint integration milestone

---

## POC synthetic extensions (CKES implementation choice)

These remain valid in [`poc/db/recipe-vault/001_schema.sql`](../../poc/db/recipe-vault/001_schema.sql) for CKES experiments—not production Recipe Vault requirements:

1. `recipes.revision_number` (INTEGER, monotonic)
2. `recipes.content_fingerprint` (TEXT) — canonical recipe subset hash; distinct from TRV AI cooldown fingerprint
3. `recipe_change_events` outbox table
4. `recipes.import_provenance` (JSONB)
5. `recipe_versions.previous_version_id`

See [Recipe Vault Source Integration §7](../Architecture/Recipe_Vault_Source_Integration.md#7-poc-synthetic-schema-ckes-only).

---

## Related Documents

- [Recipe Vault Source Integration](../Architecture/Recipe_Vault_Source_Integration.md) — **authoritative**
- [Source Change Contract](../Architecture/Source_Change_Contract.md)
- [CRA Findings Report](CRA_Findings_Report.md)
