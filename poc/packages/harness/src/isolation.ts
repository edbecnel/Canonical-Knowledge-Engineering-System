import type { Pool } from 'pg';

/**
 * Handover 2 isolation strategy (locked): serial execution + TRUNCATE reset between scenarios.
 * Not transaction-only — pipeline uses pool connections independently.
 */
const HARNESS_TRUNCATE_TABLES = [
  'ckes.staging_changes',
  'ckes.canonicalization_decisions',
  'ckes.candidates',
  'ckes.canonical_commits',
  'ckes.canonicalization_runs',
  'ckes.metrics_snapshots',
];

export async function resetHarnessSandbox(pool: Pool): Promise<void> {
  await pool.query('CREATE SCHEMA IF NOT EXISTS harness');
  for (const table of HARNESS_TRUNCATE_TABLES) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`).catch(() => {
      /* table may be empty on first run */
    });
  }
  await pool.query(
    `INSERT INTO harness.isolation_log (reset_at) VALUES (NOW()) ON CONFLICT DO NOTHING`,
  ).catch(async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS harness.isolation_log (
        id SERIAL PRIMARY KEY,
        reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await pool.query(`INSERT INTO harness.isolation_log (reset_at) VALUES (NOW())`);
  });
}

export const HARNESS_CONCURRENCY_MAX = 1;
