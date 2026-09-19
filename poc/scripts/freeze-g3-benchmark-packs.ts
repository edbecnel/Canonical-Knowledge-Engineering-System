/**
 * G3: Promote architect-approved G2 candidates to frozen releases (metadata/status only).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computePackContentHash,
  renderBenchmarkPackMarkdown,
  validateBenchmarkPack,
  qualifyBenchmarkPack,
} from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');

const PACKS: Array<{ suite: string; file: string; name: string }> = [
  {
    suite: 'anchor',
    file: 'CKES-BENCHMARK-ANCHOR-001.json',
    name: 'CKES Anchor Benchmark 001',
  },
  {
    suite: 'statistical',
    file: 'CKES-BENCHMARK-STATISTICAL-001.json',
    name: 'CKES Statistical Benchmark 001',
  },
  {
    suite: 'challenge',
    file: 'CKES-BENCHMARK-CHALLENGE-001.json',
    name: 'CKES Challenge Benchmark 001',
  },
];

const FROZEN_AT = '2026-09-19T12:00:00.000Z';
const MD_GENERATED_AT = '2026-09-19T12:00:00.000Z';

function freezePack(candidate: Record<string, unknown>, officialName: string): Record<string, unknown> {
  const frozen = structuredClone(candidate) as Record<string, unknown>;
  const pack = frozen.pack as Record<string, unknown>;
  pack.status = 'released';
  pack.packVersion = '1.0.0';
  pack.name = officialName;
  pack.description =
    'Official frozen benchmark release (Handover 3 G3). Immutable for scored runs; corrections require new packVersion.';
  pack.humanReviewStatus = 'g3_frozen_released';
  delete pack.contentHash;
  const scenarios = frozen.scenarios as Record<string, unknown>[];
  for (const s of scenarios) {
    if (s.status !== 'reviewed' && s.status !== 'released') {
      throw new Error(`Unexpected scenario status ${s.scenarioId}: ${s.status}`);
    }
    s.status = 'released';
  }
  pack.contentHash = computePackContentHash(frozen);
  validateBenchmarkPack(frozen);
  return frozen;
}

function main(): void {
  const manifest: Record<string, unknown> = {
    schemaVersion: '1.0.0',
    gate: 'G3',
    frozenAt: FROZEN_AT,
    packs: [] as unknown[],
  };

  for (const p of PACKS) {
    const candidatePath = join(pocRoot, 'benchmark/candidates', p.suite, p.file);
    const releaseDir = join(pocRoot, 'benchmark/releases', p.suite);
    mkdirSync(releaseDir, { recursive: true });
    const candidate = JSON.parse(readFileSync(candidatePath, 'utf8')) as Record<string, unknown>;
    const frozen = freezePack(candidate, p.name);
    const releaseJson = join(releaseDir, p.file);
    writeFileSync(releaseJson, JSON.stringify(frozen, null, 2));

    const packMeta = frozen.pack as Record<string, unknown>;
    const md = renderBenchmarkPackMarkdown(frozen, {
      sourceArtifactId: p.file,
      schemaVersion: frozen.schemaVersion as string,
      contentVersion: packMeta.packVersion as string,
      contentHash: packMeta.contentHash as string,
      generatedAt: MD_GENERATED_AT,
    });
    const releaseMd = join(releaseDir, p.file.replace('.json', '.md'));
    writeFileSync(releaseMd, md);

    const genDir = join(pocRoot, 'benchmark/generation', p.file.replace('.json', ''));
    mkdirSync(genDir, { recursive: true });
    const provPath = join(genDir, 'provenance.json');
    const provenance = JSON.parse(readFileSync(provPath, 'utf8')) as Record<string, unknown>;
    const review = (provenance.review ?? {}) as Record<string, unknown>;
    review.humanApprovalEvent = 'g2-architect-accepted-2026-09-19';
    review.g3FreezeAt = FROZEN_AT;
    provenance.review = review;
    provenance.g3OfficialRelease = {
      releasePath: `benchmark/releases/${p.suite}/${p.file}`,
      contentHash: packMeta.contentHash,
      packVersion: packMeta.packVersion,
      releasedScenarioCount: (frozen.scenarios as unknown[]).length,
    };
    writeFileSync(provPath, JSON.stringify(provenance, null, 2));

    writeFileSync(
      join(genDir, 'g3-freeze-record.json'),
      JSON.stringify(
        {
          packId: packMeta.packId,
          packVersion: packMeta.packVersion,
          contentHash: packMeta.contentHash,
          canonicalSeedHash: packMeta.canonicalSeedHash,
          candidateSource: `benchmark/candidates/${p.suite}/${p.file}`,
          candidateContentHash: (candidate.pack as { contentHash: string }).contentHash,
        },
        null,
        2,
      ),
    );

    const q = qualifyBenchmarkPack(frozen, {
      mode: 'freeze',
      provenancePath: provPath,
      packRoot: pocRoot,
    });
    if (!q.passed || !q.freezeReady) {
      console.error('Freeze qualification failed', p.file, q);
      process.exit(1);
    }

    (manifest.packs as unknown[]).push({
      packId: packMeta.packId,
      packVersion: packMeta.packVersion,
      contentHash: packMeta.contentHash,
      canonicalSeedHash: packMeta.canonicalSeedHash,
      releasedScenarios: (frozen.scenarios as unknown[]).length,
      jsonPath: `benchmark/releases/${p.suite}/${p.file}`,
      mdPath: `benchmark/releases/${p.suite}/${p.file.replace('.json', '.md')}`,
    });
    console.log(`Frozen ${packMeta.packId} hash=${packMeta.contentHash}`);
  }

  writeFileSync(
    join(pocRoot, 'benchmark/releases/G3-FREEZE-MANIFEST.json'),
    JSON.stringify(manifest, null, 2),
  );
}

main();
