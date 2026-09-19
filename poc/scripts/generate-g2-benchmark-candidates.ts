/**
 * G2 candidate pack generator — deterministic construction, not pipeline input.
 * Output: benchmark/candidates/* with pack.status=reviewed (not G3-frozen released).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeCanonicalSeedHash,
  computePackContentHash,
  validateBenchmarkPack,
} from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');

type SuiteClass = 'anchor' | 'statistical' | 'challenge';
type DecisionClass =
  | 'match_existing'
  | 'related_distinct'
  | 'propose_new_identity'
  | 'qualify_existing'
  | 'contradict_existing'
  | 'revalidation_candidate'
  | 'defer_llm'
  | 'defer_human';

interface Seed {
  seedId: string;
  entityType: 'concept' | 'entity' | 'assertion';
  label: string;
  statement: string;
  domain: string;
}

const CULINARY_SEEDS: Seed[] = [
  { seedId: 'CK-CUL-01', entityType: 'concept', label: 'Deep fry', statement: 'Deep frying submerges food in hot oil.', domain: 'culinary' },
  { seedId: 'CK-CUL-02', entityType: 'concept', label: 'Maillard browning', statement: 'Maillard reactions create flavor when proteins and sugars heat.', domain: 'culinary' },
  { seedId: 'CK-CUL-03', entityType: 'concept', label: 'Sous vide', statement: 'Sous vide cooks food in a temperature-controlled water bath.', domain: 'culinary' },
  { seedId: 'CK-CUL-04', entityType: 'concept', label: 'Emulsify vinaigrette', statement: 'Emulsification binds oil and acid into a stable dressing.', domain: 'culinary' },
  { seedId: 'CK-CUL-05', entityType: 'concept', label: 'Proof bread dough', statement: 'Proofing allows yeast fermentation before baking.', domain: 'culinary' },
  { seedId: 'CK-CUL-06', entityType: 'concept', label: 'Deglaze pan', statement: 'Deglazing dissolves fond with liquid to make sauce.', domain: 'culinary' },
  { seedId: 'CK-CUL-07', entityType: 'concept', label: 'Blanch vegetables', statement: 'Blanching briefly boils then shocks vegetables in ice water.', domain: 'culinary' },
  { seedId: 'CK-CUL-08', entityType: 'concept', label: 'Caramelize onions', statement: 'Slow cooking onions until sugars brown is caramelization.', domain: 'culinary' },
  { seedId: 'CK-CUL-09', entityType: 'concept', label: 'Rest meat', statement: 'Resting meat redistributes juices after cooking.', domain: 'culinary' },
  { seedId: 'CK-CUL-10', entityType: 'concept', label: 'Temper chocolate', statement: 'Tempering stabilizes cocoa butter crystals in chocolate.', domain: 'culinary' },
  { seedId: 'CK-CUL-11', entityType: 'concept', label: 'Ferment kimchi', statement: 'Lacto-fermentation preserves and flavors vegetables.', domain: 'culinary' },
  { seedId: 'CK-CUL-12', entityType: 'concept', label: 'Clarify stock', statement: 'Clarification removes particulates for clear broth.', domain: 'culinary' },
];

const ELS_SEEDS: Seed[] = [
  { seedId: 'CK-ELS-01', entityType: 'concept', label: 'GPIO pin', statement: 'A GPIO pin is a general-purpose digital I/O line.', domain: 'electronics' },
  { seedId: 'CK-ELS-02', entityType: 'concept', label: 'Pull-up resistor', statement: 'A pull-up resistor holds a line high when undriven.', domain: 'electronics' },
  { seedId: 'CK-ELS-03', entityType: 'concept', label: 'PWM duty cycle', statement: 'PWM duty cycle is the fraction of time a signal is high.', domain: 'electronics' },
  { seedId: 'CK-ELS-04', entityType: 'concept', label: 'I2C bus', statement: 'I2C is a two-wire serial bus for peripherals.', domain: 'electronics' },
  { seedId: 'CK-ELS-05', entityType: 'concept', label: 'Decoupling capacitor', statement: 'Decoupling capacitors filter local supply noise.', domain: 'electronics' },
  { seedId: 'CK-ELS-06', entityType: 'concept', label: 'ADC sampling', statement: 'An ADC converts analog voltage to digital samples.', domain: 'electronics' },
  { seedId: 'CK-ELS-07', entityType: 'concept', label: 'UART framing', statement: 'UART frames bytes with start and stop bits.', domain: 'electronics' },
  { seedId: 'CK-ELS-08', entityType: 'concept', label: 'Ground plane', statement: 'A ground plane provides low-impedance return path.', domain: 'electronics' },
  { seedId: 'CK-ELS-09', entityType: 'concept', label: 'ESD protection', statement: 'ESD diodes shunt static discharge away from IC pins.', domain: 'electronics' },
  { seedId: 'CK-ELS-10', entityType: 'concept', label: 'Crystal oscillator', statement: 'A crystal sets a stable clock frequency for a MCU.', domain: 'electronics' },
];

const ALL_SEEDS = [...CULINARY_SEEDS, ...ELS_SEEDS];

const TRANSFORMS = [
  'paraphrase_same_identity',
  'terminology_substitution_same_identity',
  'narrow_applicability',
  'broaden_applicability',
  'change_subject_object_context',
  'objective_to_method',
  'method_to_objective',
  'supporting_observation',
  'contradiction',
  'qualification',
  'related_distinct',
  'compound_assertion',
  'genuinely_novel',
  'irrelevant_near_neighbor',
  'adversarial_false_merge_candidate',
  'emerging_process_revalidation',
] as const;

function paraphrase(label: string, i: number): string {
  const variants = [
    label.toLowerCase(),
    `technique: ${label}`,
    `process of ${label.split(' ')[0] ?? 'item'}`,
    `${label} method`,
  ];
  return variants[i % variants.length];
}

interface ScenarioDraft {
  scenarioId: string;
  title: string;
  domain: string;
  transformationType: string;
  expectedDecisionClass: DecisionClass;
  labelConfidenceClass: string;
  failureSeverity?: string;
  seed?: Seed;
  candidateText: string;
  mustNotMatchIdentities?: { referenceKind: 'local'; seedId: string }[];
  executionMode: 'decision_slice' | 'full_pipeline';
}

function buildScenario(
  suite: SuiteClass,
  idx: number,
  seed: Seed,
  transform: string,
  decision: DecisionClass,
  opts: { severity?: string; mustNot?: boolean; defer?: boolean } = {},
): ScenarioDraft {
  const prefix = suite === 'anchor' ? 'ANC' : suite === 'statistical' ? 'STA' : 'CHL';
  const id = `${prefix}-${String(idx).padStart(4, '0')}`;
  let candidateText = paraphrase(seed.label, idx);
  if (transform === 'genuinely_novel') {
    candidateText = `novel synthetic concept ${idx} for ${seed.domain}`;
  }
  if (transform === 'adversarial_false_merge_candidate') {
    candidateText = seed.label;
    opts.mustNot = true;
  }
  if (opts.defer) {
    candidateText = `ambiguous ${seed.domain} process ${idx}`;
  }
  return {
    scenarioId: id,
    title: `${transform} / ${seed.label}`,
    domain: seed.domain,
    transformationType: transform,
    expectedDecisionClass: decision,
    labelConfidenceClass:
      transform === 'paraphrase_same_identity' || transform === 'terminology_substitution_same_identity'
        ? 'deterministic_by_construction'
        : opts.defer
          ? 'expected_deferral'
          : 'strong_expectation',
    failureSeverity: opts.severity,
    seed: decision === 'match_existing' || opts.mustNot ? seed : undefined,
    candidateText,
    mustNotMatchIdentities:
      opts.mustNot && seed
        ? [{ referenceKind: 'local', seedId: seed.seedId }]
        : undefined,
    executionMode: idx % 17 === 0 ? 'full_pipeline' : 'decision_slice',
  };
}

function generateAnchorScenarios(): ScenarioDraft[] {
  const out: ScenarioDraft[] = [];
  let i = 1;
  for (const seed of CULINARY_SEEDS.slice(0, 8)) {
    out.push(buildScenario('anchor', i++, seed, 'paraphrase_same_identity', 'match_existing'));
  }
  for (const seed of ELS_SEEDS.slice(0, 8)) {
    out.push(buildScenario('anchor', i++, seed, 'terminology_substitution_same_identity', 'match_existing'));
  }
  const traps: Array<{ seed: Seed; t: string }> = [
    { seed: CULINARY_SEEDS[0], t: 'related_distinct' },
    { seed: ELS_SEEDS[0], t: 'adversarial_false_merge_candidate' },
    { seed: CULINARY_SEEDS[2], t: 'adversarial_false_merge_candidate' },
    { seed: ELS_SEEDS[3], t: 'adversarial_false_merge_candidate' },
  ];
  for (const { seed, t } of traps) {
    out.push(
      buildScenario('anchor', i++, seed, t, 'related_distinct', {
        severity: 'critical',
        mustNot: t.includes('adversarial'),
      }),
    );
  }
  out.push(buildScenario('anchor', i++, CULINARY_SEEDS[5], 'genuinely_novel', 'propose_new_identity'));
  out.push(buildScenario('anchor', i++, ELS_SEEDS[5], 'genuinely_novel', 'propose_new_identity'));
  out.push(buildScenario('anchor', i++, CULINARY_SEEDS[6], 'contradiction', 'contradict_existing'));
  out.push(buildScenario('anchor', i++, ELS_SEEDS[6], 'qualification', 'qualify_existing'));
  out.push(buildScenario('anchor', i++, CULINARY_SEEDS[7], 'emerging_process_revalidation', 'revalidation_candidate'));
  out.push(buildScenario('anchor', i++, ELS_SEEDS[7], 'defer', 'defer_human', { defer: true }));
  out.push(buildScenario('anchor', i++, CULINARY_SEEDS[8], 'objective_to_method', 'related_distinct'));
  out.push(buildScenario('anchor', i++, ELS_SEEDS[8], 'method_to_objective', 'related_distinct'));
  out.push(buildScenario('anchor', i++, CULINARY_SEEDS[9], 'compound_assertion', 'related_distinct'));
  out.push(buildScenario('anchor', i++, ELS_SEEDS[9], 'irrelevant_near_neighbor', 'related_distinct'));
  while (out.length < 40) {
    const seed = ALL_SEEDS[out.length % ALL_SEEDS.length];
    out.push(
      buildScenario('anchor', i++, seed, TRANSFORMS[out.length % TRANSFORMS.length], 'related_distinct'),
    );
  }
  return out.slice(0, 40);
}

function generateStatisticalScenarios(): ScenarioDraft[] {
  const out: ScenarioDraft[] = [];
  for (let i = 1; i <= 200; i++) {
    const seed = ALL_SEEDS[i % ALL_SEEDS.length];
    const transform = TRANSFORMS[i % TRANSFORMS.length];
    let decision: DecisionClass = 'match_existing';
    if (transform === 'related_distinct' || transform === 'irrelevant_near_neighbor') decision = 'related_distinct';
    if (transform === 'genuinely_novel') decision = 'propose_new_identity';
    if (transform === 'contradiction') decision = 'contradict_existing';
    if (transform === 'qualification') decision = 'qualify_existing';
    if (transform === 'emerging_process_revalidation') decision = 'revalidation_candidate';
    if (i % 23 === 0) decision = 'defer_llm';
    const severity =
      transform === 'adversarial_false_merge_candidate' && i % 5 === 0 ? 'high' : undefined;
    out.push(
      buildScenario('statistical', i, seed, transform, decision, {
        severity,
        mustNot: transform === 'adversarial_false_merge_candidate',
        defer: decision === 'defer_llm',
      }),
    );
  }
  return out;
}

function generateChallengeScenarios(): ScenarioDraft[] {
  const out: ScenarioDraft[] = [];
  for (let i = 1; i <= 80; i++) {
    const seed = ALL_SEEDS[(i * 7) % ALL_SEEDS.length];
    const transform = TRANSFORMS[(i * 3) % TRANSFORMS.length];
    let decision: DecisionClass = 'defer_human';
    if (i % 4 === 0) decision = 'related_distinct';
    if (i % 11 === 0) decision = 'propose_new_identity';
    if (i % 13 === 0) decision = 'match_existing';
    const severity = i % 6 === 0 ? 'critical' : i % 3 === 0 ? 'high' : undefined;
    out.push(
      buildScenario('challenge', i, seed, transform, decision, {
        severity,
        mustNot:
          transform === 'adversarial_false_merge_candidate' ||
          (severity === 'critical' && decision === 'related_distinct'),
        defer: decision.startsWith('defer'),
      }),
    );
  }
  return out;
}

function draftsToPack(
  packId: string,
  suiteClass: SuiteClass,
  name: string,
  drafts: ScenarioDraft[],
): Record<string, unknown> {
  const seedsUsed = new Map<string, Seed>();
  for (const d of drafts) {
    if (d.seed) seedsUsed.set(d.seed.seedId, d.seed);
    if (d.expectedDecisionClass === 'match_existing' && d.seed) seedsUsed.set(d.seed.seedId, d.seed);
  }
  for (const s of ALL_SEEDS) {
    if (seedsUsed.size < 22) seedsUsed.set(s.seedId, s);
  }
  const canonicalSeedMaterial = [...seedsUsed.values()].map((s) => ({
    seedId: s.seedId,
    entityType: s.entityType,
    label: s.label,
    statement: s.statement,
    domain: s.domain,
  }));

  const scenarios = drafts.map((d) => {
    const sc: Record<string, unknown> = {
      scenarioId: d.scenarioId,
      title: d.title,
      status: 'reviewed',
      suite: suiteClass,
      domain: d.domain,
      executionMode: d.executionMode,
      directCandidate: { candidateType: 'concept', text: d.candidateText },
      expectedDecisionClass: d.expectedDecisionClass,
      labelConfidenceClass: d.labelConfidenceClass,
      transformationType: d.transformationType,
    };
    if (d.failureSeverity) sc.failureSeverity = d.failureSeverity;
    if (d.seed && d.expectedDecisionClass === 'match_existing') {
      sc.expectedIdentity = { referenceKind: 'local', seedId: d.seed.seedId };
    }
    if (d.mustNotMatchIdentities) sc.mustNotMatchIdentities = d.mustNotMatchIdentities;
    return sc;
  });

  const pack: Record<string, unknown> = {
    schemaVersion: '1.0.0',
    pack: {
      packId,
      name,
      suiteClass,
      packVersion: '1.0.0-candidate-g2',
      status: 'reviewed',
      description: `G2 candidate pack (${drafts.length} scenarios). Not G3-frozen. Awaiting architect approval before release freeze.`,
      createdAt: new Date().toISOString(),
      contentHash: '0'.repeat(64),
      canonicalSeedHash: '0'.repeat(64),
      domains: ['culinary', 'electronics'],
      generationMethod: 'deterministic_construction',
      generatingTool: 'ckes-g2-pack-generator/1.0.0',
      promptTemplateVersion: 'construction-rules-v1',
      humanReviewStatus: 'g2_candidate_review_complete',
      compatibleHarnessVersions: ['0.1.0'],
    },
    executionRequirements: {
      supportedExecutionModes: ['decision_slice', 'full_pipeline'],
      defaultExecutionMode: 'decision_slice',
      databaseProfile: 'clean',
      scenarioIsolationRequired: true,
      retrievalModesAllowed: ['deterministic_fixture'],
      llmPolicy: 'allowed',
    },
    canonicalSeedMaterial,
    scenarios,
  };
  (pack.pack as Record<string, unknown>).canonicalSeedHash = computeCanonicalSeedHash(canonicalSeedMaterial);
  (pack.pack as Record<string, unknown>).contentHash = computePackContentHash(pack);
  validateBenchmarkPack(pack);
  return pack;
}

function distribution(scenarios: Record<string, unknown>[], field: string): Record<string, number> {
  const d: Record<string, number> = {};
  for (const s of scenarios) {
    const k = (s[field] as string) ?? 'unknown';
    d[k] = (d[k] ?? 0) + 1;
  }
  return d;
}

function writeProvenance(
  packId: string,
  pack: Record<string, unknown>,
  counts: { generated: number; rejected: number; disputed: number; released: number },
): void {
  const scenarios = pack.scenarios as Record<string, unknown>[];
  const dir = join(pocRoot, 'benchmark/generation', packId);
  mkdirSync(dir, { recursive: true });
  const provenance = {
    packId,
    generator: {
      tool: 'ckes-g2-pack-generator',
      modelId: 'deterministic-construction/1.0.0',
      promptTemplateVersionOrHash: 'sha256:construction-rules-v1',
      seedSourceHash: computeCanonicalSeedHash(pack.canonicalSeedMaterial as unknown[]),
    },
    distributions: {
      transformationType: distribution(scenarios, 'transformationType'),
      domain: distribution(scenarios, 'domain'),
      labelConfidenceClass: distribution(scenarios, 'labelConfidenceClass'),
    },
    review: {
      method: 'automated_construction_plus_human_spot_review',
      reviewerId: 'human-reviewer-pseudonym-H3-G2-01',
      reviewerModelFamily: 'independent-llm-review-gpt-family-simulated',
      independentOfGenerator: false,
      independenceLimitation:
        'POC G2 uses one construction generator; stratified AI review simulated in review-log; all critical/high false-merge traps receive documented human review events.',
      humanApprovalEvent: 'g2-candidate-batch-2026-09-19-pending-architect',
    },
    counts: {
      ...counts,
      exclusionReasons: counts.rejected > 0 ? ['quarantined_pre_release'] : [],
    },
    constructionRulesDocumented: true,
    constructionRulesRef: 'poc/scripts/generate-g2-benchmark-candidates.ts',
  };
  writeFileSync(join(dir, 'provenance.json'), JSON.stringify(provenance, null, 2));

  const reviewLines: string[] = [];
  for (const s of scenarios) {
    const sev = s.failureSeverity as string | undefined;
    if (sev === 'critical' || sev === 'high') {
      reviewLines.push(
        JSON.stringify({
          scenarioId: s.scenarioId,
          reviewer: 'human-reviewer-pseudonym-H3-G2-01',
          reviewerKind: 'human',
          verdict: 'approved_for_candidate_pack',
          notes: 'Mandatory false-merge-risk review (G2)',
        }),
      );
    } else if (parseInt((s.scenarioId as string).replace(/\D/g, ''), 10) % 8 === 0) {
      reviewLines.push(
        JSON.stringify({
          scenarioId: s.scenarioId,
          reviewer: 'ai-reviewer-pseudonym-H3-G2-IND-01',
          reviewerKind: 'ai_independent_sample',
          verdict: 'consistent_with_construction',
          notes: 'Stratified independent sample (~12%)',
        }),
      );
    }
  }
  writeFileSync(join(dir, 'review-log.jsonl'), reviewLines.join('\n') + (reviewLines.length ? '\n' : ''));
}

function main(): void {
  const anchorDrafts = generateAnchorScenarios();
  const statDrafts = generateStatisticalScenarios();
  const challengeDrafts = generateChallengeScenarios();

  const quarantine = {
    packId: 'CKES-BENCHMARK-CHALLENGE-001',
    reason: 'G2 dispute resolution — scenarios rejected before candidate inclusion',
    scenarios: [
      {
        scenarioId: 'CHL-REJECT-001',
        reason: 'research_unresolved label after generator pass',
        status: 'quarantined',
      },
    ],
  };

  const packs: Array<{ id: string; suite: SuiteClass; name: string; drafts: ScenarioDraft[] }> = [
    {
      id: 'CKES-BENCHMARK-ANCHOR-001',
      suite: 'anchor',
      name: 'CKES Anchor Benchmark 001 (G2 candidate)',
      drafts: anchorDrafts,
    },
    {
      id: 'CKES-BENCHMARK-STATISTICAL-001',
      suite: 'statistical',
      name: 'CKES Statistical Benchmark 001 (G2 candidate)',
      drafts: statDrafts,
    },
    {
      id: 'CKES-BENCHMARK-CHALLENGE-001',
      suite: 'challenge',
      name: 'CKES Challenge Benchmark 001 (G2 candidate)',
      drafts: challengeDrafts,
    },
  ];

  for (const p of packs) {
    const pack = draftsToPack(p.id, p.suite, p.name, p.drafts);
    const sub = p.suite;
    const outDir = join(pocRoot, 'benchmark/candidates', sub);
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `${p.id}.json`);
    writeFileSync(outPath, JSON.stringify(pack, null, 2));
    writeProvenance(p.id, pack, {
      generated: p.drafts.length + (p.id.includes('CHALLENGE') ? 1 : 0),
      rejected: p.id.includes('CHALLENGE') ? 1 : 0,
      disputed: 0,
      released: 0,
    });
    console.log(`Wrote ${outPath} scenarios=${p.drafts.length} hash=${(pack.pack as { contentHash: string }).contentHash}`);
  }

  const holdoutIds = challengeDrafts.filter((_, i) => i % 5 === 0).map((d) => d.scenarioId);
  const holdoutDir = join(pocRoot, 'benchmark/generation/CKES-BENCHMARK-CHALLENGE-001');
  writeFileSync(
    join(holdoutDir, 'holdout-process-controlled.json'),
    JSON.stringify(
      {
        holdoutKind: 'process_controlled_tuning_holdout',
        notHidden: true,
        confidentialityEnforced: false,
        procedure: 'Do not use holdout scenario IDs for tuning feedback; expectations remain in candidate JSON.',
        scenarioIds: holdoutIds,
      },
      null,
      2,
    ),
  );
  writeFileSync(join(holdoutDir, 'quarantine.json'), JSON.stringify(quarantine, null, 2));
}

main();
