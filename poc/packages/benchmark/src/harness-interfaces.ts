import type { PipelineScenarioInput } from './projection.js';

/** Handover 2 — execution engine contracts (not implemented in Handover 1). */

export type RetrievalModeStratification = 'mocked' | 'hinted' | 'live' | 'deterministic_fixture';

export interface BenchmarkRunProfile {
  schemaVersion: string;
  profileId: string;
  description?: string;
  anchors: {
    gitCommit: string;
    corpusManifest?: string;
    corpusId?: string;
    policyFile?: string;
    policyVersion?: string;
    openaiMode?: string;
  };
  databaseProfile: 'clean' | 'warm';
  warmStateRef?: string;
}

export interface LoadedBenchmarkPack {
  packId: string;
  packVersion: string;
  contentHash: string;
  raw: Record<string, unknown>;
}

export interface HarnessScenarioResult {
  scenarioId: string;
  outcome: string;
  trials?: Record<string, unknown>[];
}

export interface HarnessRunner {
  loadPack(path: string): Promise<LoadedBenchmarkPack>;
  projectScenarioInput(scenario: Record<string, unknown>): PipelineScenarioInput;
  /** Handover 2 — runs pipeline under isolation rules. */
  executeScenario?(
    pack: LoadedBenchmarkPack,
    input: PipelineScenarioInput,
    profile: BenchmarkRunProfile,
  ): Promise<HarnessScenarioResult>;
  emitResult(path: string, result: Record<string, unknown>): Promise<void>;
}
