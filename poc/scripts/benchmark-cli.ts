import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  HarnessRunner,
  compareRunCompatibility,
  designateReference,
  assertDesignatableReferenceBaseline,
} from '@ckes/harness';
import { validateBenchmarkRunProfile } from '@ckes/benchmark';

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
      const profileArg = rest.find((a) => a.startsWith('--profile='))?.split('=')[1];
      if (!packArg) throw new Error('Usage: benchmark-cli run --pack=<path-or-file.json> [--profile=<profile.json>]');
      const packPath = packArg.includes('/')
        ? join(pocRoot, packArg)
        : join(pocRoot, 'benchmark/fixtures', packArg);
      const pack = await HarnessRunner.loadPack(packPath);
      let runProfile: Record<string, unknown> | undefined;
      if (profileArg) {
        const profilePath = profileArg.includes('/')
          ? join(pocRoot, profileArg)
          : join(pocRoot, 'experiments/run-profiles', profileArg);
        runProfile = JSON.parse(await readFile(profilePath, 'utf8')) as Record<string, unknown>;
        validateBenchmarkRunProfile(runProfile);
      }
      const runner = new HarnessRunner();
      const result = await runner.startRun({
        packPath,
        pack,
        runsDir,
        pool,
        concurrency: 1,
        deterministicAi: runProfile?.deterministicAi as boolean ?? true,
        databaseProfile: (runProfile?.databaseProfile as 'clean' | 'warm') ?? 'clean',
        retrievalMode: (runProfile?.retrievalMode as string) ?? 'deterministic_fixture',
        runProfile,
        dryRun: runProfile?.dryRun as boolean,
      });
      console.log(JSON.stringify(result, null, 2));
    } else if (cmd === 'reference' && rest[0] === 'designate') {
      const runId = rest.find((a) => a.startsWith('--run='))?.split('=')[1];
      const label = rest.find((a) => a.startsWith('--label='))?.split('=')[1];
      const hash = rest.find((a) => a.startsWith('--hash='))?.split('=')[1];
      if (!runId || !label || !hash) throw new Error('reference designate --run= --label= --hash=');
      if (label === 'reference_baseline_001') {
        throw new Error('reference_baseline_001 designation requires G5 authorization');
      }
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
