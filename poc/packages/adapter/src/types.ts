export type ChangeType =
  | 'CREATED'
  | 'IMPORTED'
  | 'MODIFIED'
  | 'INGREDIENT_CHANGED'
  | 'INSTRUCTION_CHANGED'
  | 'PROVENANCE_CHANGED'
  | 'DELETED';

export interface KnowledgeSourceChange {
  id?: string;
  sourceSystem: string;
  sourceObjectId: string;
  sourceRevision: string;
  previousRevision?: string;
  changeType: ChangeType;
  changedFields: string[];
  contentHash: string;
  timestamp: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  description?: string;
  recipeJson: RecipeJson;
  revisionNumber: number;
  contentFingerprint?: string;
}

export interface InstructionStep {
  id?: string;
  step?: number;
  text: string;
  group?: string;
}

export interface IngredientItem {
  id?: string;
  name: string;
  quantity?: number | string;
  unit?: string;
  preparation?: string;
}

export interface IngredientGroup {
  group?: string;
  items: IngredientItem[];
}

export interface RecipeMeta {
  source?: string;
  sourceFilename?: string;
  aiParsed?: boolean;
  synthetic?: boolean;
  pocMarkers?: string[];
}

export interface RecipeJson {
  schemaVersion: string;
  id: string;
  title: string;
  description?: string;
  servings?: number;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  meta?: RecipeMeta;
  createdAt?: string;
  updatedAt?: string;
}

export interface SourceCursor {
  sourceSystem: string;
  lastEventId?: string;
}

export interface SourceAdapter {
  pollChanges(cursor: SourceCursor): Promise<KnowledgeSourceChange[]>;
  fetchSourceObject(objectId: string, revision?: string): Promise<SourceRecord>;
}
