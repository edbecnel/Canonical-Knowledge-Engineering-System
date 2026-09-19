# CKES benchmark JSON schemas

> **Status:** Provisional (Handover 1)
> **Schema contract version:** `1.0.0`

## Authoritative artifacts

JSON is authoritative for:

- benchmark pack definitions (`benchmark-pack.schema.json`)
- benchmark run results (`benchmark-run-result.schema.json`)
- benchmark run profiles (`benchmark-run-profile.schema.json`)

Markdown is a deterministic derived representation. YAML remains valid for corpus manifests, bootstrap knowledge, and other non-benchmark configuration.

## Content hash (pack)

1. Build a hash document from the full pack JSON.
2. Remove excluded fields (see below).
3. Serialize with [RFC 8785 JCS](https://www.rfc-editor.org/rfc/rfc8785) via the `canonicalize` package.
4. Apply SHA-256 to the UTF-8 JCS string; encode as lowercase hex in `pack.contentHash`.

### Excluded from `pack.contentHash`

| Field | Reason |
| --- | --- |
| `pack.contentHash` | Avoid circular definition |
| Top-level `integrity.signature` / `integrity.attestation` | Optional attestation, verified separately |
| Renderer timestamps | Not stored in pack JSON |
| Filesystem paths | Environment-specific |
| Derived Markdown paths | Not part of pack JSON |

### Included

All scored definition content: `executionRequirements`, `canonicalSeedMaterial`, `scenarios`, and identity references (by ID/version/hash fields).

## Canonical seed hash

`pack.canonicalSeedHash` is SHA-256(JCS(`canonicalSeedMaterial` array)) when seeds are embedded.

## Schema versioning

- **Patch:** documentation only
- **Minor:** additive JSON Schema properties
- **Major:** breaking changes; require migration notes in this file

## Composite references

Global scenario identity: `packId + packVersion + scenarioId`.

## Scoring eligibility

| Pack / scenario status | Official scored evidence |
| --- | --- |
| `draft` | Never |
| `reviewed` | Qualification runs only (not frozen reference benchmark) |
| `released` | Comparable benchmark input (execution in Handover 2+) |
| `retired` | Historical only; excluded from default runs |
