import 'dotenv/config';
import { runPipeline } from '../packages/pipeline/src/runner.js';
import { getPool } from './db-utils.js';

function parseArgs(): { stage: string } {
  const args = process.argv.slice(2);
  let stage = 'seed';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stage' && args[i + 1]) stage = args[++i];
  }
  return { stage };
}

async function main(): Promise<void> {
  const { stage } = parseArgs();
  const pool = getPool();
  const deterministic = process.env.CKES_DETERMINISTIC_AI === 'true' || !process.env.OPENAI_API_KEY;
  const result = await runPipeline(pool, {
    corpusStage: stage,
    openaiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    deterministicAi: deterministic,
  });
  console.log(result.report);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
