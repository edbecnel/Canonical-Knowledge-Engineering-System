import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

export function getPool(): pg.Pool {
  const url = process.env.DATABASE_URL ?? 'postgresql://ckes:ckes_dev@localhost:5433/ckes_poc';
  return new pg.Pool({ connectionString: url });
}

export async function runMigrations(pool: pg.Pool): Promise<void> {
  const files = [
    join(root, 'db/recipe-vault/001_schema.sql'),
    join(root, 'db/ckes/001_schema.sql'),
    join(root, 'db/ckes/002_candidate_coordinates.sql'),
    join(root, 'db/synthetic/001_schema.sql'),
    join(root, 'db/synthetic/002_evaluator_ground_truth.sql'),
  ];
  for (const file of files) {
    const sql = readFileSync(file, 'utf8');
    await pool.query(sql);
    console.log(`Applied: ${file}`);
  }
}
