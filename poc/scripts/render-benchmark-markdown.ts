import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderBenchmarkPackMarkdown,
  renderBenchmarkRunResultMarkdown,
} from '@ckes/benchmark';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

function main(): void {
  const target = process.argv.find((a) => a.endsWith('.json'));
  if (!target) {
    console.error('Usage: benchmark:render-md <path.json> [--write]');
    process.exit(1);
  }
  const path = target.startsWith('/') ? target : join(root, target);
  const doc = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const isResult = basename(path).includes('RUN-RESULT');
  const contentHash = isResult
    ? (doc.run as { packContentHash: string }).packContentHash
    : (doc.pack as { contentHash: string }).contentHash;
  const provenance = {
    sourceArtifactId: basename(path),
    schemaVersion: doc.schemaVersion as string,
    contentVersion: isResult
      ? (doc.run as { packVersion: string }).packVersion
      : (doc.pack as { packVersion: string }).packVersion,
    contentHash,
    generatedAt: new Date().toISOString(),
  };
  const md = isResult
    ? renderBenchmarkRunResultMarkdown(doc, provenance)
    : renderBenchmarkPackMarkdown(doc, provenance);
  if (write) {
    writeFileSync(path.replace(/\.json$/, '.md'), md);
    console.log(`Wrote ${path.replace(/\.json$/, '.md')}`);
  } else {
    process.stdout.write(md);
  }
}

main();
