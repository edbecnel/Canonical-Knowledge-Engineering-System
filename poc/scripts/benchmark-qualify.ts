import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { qualifyBenchmarkPack } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');

function main(): void {
  const args = process.argv.slice(2);
  const packArg = args.find((a) => a.startsWith('--pack='))?.split('=')[1];
  const mode = args.find((a) => a.startsWith('--mode='))?.split('=')[1] as 'import' | 'freeze' | undefined;
  const writeReport = args.includes('--write-report');
  if (!packArg) {
    console.error('Usage: benchmark-qualify --pack=<path.json> [--mode=import|freeze] [--write-report]');
    process.exit(1);
  }
  const packPath = packArg.startsWith('/') ? packArg : join(pocRoot, packArg);
  const pack = JSON.parse(readFileSync(packPath, 'utf8')) as Record<string, unknown>;
  const packMeta = pack.pack as Record<string, unknown>;
  const packId = packMeta.packId as string;
  const provenancePath = join(pocRoot, 'benchmark/generation', packId, 'provenance.json');
  const result = qualifyBenchmarkPack(pack, {
    mode: mode ?? 'import',
    provenancePath,
    packRoot: pocRoot,
    packPath,
  });
  console.log(JSON.stringify(result, null, 2));
  if (writeReport) {
    const outDir = join(pocRoot, 'benchmark/generation', packId);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'qualify-report.json'), JSON.stringify(result, null, 2));
  }
  if (!result.passed) process.exit(1);
}

main();
