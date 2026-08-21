import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { CorpusManifest } from '../packages/corpus/src/manifest.js';
import { generateCorpusForStage } from '../packages/corpus/src/generator.js';
import { getPool } from './db-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(): { manifest: string; stage: string } {
  const args = process.argv.slice(2);
  let manifest = join(__dirname, '../experiments/manifests/CALS-POC-001.yaml');
  let stage = 'seed';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest' && args[i + 1]) manifest = args[++i];
    if (args[i] === '--stage' && args[i + 1]) stage = args[++i];
  }
  return { manifest, stage };
}

async function main(): Promise<void> {
  const { manifest: manifestPath, stage } = parseArgs();
  const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as CorpusManifest;
  const pool = getPool();
  const count = await generateCorpusForStage(pool, manifest, stage);
  console.log(`Corpus ${manifest.corpus} stage ${stage}: ${count} recipes`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
