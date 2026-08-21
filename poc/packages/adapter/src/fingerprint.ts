import { createHash } from 'node:crypto';
import type { RecipeJson } from './types.js';

export function canonicalRecipeSubset(recipe: RecipeJson): Record<string, unknown> {
  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  };
}

export function contentFingerprint(recipe: RecipeJson): string {
  const normalized = JSON.stringify(canonicalRecipeSubset(recipe));
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b(pieces|chopped|diced|fresh|dried|whole|boneless|skinless)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
