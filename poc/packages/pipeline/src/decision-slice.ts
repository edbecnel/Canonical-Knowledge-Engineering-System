import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { evaluatePolicy, loadPolicy } from '@ckes/policy';
import type { PipelineScenarioInput } from '@ckes/benchmark';
import { discoverCandidates, type DiscoveredCandidate } from './discovery.js';
import { hybridRetrieve } from './retrieval.js';
import { adjudicateSemantic } from './adjudication.js';

export interface DecisionSliceOptions {
  openaiKey?: string;
  openaiModel?: string;
  deterministicAi?: boolean;
  retrievalMode?: string;
}

export interface DecisionSliceResult {
  pipelineRunId: string;
  candidateId: string;
  sourceObjectId?: string;
  sourceChangeId?: string;
  candidate: DiscoveredCandidate;
  adjudicationClass: string;
  policyAction: string;
  retrievalMethod: string;
  candidateSetSize: number;
  aiTokens: number;
  aiCostUsd: number;
  usedAi: boolean;
  latencyMs: number;
  failureLayer?: 'extraction' | 'retrieval' | 'adjudication' | 'policy';
}

function inputToCandidate(input: PipelineScenarioInput): DiscoveredCandidate {
  if (input.directCandidate) {
    return {
      candidateType: input.directCandidate.candidateType as DiscoveredCandidate['candidateType'],
      text: input.directCandidate.text,
      techniqueLabels: [],
      ingredientLabels: [],
      sourcePath: 'harness.directCandidate',
      candidateRole: input.directCandidate.candidateType,
      occurrenceKey: '0',
    };
  }
  throw new Error('decision_slice requires directCandidate in projected input');
}

export async function runDecisionSlice(
  pool: Pool,
  input: PipelineScenarioInput,
  options: DecisionSliceOptions,
): Promise<DecisionSliceResult> {
  const start = Date.now();
  const policy = loadPolicy();
  const pipelineRunId = uuidv4();
  const candidate = inputToCandidate(input);

  await pool.query(
    `INSERT INTO ckes.canonicalization_runs (id, corpus_stage, policy_version, model_used)
     VALUES ($1, 'harness', $2, $3)`,
    [pipelineRunId, policy.version, options.openaiModel ?? 'deterministic'],
  );

  const { rows: candRows } = await pool.query(
    `INSERT INTO ckes.candidates (id, run_id, candidate_type, candidate_text, discovery_method, status, source_path, candidate_role, occurrence_key)
     VALUES ($1, $2, $3, $4, 'harness_slice', 'pending', $5, $6, $7) RETURNING id`,
    [
      uuidv4(),
      pipelineRunId,
      candidate.candidateType,
      candidate.text,
      candidate.sourcePath,
      candidate.candidateRole,
      candidate.occurrenceKey,
    ],
  );
  const candidateId = candRows[0].id as string;

  const matches = await hybridRetrieve(pool, candidate);
  const adjudication = await adjudicateSemantic(candidate, matches, {
    openaiKey: options.openaiKey,
    model: options.openaiModel,
    deterministic: options.deterministicAi ?? !options.openaiKey,
  });

  const policyResult = evaluatePolicy(policy, {
    adjudicationClass: adjudication.classification,
    confidence: adjudication.confidence,
    isSyntheticProvenance: true,
    newConceptsThisRun: 0,
    sourceItemsThisStage: 1,
  });

  await pool.query(
    `INSERT INTO ckes.canonicalization_decisions
     (run_id, candidate_id, adjudication_class, policy_action, retrieval_method, candidate_set_size, ai_tokens, ai_cost_usd)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      pipelineRunId,
      candidateId,
      adjudication.classification,
      policyResult.action,
      matches[0]?.method ?? 'none',
      matches.length,
      adjudication.aiTokens,
      adjudication.aiCostUsd,
    ],
  );

  return {
    pipelineRunId,
    candidateId,
    candidate,
    adjudicationClass: adjudication.classification,
    policyAction: policyResult.action,
    retrievalMethod: matches[0]?.method ?? 'none',
    candidateSetSize: matches.length,
    aiTokens: adjudication.aiTokens,
    aiCostUsd: adjudication.aiCostUsd,
    usedAi: adjudication.usedAi,
    latencyMs: Date.now() - start,
    failureLayer: 'decision_slice_outcome' as DecisionSliceResult['failureLayer'],
  };
}

export async function runFullPipelineSlice(
  pool: Pool,
  input: PipelineScenarioInput,
  options: DecisionSliceOptions,
): Promise<DecisionSliceResult> {
  if (!input.sourceText) {
    throw new Error('full_pipeline requires sourceText');
  }
  const pseudoRecipe = {
    title: 'Harness Source',
    description: input.sourceText,
    instructions: [{ step: 1, text: input.sourceText }],
    ingredients: [],
    meta: { synthetic: true, pocMarkers: ['SYNTHETIC', 'HARNESS'] },
  };
  const discovered = discoverCandidates(pseudoRecipe);
  const primary =
    discovered.find((c) => c.candidateRole === 'knowledge_object') ?? discovered[0];
  if (!primary) {
    throw new Error('full_pipeline extraction produced no candidates');
  }
  const sliceInput: PipelineScenarioInput = {
    scenarioId: input.scenarioId,
    executionMode: 'decision_slice',
    directCandidate: { candidateType: primary.candidateType, text: primary.text },
  };
  const result = await runDecisionSlice(pool, sliceInput, options);
  return { ...result, failureLayer: 'decision_slice_outcome' };
}
