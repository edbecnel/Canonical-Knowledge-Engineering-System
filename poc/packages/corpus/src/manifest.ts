export interface CorpusManifest {
  corpus: string;
  generationSeed: number;
  schemaVersion: string;
  syntheticMarkers: string[];
  stages: Record<string, { targetCount: number }>;
  families: Record<string, FamilySpec>;
  lifecycleSimulation?: { schedule: LifecycleEvent[] };
}

export interface FamilySpec {
  baseRecipes: number;
  paraphrasesPerBase?: number;
  nearDuplicates?: number;
  regionalVariants?: number;
  extensions?: number;
  contradictions?: number;
  erroneousVariants?: number;
}

export interface LifecycleEvent {
  day: number;
  creates?: number;
  modifies?: number;
  deletes?: number;
  imports?: number;
}

export type ExpectedRelationship =
  | 'EXACT_DUPLICATE'
  | 'PARAPHRASE'
  | 'NEAR_DUPLICATE'
  | 'REGIONAL_VARIANT'
  | 'EXTENSION'
  | 'CONTRADICTION'
  | 'ERROR'
  | 'NOVEL'
  | 'NON_CANONICAL';
