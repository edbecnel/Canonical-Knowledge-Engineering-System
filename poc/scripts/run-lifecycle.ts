import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { CorpusManifest } from '../packages/corpus/src/manifest.js';
import { runLifecycleSimulation } from '../packages/corpus/src/lifecycle.js';
import { getPool } from './db-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const manifestPath = join(__dirname, '../experiments/manifests/CALS-POC-001.yaml');
  const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as CorpusManifest;
  const pool = getPool();
  const result = await runLifecycleSimulation(pool, manifest);
  console.log(`Lifecycle simulation applied ${result.eventsApplied} events`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
