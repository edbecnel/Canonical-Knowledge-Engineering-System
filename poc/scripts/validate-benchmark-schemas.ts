import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertPackContentHash,
  stripNonDeterministicMarkdown,
  renderBenchmarkPackMarkdown,
  validateBenchmarkPack,
  validateBenchmarkRunProfile,
  validateBenchmarkRunResult,
} from '@ckes/benchmark';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function load(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, rel), 'utf8')) as Record<string, unknown>;
}

function main(): void {
  const examplesDir = join(root, 'benchmark/examples');
  const exampleDirs = [examplesDir, join(root, 'benchmark/fixtures')];
  const jsonFiles = exampleDirs.flatMap((dir) =>
    readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ dir, file: f })),
  );
  for (const { dir, file } of jsonFiles) {
    const relDir = dir.endsWith('fixtures') ? 'benchmark/fixtures' : 'benchmark/examples';
    const doc = load(`${relDir}/${file}`);
    if (file.includes('RUN-RESULT')) {
      validateBenchmarkRunResult(doc);
      console.log(`OK result: ${file}`);
    } else {
      validateBenchmarkPack(doc);
      console.log(`OK pack: ${file}`);
    }
  }

  const vectors = load('benchmark/schemas/hash-test-vectors/expected-hashes.json');
  for (const vector of vectors.vectors as { file: string; contentHash: string }[]) {
    const pack = load(`benchmark/schemas/hash-test-vectors/${vector.file}`);
    assertPackContentHash(pack);
    const hash = (pack.pack as { contentHash: string }).contentHash;
    if (hash !== vector.contentHash) {
      throw new Error(`Hash vector mismatch for ${vector.file}`);
    }
    console.log(`OK hash vector: ${vector.file}`);
  }

  const profilesDir = join(root, 'experiments/run-profiles');
  for (const file of readdirSync(profilesDir).filter((f) => f.endsWith('.json'))) {
    validateBenchmarkRunProfile(load(`experiments/run-profiles/${file}`));
    console.log(`OK profile: ${file}`);
  }

  const pack = load('benchmark/examples/CKES-EXAMPLE-PACK-001.json');
  const mdPath = join(examplesDir, 'CKES-EXAMPLE-PACK-001.md');
  const rendered = renderBenchmarkPackMarkdown(pack, {
    sourceArtifactId: 'CKES-EXAMPLE-PACK-001.json',
    schemaVersion: pack.schemaVersion as string,
    contentVersion: (pack.pack as { packVersion: string }).packVersion,
    contentHash: (pack.pack as { contentHash: string }).contentHash,
    generatedAt: new Date().toISOString(),
  });
  const expected = readFileSync(mdPath, 'utf8');
  const norm = (s: string) => stripNonDeterministicMarkdown(s).trim();
  if (norm(rendered) !== norm(expected)) {
    throw new Error('Derived Markdown drift: run npm run benchmark:render-md -- --write');
  }
  console.log('OK derived Markdown matches committed example');

  const releaseSuites = ['anchor', 'statistical', 'challenge'];
  const mdAt = '2026-09-19T12:00:00.000Z';
  for (const suite of releaseSuites) {
    const relDir = join(root, 'benchmark/releases', suite);
    for (const file of readdirSync(relDir).filter((f) => f.endsWith('.json'))) {
      const doc = load(`benchmark/releases/${suite}/${file}`);
      validateBenchmarkPack(doc);
      console.log(`OK release pack: ${suite}/${file}`);
      const mdPath = join(relDir, file.replace('.json', '.md'));
      const rendered = renderBenchmarkPackMarkdown(doc, {
        sourceArtifactId: file,
        schemaVersion: doc.schemaVersion as string,
        contentVersion: (doc.pack as { packVersion: string }).packVersion,
        contentHash: (doc.pack as { contentHash: string }).contentHash,
        generatedAt: mdAt,
      });
      const expected = readFileSync(mdPath, 'utf8');
      const norm = (s: string) => stripNonDeterministicMarkdown(s).trim();
      if (norm(rendered) !== norm(expected)) {
        throw new Error(`Release Markdown drift: ${suite}/${file}`);
      }
      console.log(`OK release Markdown: ${suite}/${file}`);
    }
  }
}

main();
