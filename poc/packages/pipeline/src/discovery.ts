import type { RecipeJson } from '@ckes/adapter';
import { normalizeLabel } from '@ckes/adapter';

export interface DiscoveredCandidate {
  candidateType: 'concept' | 'knowledge_object' | 'relationship';
  text: string;
  subject?: string;
  aspect?: string;
  techniqueLabels: string[];
  ingredientLabels: string[];
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

  for (const group of recipe.ingredients ?? []) {
    for (const item of group.items ?? []) {
      const label = item.name?.trim();
      if (!label) continue;
      candidates.push({
        candidateType: 'concept',
        text: label,
        subject: title,
        techniqueLabels: [],
        ingredientLabels: [normalizeLabel(label)],
      });
    }
  }

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
    });
  }

  return dedupeCandidates(candidates);
}

function dedupeCandidates(candidates: DiscoveredCandidate[]): DiscoveredCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = `${c.candidateType}:${normalizeLabel(c.text)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
