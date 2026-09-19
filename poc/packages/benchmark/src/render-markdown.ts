export const RENDERER_VERSION = '1.0.0';

export type RenderProvenance = {
  sourceArtifactId: string;
  schemaVersion: string;
  contentVersion?: string;
  contentHash: string;
  generatedAt?: string;
};

function headerBlock(provenance: RenderProvenance): string {
  const lines = [
    '> Generated from the referenced JSON artifact. Do not edit directly.',
    '>',
    `> - sourceArtifactId: ${provenance.sourceArtifactId}`,
    `> - schemaVersion: ${provenance.schemaVersion}`,
  ];
  if (provenance.contentVersion) {
    lines.push(`> - contentVersion: ${provenance.contentVersion}`);
  }
  lines.push(`> - contentHash: ${provenance.contentHash}`);
  lines.push(`> - rendererVersion: ${RENDERER_VERSION}`);
  if (provenance.generatedAt) {
    lines.push(`> - generatedAt: ${provenance.generatedAt}`);
  }
  return lines.join('\n');
}

export function renderBenchmarkPackMarkdown(
  pack: Record<string, unknown>,
  provenance: RenderProvenance,
): string {
  const meta = pack.pack as Record<string, unknown>;
  const scenarios = (pack.scenarios ?? []) as Record<string, unknown>[];
  const body = [
    headerBlock(provenance),
    '',
    `# Benchmark pack: ${meta.name}`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| packId | ${meta.packId} |`,
    `| packVersion | ${meta.packVersion} |`,
    `| suiteClass | ${meta.suiteClass} |`,
    `| status | ${meta.status} |`,
    '',
    '## Scenario index',
    '',
    ...scenarios.map(
      (s) =>
        `- **${s.scenarioId}** (${s.status}) — ${s.title} — mode \`${s.executionMode}\``,
    ),
    '',
    '## Scenario appendix (compact)',
    '',
    ...scenarios.map((s) => {
      const text = (s.sourceText as string | undefined)?.slice(0, 200) ?? '(direct candidate)';
      return `### ${s.scenarioId}\n\n${text}\n`;
    }),
  ];
  return body.join('\n');
}

export function renderBenchmarkRunResultMarkdown(
  result: Record<string, unknown>,
  provenance: RenderProvenance,
): string {
  const run = result.run as Record<string, unknown>;
  const aggregates = (result.aggregates ?? {}) as Record<string, unknown>;
  const scenarios = (result.scenarios ?? []) as Record<string, unknown>[];
  const failures = scenarios.filter((s) => s.outcome === 'fail');
  return [
    headerBlock(provenance),
    '',
    `# Benchmark run result`,
    '',
    `| runId | ${run.runId} |`,
    `| runType | ${run.runType} |`,
    `| packId | ${run.packId} |`,
    '',
    '## Aggregates',
    '',
    '```json',
    JSON.stringify(aggregates, null, 2),
    '```',
    '',
    `## Failures (${failures.length})`,
    '',
    ...failures.map((s) => `- ${s.scenarioId}: ${s.outcome}`),
  ].join('\n');
}

/** Strip generatedAt for deterministic CI comparison. */
export function stripNonDeterministicMarkdown(md: string): string {
  return md
    .split('\n')
    .filter((line) => !line.includes('> - generatedAt:'))
    .join('\n');
}
