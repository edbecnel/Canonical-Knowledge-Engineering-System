import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDerivedRunReport, renderDerivedReportMarkdown } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');

function main(): void {
  const args = process.argv.slice(2);
  const runArg = args.find((a) => a.startsWith('--run='))?.split('=')[1];
  const packArg = args.find((a) => a.startsWith('--pack='))?.split('=')[1];
  const outDir = args.find((a) => a.startsWith('--out='))?.split('=')[1];
  if (!runArg) {
    console.error('Usage: benchmark-report --run=<run-result.json> [--pack=<pack.json>] [--out=<dir>]');
    process.exit(1);
  }
  const runPath = runArg.startsWith('/') ? runArg : join(pocRoot, runArg);
  const runResult = JSON.parse(readFileSync(runPath, 'utf8')) as Record<string, unknown>;
  const runHash = createHash('sha256').update(readFileSync(runPath)).digest('hex');
  let packScenarios: Record<string, unknown>[] | undefined;
  if (packArg) {
    const packPath = packArg.startsWith('/') ? packArg : join(pocRoot, packArg);
    const pack = JSON.parse(readFileSync(packPath, 'utf8')) as Record<string, unknown>;
    packScenarios = pack.scenarios as Record<string, unknown>[];
  }
  const report = buildDerivedRunReport({
    runResult,
    packScenarios,
    sourceRunResultPath: runPath,
    sourceRunResultHash: runHash,
  });
  const json = JSON.stringify(report, null, 2);
  console.log(json);
  if (outDir) {
    const dir = outDir.startsWith('/') ? outDir : join(pocRoot, outDir);
    mkdirSync(dir, { recursive: true });
    const base = basename(runPath, '.json');
    writeFileSync(join(dir, `${base}.derived-report.json`), json);
    writeFileSync(join(dir, `${base}.derived-report.md`), renderDerivedReportMarkdown(report));
  }
}

main();
