# Recipe Vault Compatible Schema (POC Subset)

Minimal PostgreSQL schema compatible with Recipe Vault JSON interchange for CKES experiments.

**Classification:** CKES implementation choice  
**Provenance:** Derived from Recipe Vault schema concepts documented in CKES bootstrap plan; not a copy of production `schema.sql`.

**Authoritative integration doc:** [Recipe Vault Source Integration](../../../docs/Architecture/Recipe_Vault_Source_Integration.md) — POC extensions below are **CKES synthetic-only**, not production Recipe Vault requirements.

Extensions in this POC schema (not production TRV today):

- `recipes.revision_number`
- `recipes.content_fingerprint`
- `recipes.import_provenance`
- `recipe_change_events` outbox table
- `recipe_versions.previous_version_id` (and version-level revision/fingerprint)
