import type { Pool } from 'pg';
import { normalizeLabel } from '@ckes/adapter';
import { deterministicConceptIdForSeed } from '@ckes/benchmark';

export { deterministicConceptIdForSeed };

/** REF-CLEAN: canonical corpus contains only pack seed concepts (measurement isolation). */
export async function resetCanonicalCorpusForBenchmarkPack(pool: Pool): Promise<void> {
  await pool.query('TRUNCATE ckes.canonical_relationships RESTART IDENTITY CASCADE').catch(() => {});
  await pool.query('TRUNCATE ckes.canonical_knowledge_objects RESTART IDENTITY CASCADE').catch(
    () => {},
  );
  await pool.query('TRUNCATE ckes.canonical_concepts RESTART IDENTITY CASCADE');
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
