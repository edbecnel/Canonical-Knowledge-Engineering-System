import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDecisionOutcomeSeparation, PACK_STATUSES } from './enums.js';
import { assertPackContentHash } from './hash.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaRoot = join(__dirname, '../../../benchmark/schemas');

const SUPPORTED_PACK_SCHEMA_VERSIONS = new Set(['1.0.0']);
const SUPPORTED_RESULT_SCHEMA_VERSIONS = new Set(['1.0.0']);
const SUPPORTED_PROFILE_SCHEMA_VERSIONS = new Set(['1.0.0']);

function loadSchema(name: string): object {
  return JSON.parse(readFileSync(join(schemaRoot, name), 'utf8')) as object;
}

function createValidator(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateSchema: false });
  addFormats(ajv);
  ajv.addSchema(loadSchema('benchmark-pack.schema.json'));
  ajv.addSchema(loadSchema('benchmark-run-result.schema.json'));
  ajv.addSchema(loadSchema('benchmark-run-profile.schema.json'));
  return ajv;
}

let cachedAjv: Ajv2020 | undefined;

export function getAjv(): Ajv2020 {
  if (!cachedAjv) cachedAjv = createValidator();
  return cachedAjv;
}

export function validateBenchmarkPack(doc: Record<string, unknown>): void {
  const version = doc.schemaVersion as string;
  if (!SUPPORTED_PACK_SCHEMA_VERSIONS.has(version)) {
    throw new Error(`Unsupported pack schemaVersion: ${version}`);
  }
  const ajv = getAjv();
  const validate = ajv.getSchema('https://ckes.local/schemas/benchmark-pack.schema.json');
  if (!validate) throw new Error('Pack schema not loaded');
  if (!validate(doc)) {
    throw new Error(`Invalid benchmark pack: ${ajv.errorsText(validate.errors)}`);
  }
  validatePackSemantics(doc);
  assertPackContentHash(doc);
}

export function validateBenchmarkRunResult(doc: Record<string, unknown>): void {
  const version = doc.schemaVersion as string;
  if (!SUPPORTED_RESULT_SCHEMA_VERSIONS.has(version)) {
    throw new Error(`Unsupported result schemaVersion: ${version}`);
  }
  const ajv = getAjv();
  const validate = ajv.getSchema('https://ckes.local/schemas/benchmark-run-result.schema.json');
  if (!validate) throw new Error('Result schema not loaded');
  if (!validate(doc)) {
    throw new Error(`Invalid benchmark run result: ${ajv.errorsText(validate.errors)}`);
  }
}

export function validateBenchmarkRunProfile(doc: Record<string, unknown>): void {
  const version = doc.schemaVersion as string;
  if (!SUPPORTED_PROFILE_SCHEMA_VERSIONS.has(version)) {
    throw new Error(`Unsupported profile schemaVersion: ${version}`);
  }
  const ajv = getAjv();
  const validate = ajv.getSchema('https://ckes.local/schemas/benchmark-run-profile.schema.json');
  if (!validate) throw new Error('Profile schema not loaded');
  if (!validate(doc)) {
    throw new Error(`Invalid benchmark run profile: ${ajv.errorsText(validate.errors)}`);
  }
}

function validatePackSemantics(doc: Record<string, unknown>): void {
  const scenarios = doc.scenarios as Record<string, unknown>[];
  const pack = doc.pack as Record<string, unknown>;
  const packStatus = pack.status as string;
  const seedMaterial = (doc.canonicalSeedMaterial ?? []) as Record<string, unknown>[];
  const seedIds = new Set(seedMaterial.map((s) => s.seedId as string));

  const scenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    const id = scenario.scenarioId as string;
    if (scenarioIds.has(id)) {
      throw new Error(`Duplicate scenarioId: ${id}`);
    }
    scenarioIds.add(id);

    assertDecisionOutcomeSeparation(scenario.expectedDecisionClass as string | undefined);

    const expectedIdentity = scenario.expectedIdentity as Record<string, unknown> | undefined;
    if (expectedIdentity?.referenceKind === 'local' && expectedIdentity.seedId) {
      const sid = expectedIdentity.seedId as string;
      if (!seedIds.has(sid)) {
        throw new Error(`Dangling local expectedIdentity seedId: ${sid} in scenario ${id}`);
      }
    }

    for (const rel of (scenario.relatedIdentities ?? []) as Record<string, unknown>[]) {
      if (rel.referenceKind === 'local' && rel.seedId && !seedIds.has(rel.seedId as string)) {
        throw new Error(`Dangling relatedIdentity seedId: ${rel.seedId} in scenario ${id}`);
      }
    }
    for (const ban of (scenario.mustNotMatchIdentities ?? []) as Record<string, unknown>[]) {
      if (ban.referenceKind === 'local' && ban.seedId && !seedIds.has(ban.seedId as string)) {
        throw new Error(`Dangling mustNotMatch seedId: ${ban.seedId} in scenario ${id}`);
      }
    }
  }

  const unresolvedLabels = new Set(['human_review_required', 'research_unresolved']);
  if (packStatus === 'released') {
    for (const scenario of scenarios) {
      const st = scenario.status as string;
      const sid = scenario.scenarioId as string;
      if (st === 'draft' || st === 'reviewed') {
        throw new Error(`Released pack cannot contain non-released scenario ${sid} (status=${st})`);
      }
      if (st === 'released' && unresolvedLabels.has(scenario.labelConfidenceClass as string)) {
        throw new Error(`Released pack cannot contain unresolved label on scenario ${sid}`);
      }
    }
  }

  if (packStatus === 'draft' && scenarios.some((s) => s.status === 'released')) {
    throw new Error('Invalid status: draft pack with released scenario without pack promotion');
  }
}

export function isScenarioScoreEligible(
  packStatus: string,
  scenarioStatus: string,
): 'official' | 'qualification' | 'none' {
  if (scenarioStatus === 'draft' || packStatus === 'draft') return 'none';
  if (scenarioStatus === 'retired' || packStatus === 'retired') return 'none';
  if (packStatus === 'reviewed' || scenarioStatus === 'reviewed') return 'qualification';
  if (packStatus === 'released' && scenarioStatus === 'released') return 'official';
  return 'none';
}

export function assertValidStatusTransition(from: string, to: string): void {
  const allowed: Record<string, string[]> = {
    draft: ['reviewed', 'retired'],
    reviewed: ['released', 'draft', 'retired'],
    released: ['retired'],
    retired: [],
  };
  if (!(PACK_STATUSES as readonly string[]).includes(from) || !(PACK_STATUSES as readonly string[]).includes(to)) {
    throw new Error(`Invalid status value: ${from} -> ${to}`);
  }
  if (from === 'released' && to === 'draft') {
    throw new Error('Invalid transition: released -> draft requires new packVersion');
  }
  if (!allowed[from]?.includes(to) && from !== to) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}
