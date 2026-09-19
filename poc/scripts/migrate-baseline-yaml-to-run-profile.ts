import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { validateBenchmarkRunProfile } from '@ckes/benchmark';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function main(): void {
  const yamlPath =
    process.argv[2] ?? join(root, 'experiments/baselines/CKES-PAR-baseline-anchors-2026-09-19.yaml');
  const outPath =
    process.argv[3] ?? join(root, 'experiments/run-profiles/CKES-BENCHMARK-RUN-PROFILE-001.json');

  if (!existsSync(yamlPath)) {
    console.error(`YAML not found: ${yamlPath}`);
    process.exit(1);
  }

  const raw = parse(readFileSync(yamlPath, 'utf8')) as Record<string, unknown>;
  const anchors = raw.anchors as Record<string, unknown>;
  const profile = {
    schemaVersion: '1.0.0',
    profileId: 'CKES-BENCHMARK-RUN-PROFILE-001',
    description:
      'Run configuration migrated from legacy YAML baseline anchors (not a reference baseline).',
    recordedDate: raw.recorded_date ?? raw.recordedDate,
    anchors: {
      gitCommit: anchors.git_commit ?? anchors.gitCommit,
      corpusManifest: anchors.corpus_manifest ?? anchors.corpusManifest,
      corpusId: anchors.corpus_id ?? anchors.corpusId,
      generationSeed: anchors.generation_seed ?? anchors.generationSeed,
      corpusStage: anchors.corpus_stage ?? anchors.corpusStage,
      policyFile: anchors.policy_file ?? anchors.policyFile,
      policyVersion: anchors.policy_version ?? anchors.policyVersion,
      openaiMode: anchors.openai_mode ?? anchors.openaiMode,
      openaiModeDetail: anchors.openai_mode_detail ?? anchors.openaiModeDetail,
    },
    databaseProfile: 'clean',
    commands: raw.commands,
    relatedDocs: raw.related_docs ?? raw.relatedDocs,
  };

  validateBenchmarkRunProfile(profile as Record<string, unknown>);
  const payload = JSON.stringify(profile, null, 2) + '\n';
  if (existsSync(outPath) && readFileSync(outPath, 'utf8') === payload) {
    console.log('Profile already up to date (idempotent).');
    return;
  }
  writeFileSync(outPath, payload);
  console.log(`Wrote ${outPath}`);
}

main();
