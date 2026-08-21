import { getPool, runMigrations } from './db-utils.js';

async function main(): Promise<void> {
  const pool = getPool();
  try {
    await runMigrations(pool);
    console.log('Migrations complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
