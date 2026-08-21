import { evaluateGroundTruth } from '../packages/corpus/src/ground-truth.js';
import { getPool } from './db-utils.js';

async function main(): Promise<void> {
  const corpusId = process.argv[2] ?? 'CALS-POC-001';
  const pool = getPool();
  const result = await evaluateGroundTruth(pool, corpusId);
  console.log(JSON.stringify(result, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
