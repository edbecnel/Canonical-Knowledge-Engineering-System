import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import { normalizeLabel } from '@ckes/adapter';

/** Deterministic concept UUID from benchmark seedId (harness-only; not canonical truth). */
export function deterministicConceptIdForSeed(seedId: string): string {
  const hex = createHash('sha256').update(`ckes-harness-seed:${seedId}`, 'utf8').digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function loadPackSeedMaterial(
  pool: Pool,
  seedMaterial: Array<{ seedId: string; label: string; statement?: string }>,
): Promise<void> {
  for (const seed of seedMaterial) {
    const id = deterministicConceptIdForSeed(seed.seedId);
    const normalized = normalizeLabel(seed.label);
    await pool.query(
      `INSERT INTO ckes.canonical_concepts (id, label, normalized_label, description, experimental)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (scope_id, normalized_label) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description`,
      [id, seed.label, normalized, seed.statement ?? null],
    );
  }
}
