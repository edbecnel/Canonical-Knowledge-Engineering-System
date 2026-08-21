# CALS Culinary Knowledge Canonicalization Policy (Experimental)

> **Status:** Draft — experimental
> **Owner:** CALS / CKES collaboration
> **Classification:** CALS domain policy
> **Version:** 1.0.0

## Purpose

Govern how culinary knowledge from Recipe Vault-shaped sources becomes CALS canonical knowledge during CKES experiments. Machine-consumable form: [`cals-policy.v1.json`](cals-policy.v1.json).

## Principles

1. **Prefer reuse** — existing canonical concepts and knowledge objects should be reused when semantically equivalent.
2. **Canonical economy** — new identities require meaningful distinction and integration value.
3. **No synonym inflation** — wording differences alone do not justify new concepts.
4. **Contradictions preserved** — conflicting knowledge is recorded, never silently overwritten.
5. **Risk-based admission** — food safety and allergen claims require escalation; synthetic sources never auto-admit high-risk knowledge.
6. **AI proposes, policy governs** — semantic classifications map to policy actions; only controlled commit alters canonical state.

## Concept Creation

A new canonical concept should:

- Represent a meaningful semantic distinction
- Not duplicate an existing concept
- Possess meaning independent of source wording
- Integrate with existing semantic structures

A concept should **not** be created merely because wording differs or AI suggests a new label.

## Semantic Classification Actions

| Classification | Policy Action |
|----------------|---------------|
| EQUIVALENT | Reuse existing identity; optional additional evidence |
| SUBSUMED_BY_EXISTING | Reject new identity |
| EXTENDS_EXISTING | Propose extension |
| CONTRADICTS | Preserve conflict |
| DISTINCT | Evaluate new identity against economy rules |
| UNCERTAIN | Defer |

## Risk Tiers

- **Low:** terminology, cuisine classification — may auto-admit with ordinary evidence
- **Ordinary:** recipes, techniques, ingredient behavior — standard policy
- **High:** food safety, allergens, toxicity — always escalate; synthetic provenance blocks auto-admit

## Related Documents

- [CKES-0000](../../../../CKES-0000.md) §13–14
- [Policy Engine](src/engine.ts)
