import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { contentFingerprint, type RecipeJson } from '@ckes/adapter';
import type { CorpusManifest, ExpectedRelationship, FamilySpec } from './manifest.js';
import {
  recordEvaluatorCandidateGroundTruth,
  recordLegacyRecipeGroundTruth,
  syncEvaluatorRelationshipFromRecipeGt,
} from './evaluator-ground-truth.js';

const FAMILY_TEMPLATES: Record<string, { title: string; ingredients: string[]; instructions: string[] }> = {
  FriedChicken: {
    title: 'Classic Fried Chicken',
    ingredients: ['chicken pieces', 'buttermilk', 'all-purpose flour', 'salt', 'black pepper', 'paprika'],
    instructions: [
      'Marinate chicken in buttermilk for 4 hours.',
      'Mix flour with salt, pepper, and paprika.',
      'Dredge chicken in flour mixture.',
      'Deep fry at 350°F until golden and cooked through.',
    ],
  },
  Gumbo: {
    title: 'Chicken and Sausage Gumbo',
    ingredients: ['chicken thighs', 'andouille sausage', 'flour', 'oil', 'onion', 'celery', 'bell pepper', 'chicken stock'],
    instructions: [
      'Make a dark roux with flour and oil.',
      'Add the holy trinity and cook until soft.',
      'Add stock and simmer.',
      'Add chicken and sausage; simmer until tender.',
    ],
  },
  Bread: {
    title: 'Simple White Bread',
    ingredients: ['bread flour', 'yeast', 'water', 'salt', 'sugar', 'butter'],
    instructions: [
      'Combine ingredients and knead until smooth.',
      'Proof until doubled.',
      'Shape loaf and bake at 375°F until golden.',
    ],
  },
  Sauces: {
    title: 'Basic Béchamel',
    ingredients: ['butter', 'flour', 'milk', 'salt', 'nutmeg'],
    instructions: [
      'Melt butter and whisk in flour to make a roux.',
      'Gradually add warm milk.',
      'Simmer until thickened; season with salt and nutmeg.',
    ],
  },
  Stocks: {
    title: 'Chicken Stock',
    ingredients: ['chicken bones', 'onion', 'carrot', 'celery', 'bay leaf', 'peppercorns'],
    instructions: [
      'Cover bones and aromatics with water.',
      'Simmer gently for 3-4 hours.',
      'Strain and cool.',
    ],
  },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildRecipe(
  base: typeof FAMILY_TEMPLATES[string],
  family: string,
  variant: string,
  index: number,
  mutate?: (r: RecipeJson) => RecipeJson,
): RecipeJson {
  const id = uuidv4();
  const recipe: RecipeJson = {
    schemaVersion: '1.10',
    id,
    title: `${base.title} (${family} ${variant} ${index})`,
    description: `Synthetic ${family} recipe for CKES POC.`,
    servings: 4,
    ingredients: [{ group: 'main', items: base.ingredients.map((name) => ({ name, quantity: 1, unit: 'each' })) }],
    instructions: base.instructions.map((text, i) => ({ step: i + 1, text })),
    meta: {
      source: 'synthetic',
      synthetic: true,
      pocMarkers: ['POC', 'SYNTHETIC', 'NON-AUTHORITATIVE'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return mutate ? mutate(recipe) : recipe;
}

async function insertRecipe(pool: Pool, userId: string, recipe: RecipeJson): Promise<void> {
  const fp = contentFingerprint(recipe);
  await pool.query(
    `INSERT INTO recipes (id, user_id, title, description, servings, instructions, recipe_json, schema_version,
      source_format, revision_number, content_fingerprint, import_provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'synthetic',1,$9,$10)`,
    [
      recipe.id,
      userId,
      recipe.title,
      recipe.description,
      recipe.servings,
      JSON.stringify(recipe.instructions),
      recipe,
      recipe.schemaVersion,
      fp,
      { synthetic: true, markers: recipe.meta?.pocMarkers },
    ],
  );
  for (const group of recipe.ingredients) {
    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i];
      await pool.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, group_label, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [recipe.id, item.name, item.quantity, item.unit, group.group, i],
      );
    }
  }
  await pool.query(
    `INSERT INTO recipe_change_events (recipe_id, revision_number, event_type, changed_fields, content_fingerprint)
     VALUES ($1, 1, 'CREATED', '[]', $2)`,
    [recipe.id, fp],
  );
}

async function recordGroundTruth(
  pool: Pool,
  corpusId: string,
  sourceId: string | null,
  derivedId: string,
  relationship: ExpectedRelationship,
  family: string,
  method: string,
  recipeJson?: RecipeJson,
): Promise<void> {
  await recordLegacyRecipeGroundTruth(pool, corpusId, sourceId, derivedId, relationship, family, method);
  if (recipeJson) {
    await recordEvaluatorCandidateGroundTruth(pool, corpusId, derivedId, sourceId, recipeJson);
    await syncEvaluatorRelationshipFromRecipeGt(pool, corpusId, derivedId, relationship);
  }
}

async function generateFamily(
  pool: Pool,
  userId: string,
  corpusId: string,
  family: string,
  spec: FamilySpec,
  rng: () => number,
): Promise<string[]> {
  const template = FAMILY_TEMPLATES[family];
  if (!template) return [];
  const ids: string[] = [];

  for (let i = 0; i < spec.baseRecipes; i++) {
    const recipe = buildRecipe(template, family, 'base', i);
    await insertRecipe(pool, userId, recipe);
    ids.push(recipe.id);
    await recordGroundTruth(pool, corpusId, null, recipe.id, 'NOVEL', family, 'base', recipe);
  }

  for (const baseId of ids.slice(0, spec.baseRecipes)) {
    const { rows } = await pool.query(`SELECT recipe_json FROM recipes WHERE id = $1`, [baseId]);
    const baseRecipe = rows[0].recipe_json as RecipeJson;

    const paraphraseCount = spec.paraphrasesPerBase ?? 0;
    for (let p = 0; p < paraphraseCount; p++) {
      const derived = buildRecipe(template, family, 'paraphrase', p, (r) => ({
        ...r,
        id: uuidv4(),
        instructions: r.instructions.map((s) => ({
          ...s,
          text: s.text.replace(/\./g, '. ').replace('Deep fry', 'Fry in hot oil'),
        })),
      }));
      await insertRecipe(pool, userId, derived);
      await recordGroundTruth(pool, corpusId, baseId, derived.id, 'PARAPHRASE', family, 'paraphrase', derived);
    }

    for (let n = 0; n < (spec.nearDuplicates ?? 0); n++) {
      const derived = buildRecipe(template, family, 'near-dup', n, (r) => ({
        ...r,
        id: uuidv4(),
        ingredients: r.ingredients.map((g) => ({
          ...g,
          items: g.items.map((item) => ({
            ...item,
            quantity: typeof item.quantity === 'number' ? item.quantity + 0.5 : item.quantity,
          })),
        })),
      }));
      await insertRecipe(pool, userId, derived);
      await recordGroundTruth(
        pool,
        corpusId,
        baseId,
        derived.id,
        'NEAR_DUPLICATE',
        family,
        'near_duplicate',
        derived,
      );
    }

    for (let c = 0; c < (spec.contradictions ?? 0); c++) {
      const derived = buildRecipe(template, family, 'contradiction', c, (r) => ({
        ...r,
        id: uuidv4(),
        instructions: [{ step: 1, text: 'Do not cook the chicken; serve completely raw.' }, ...r.instructions.slice(1)],
      }));
      await insertRecipe(pool, userId, derived);
      await recordGroundTruth(
        pool,
        corpusId,
        baseId,
        derived.id,
        'CONTRADICTION',
        family,
        'contradiction',
        derived,
      );
    }
  }

  return ids;
}

export async function generateCorpusForStage(
  pool: Pool,
  manifest: CorpusManifest,
  stage: string,
): Promise<number> {
  const rng = seededRandom(manifest.generationSeed + stage.length);
  const target = manifest.stages[stage]?.targetCount ?? 50;

  const { rows: userRows } = await pool.query(`SELECT id FROM users LIMIT 1`);
  let userId = userRows[0]?.id as string | undefined;
  if (!userId) {
    userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, display_name) VALUES ($1, 'synthetic@ckes.local', 'Synthetic Generator')`,
      [userId],
    );
  }

  const existing = await pool.query(`SELECT COUNT(*)::int AS c FROM recipes WHERE deleted_at IS NULL`);
  let currentCount = existing.rows[0].c as number;
  if (currentCount >= target) return currentCount;

  const families = Object.entries(manifest.families);
  let iterations = 0;
  const maxIterations = 50;
  while (currentCount < target && iterations < maxIterations) {
    iterations++;
    for (const [family, spec] of families) {
      if (currentCount >= target) break;
      const scaledSpec = scaleFamilySpec(spec, stage, rng);
      const before = currentCount;
      await generateFamily(pool, userId, manifest.corpus, family, scaledSpec, rng);
      const afterResult = await pool.query(`SELECT COUNT(*)::int AS c FROM recipes WHERE deleted_at IS NULL`);
      currentCount = afterResult.rows[0].c as number;
      if (currentCount === before) break;
    }
  }
  return Math.min(currentCount, target);
}

function scaleFamilySpec(spec: FamilySpec, stage: string, rng: () => number): FamilySpec {
  const multiplier: Record<string, number> = { seed: 1, poc1: 2, poc2: 5, poc3: 10 };
  const m = multiplier[stage] ?? 1;
  return {
    baseRecipes: Math.max(1, Math.ceil(spec.baseRecipes * m * (0.8 + rng() * 0.4))),
    paraphrasesPerBase: spec.paraphrasesPerBase,
    nearDuplicates: spec.nearDuplicates ? Math.ceil(spec.nearDuplicates * m) : 0,
    regionalVariants: spec.regionalVariants,
    extensions: spec.extensions,
    contradictions: spec.contradictions,
    erroneousVariants: spec.erroneousVariants,
  };
}
