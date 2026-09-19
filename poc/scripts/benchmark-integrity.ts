import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HarnessRunner, verifyRunCompleteness, verifyScenarioLeakage } from '@ckes/harness';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const packArg = args.find((a) => a.startsWith('--pack='))?.split('=')[1];
  const runArg = args.find((a) => a.startsWith('--run='))?.split('=')[1];
  if (!packArg) {
    console.error('Usage: benchmark-integrity --pack=<pack.json> [--run=<run-result.json>]');
    process.exit(1);
  }
  const packPath = packArg.startsWith('/') ? packArg : join(pocRoot, packArg);
  const pack = await HarnessRunner.loadPack(packPath);
  const leakage = verifyScenarioLeakage(pack);
  console.log('leakage:', JSON.stringify(leakage, null, 2));
  if (!leakage.passed) process.exit(1);
  if (runArg) {
    const runPath = runArg.startsWith('/') ? runArg : join(pocRoot, runArg);
    const runResult = JSON.parse(readFileSync(runPath, 'utf8')) as Record<string, unknown>;
    const completeness = verifyRunCompleteness(pack, runResult);
    console.log('completeness:', JSON.stringify(completeness, null, 2));
    if (!completeness.passed) process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
