# Source Change Contract

[Home](../../README.md) › [Project Index](../../PROJECT_INDEX.md) › [Architecture](README.md) › Source Change Contract

> **Status:** Draft
> **Owner:** Architecture Team
> **Applies To:** CKES source adapters
> **Classification:** CKES implementation choice (candidate CRA adoption pattern)
> **Last Reviewed:** 2026-08-18

## Purpose

Technology-independent contract for incremental knowledge acquisition from evolving source systems. Initial implementation targets Recipe Vault; contract must generalize to other sources.

## KnowledgeSourceChange

```typescript
interface KnowledgeSourceChange {
  sourceSystem: string;       // e.g. "recipe_vault", "synthetic_rv"
  sourceObjectId: string;     // stable source object ID
  sourceRevision: string;     // monotonic revision identifier
  previousRevision?: string;
  changeType: ChangeType;
  changedFields: string[];    // e.g. ["instructions[7].text"]
  contentHash: string;        // fingerprint of canonical content subset
  timestamp: string;          // ISO 8601
}
```

## ChangeType

| Value | Description |
|-------|-------------|
| `CREATED` | New source object |
| `IMPORTED` | Object imported from external origin |
| `MODIFIED` | General modification |
| `INGREDIENT_CHANGED` | Ingredient line changed |
| `INSTRUCTION_CHANGED` | Instruction step changed |
| `PROVENANCE_CHANGED` | Source/provenance metadata changed |
| `DELETED` | Object removed or soft-deleted |

## Processing Semantics

- Adapters emit changes via cursor-based polling or event feed
- CKES records last processed revision per `source_object_id`
- Idempotency key: `(source_system, source_object_id, source_revision)`
- Expensive semantic processing triggered only when `contentHash` differs from last processed

## Adapter implementation notes

- `sourceRevision` is a **string**—timestamp, semver, or UUID are valid; an integer revision column on the source is optional.
- `contentHash` may be **computed by the adapter** from fetched content; a source-stored fingerprint is an optimization.
- Change feeds may be **adapter-synthesized** (poll + diff) rather than requiring a source-native outbox table.

See [Recipe Vault Source Integration](Recipe_Vault_Source_Integration.md) for production Recipe Vault mapping.

## Related Documents

- [ADR-0002](ADRs/ADR-0002-poc-typescript-postgresql.md)
- [Recipe Vault Source Integration](Recipe_Vault_Source_Integration.md)
- [Recipe Vault Change Proposals](../Development/Recipe_Vault_Change_Proposals.md) — superseded framing; POC schema notes only
