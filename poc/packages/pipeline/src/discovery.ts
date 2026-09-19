import type { RecipeJson } from '@ckes/adapter';
import { normalizeLabel } from '@ckes/adapter';

export const DISCOVERY_EXTRACTOR_ID = 'ckes.discovery';
export const DISCOVERY_EXTRACTOR_VERSION = '1.0.0';

export interface DiscoveredCandidate {
  candidateType: 'concept' | 'knowledge_object' | 'relationship';
  text: string;
  subject?: string;
  aspect?: string;
  techniqueLabels: string[];
  ingredientLabels: string[];
  sourcePath: string;
  candidateRole: string;
  occurrenceKey: string;
  contentFingerprint?: string;
}

const TECHNIQUE_PATTERNS = [
  /deep\s*fry/i,
  /pan\s*fry/i,
  /stir[- ]?fry/i,
  /marinat/i,
  /dredg/i,
  /brais/i,
  /roast/i,
  /steam/i,
  /bake/i,
  /simmer/i,
];

export function discoverCandidates(recipe: RecipeJson): DiscoveredCandidate[] {
  const candidates: DiscoveredCandidate[] = [];
  const title = recipe.title ?? 'Untitled';
  const instructionText = recipe.instructions.map((s) => s.text).join(' ');

  let ingredientIndex = 0;
  for (let gi = 0; gi < (recipe.ingredients ?? []).length; gi++) {
    const group = recipe.ingredients![gi];
    for (let ii = 0; ii < (group.items ?? []).length; ii++) {
      const item = group.items![ii];
      const label = item.name?.trim();
      if (!label) continue;
      const path = `recipe.ingredients[${gi}].items[${ii}]`;
      candidates.push({
        candidateType: 'concept',
        text: label,
        subject: title,
        techniqueLabels: [],
        ingredientLabels: [normalizeLabel(label)],
        sourcePath: path,
        candidateRole: 'concept',
        occurrenceKey: String(ingredientIndex++),
        contentFingerprint: normalizeLabel(label),
      });
    }
  }

  let techniqueIndex = 0;
  for (const pattern of TECHNIQUE_PATTERNS) {
    if (pattern.test(instructionText) || pattern.test(title)) {
      const match = instructionText.match(pattern) ?? title.match(pattern);
      const technique = match?.[0] ?? 'technique';
      candidates.push({
        candidateType: 'concept',
        text: technique,
        subject: title,
        techniqueLabels: [normalizeLabel(technique)],
        ingredientLabels: [],
        sourcePath: `recipe.instructions.technique[${techniqueIndex}]`,
        candidateRole: 'concept',
        occurrenceKey: `technique-${techniqueIndex++}`,
        contentFingerprint: normalizeLabel(technique),
      });
    }
  }

  const knowledgeText = [
    recipe.description,
    ...recipe.instructions.map((s) => s.text),
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 2000);

  if (knowledgeText.length > 40) {
    candidates.push({
      candidateType: 'knowledge_object',
      text: knowledgeText,
      subject: title,
      aspect: 'preparation',
      techniqueLabels: [],
      ingredientLabels: [],
      sourcePath: 'recipe.knowledge_object',
      candidateRole: 'knowledge_object',
      occurrenceKey: '0',
      contentFingerprint: normalizeLabel(knowledgeText.slice(0, 256)),
    });
  }

  return dedupeCandidates(candidates);
}

function dedupeCandidates(candidates: DiscoveredCandidate[]): DiscoveredCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = `${c.candidateRole}:${c.sourcePath}:${c.occurrenceKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
