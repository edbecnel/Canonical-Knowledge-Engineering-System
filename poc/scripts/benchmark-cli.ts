import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  HarnessRunner,
  compareRunCompatibility,
  designateReference,
  defaultHarnessRoots,
} from '@ckes/harness';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const runsDir = join(pocRoot, 'experiments/runs');
const designationsDir = join(pocRoot, 'experiments/reference-designations');

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://ckes:ckes_dev@localhost:5433/ckes_poc',
  });
  try {
    if (cmd === 'run') {
      const packArg = rest.find((a) => a.startsWith('--pack='))?.split('=')[1];
      if (!packArg) throw new Error('Usage: benchmark-cli run --pack=<file.json>');
      const packPath = join(pocRoot, 'benchmark/fixtures', packArg);
      const pack = await HarnessRunner.loadPack(packPath);
      const runner = new HarnessRunner();
      const result = await runner.startRun({
        packPath,
        pack,
        runsDir,
        pool,
        concurrency: 1,
        deterministicAi: true,
        databaseProfile: 'clean',
        retrievalMode: 'deterministic_fixture',
      });
      console.log(JSON.stringify(result, null, 2));
    } else if (cmd === 'reference' && rest[0] === 'designate') {
      const runId = rest.find((a) => a.startsWith('--run='))?.split('=')[1];
      const label = rest.find((a) => a.startsWith('--label='))?.split('=')[1];
      const hash = rest.find((a) => a.startsWith('--hash='))?.split('=')[1];
      if (!runId || !label || !hash) throw new Error('reference designate --run= --label= --hash=');
      const event = await designateReference({
        designationsDir,
        runId,
        runResultHash: hash,
        label: label as 'harness_comparison_fixture',
        designatedBy: 'benchmark-cli',
        runTerminalState: 'completed',
      });
      console.log(JSON.stringify(event, null, 2));
    } else if (cmd === 'compare') {
      const exp = rest.find((a) => a.startsWith('--experiment='))?.split('=')[1];
      const ref = rest.find((a) => a.startsWith('--reference='))?.split('=')[1];
      if (!exp || !ref) throw new Error('compare --experiment= --reference=');
      const experiment = JSON.parse(await readFile(exp, 'utf8')) as Record<string, unknown>;
      const reference = JSON.parse(await readFile(ref, 'utf8')) as Record<string, unknown>;
      console.log(JSON.stringify(compareRunCompatibility(experiment, reference), null, 2));
    } else {
      console.error('Commands: run, reference designate, compare');
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
