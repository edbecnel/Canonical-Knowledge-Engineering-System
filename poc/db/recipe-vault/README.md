# Recipe Vault Compatible Schema (POC Subset)

Minimal PostgreSQL schema compatible with Recipe Vault JSON interchange for CKES experiments.

**Classification:** CKES implementation choice  
**Provenance:** Derived from Recipe Vault schema concepts documented in CKES bootstrap plan; not a copy of production `schema.sql`.

Extensions beyond production Recipe Vault (proposed for CKES integration):

- `recipes.revision_number`
- `recipes.content_fingerprint`
- `recipes.import_provenance`
- `recipe_change_events` outbox table
