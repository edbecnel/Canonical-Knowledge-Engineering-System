import { collectForbiddenKeys } from './forbidden-keys.js';

const BROWSER_SCENARIO_ALLOWLIST = [
  'scenarioId',
  'title',
  'status',
  'suite',
  'domain',
  'subdomain',
  'executionMode',
  'sourceText',
  'directCandidate',
  'candidateType',
] as const;

export type BrowserScenarioView = Record<string, unknown>;

export function toBrowserScenarioView(scenario: Record<string, unknown>): BrowserScenarioView {
  const out: Record<string, unknown> = {};
  for (const key of BROWSER_SCENARIO_ALLOWLIST) {
    if (key in scenario) out[key] = scenario[key];
  }
  const forbidden = collectForbiddenKeys(out);
  if (forbidden.length > 0) {
    throw new Error(`Browser projection leaked forbidden keys: ${forbidden.join(', ')}`);
  }
  return out;
}

export function toBrowserPackView(pack: Record<string, unknown>): Record<string, unknown> {
  const meta = pack.pack as Record<string, unknown>;
  const scenarios = (pack.scenarios as Record<string, unknown>[]).map(toBrowserScenarioView);
  return {
    schemaVersion: pack.schemaVersion,
    pack: {
      packId: meta.packId,
      name: meta.name,
      suiteClass: meta.suiteClass,
      packVersion: meta.packVersion,
      status: meta.status,
      description: meta.description,
      domains: meta.domains,
      contentHash: meta.contentHash,
    },
    executionRequirements: pack.executionRequirements,
    scenarioCount: scenarios.length,
    scenarios,
  };
}
