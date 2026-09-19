import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { SyntheticRecipeVaultAdapter } from '@ckes/adapter';
import { evaluatePolicy, loadPolicy } from '@ckes/policy';
import { emptyMetrics, formatRunReport, type RunMetrics } from '@ckes/metrics';
import { DISCOVERY_EXTRACTOR_ID, DISCOVERY_EXTRACTOR_VERSION, discoverCandidates } from './discovery.js';
import { hybridRetrieve } from './retrieval.js';
import { adjudicateSemantic } from './adjudication.js';
import { buildStagingFromPolicy, commitStagedChanges, stageChanges } from './commit.js';

export interface PipelineOptions {
  corpusStage: string;
  openaiKey?: string;
  openaiModel?: string;
  deterministicAi?: boolean;
}

export async function runPipeline(
  pool: Pool,
  options: PipelineOptions,
): Promise<{ runId: string; metrics: RunMetrics; report: string }> {
  const start = Date.now();
  const policy = loadPolicy();
  const runId = uuidv4();
  const metrics = emptyMetrics(options.corpusStage);
  const adapter = new SyntheticRecipeVaultAdapter(pool);

  await pool.query(
    `INSERT INTO ckes.policy_versions (version, policy_json)
     VALUES ($1, $2) ON CONFLICT (version) DO NOTHING`,
    [policy.version, policy],
  );

  await pool.query(
    `INSERT INTO ckes.canonicalization_runs (id, corpus_stage, policy_version, model_used)
     VALUES ($1, $2, $3, $4)`,
    [runId, options.corpusStage, policy.version, options.openaiModel ?? 'deterministic'],
  );

  const changes = await adapter.pollChanges({ sourceSystem: 'synthetic_rv' });
  metrics.inputChanges = changes.length;

  let totalCandidateSetSize = 0;
  let candidateSetCount = 0;
  const processedChangeIds: string[] = [];

  for (const change of changes) {
    const cursor = await adapter.getCursor(change.sourceObjectId);
    if (cursor.hash && cursor.hash === change.contentHash) {
      metrics.skippedUnchanged++;
      if (change.id) processedChangeIds.push(change.id);
      continue;
    }

    const record = await adapter.fetchSourceObject(change.sourceObjectId);
    const isSynthetic =
      record.recipeJson.meta?.synthetic === true ||
      record.recipeJson.meta?.pocMarkers?.includes('SYNTHETIC') === true;

    const candidates = discoverCandidates(record.recipeJson);
    metrics.analyzed++;

    for (const candidate of candidates) {
      const { rows: candRows } = await pool.query(
        `INSERT INTO ckes.candidates (
           id, run_id, source_change_id, source_recipe_id, candidate_type, candidate_text,
           discovery_method, status, extractor_id, extractor_version, source_path,
           candidate_role, occurrence_key, content_fingerprint
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'rule_based', 'pending', $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          uuidv4(),
          runId,
          change.id ?? null,
          change.sourceObjectId,
          candidate.candidateType,
          candidate.text,
          DISCOVERY_EXTRACTOR_ID,
          DISCOVERY_EXTRACTOR_VERSION,
          candidate.sourcePath,
          candidate.candidateRole,
          candidate.occurrenceKey,
          candidate.contentFingerprint ?? null,
        ],
      );
      const candidateId = candRows[0].id as string;

      const matches = await hybridRetrieve(pool, candidate);
      totalCandidateSetSize += matches.length;
      candidateSetCount++;

      const adjudication = await adjudicateSemantic(candidate, matches, {
        openaiKey: options.openaiKey,
        model: options.openaiModel,
        deterministic: options.deterministicAi ?? !options.openaiKey,
      });
      if (adjudication.usedAi) metrics.aiCalls++;
      metrics.aiTokens += adjudication.aiTokens;
      metrics.aiCostUsd += adjudication.aiCostUsd;

      const policyResult = evaluatePolicy(policy, {
        adjudicationClass: adjudication.classification,
        confidence: adjudication.confidence,
        isSyntheticProvenance: isSynthetic,
        newConceptsThisRun: metrics.newConceptsProposed,
        sourceItemsThisStage: Math.max(metrics.analyzed, 1),
      });

      await pool.query(
        `INSERT INTO ckes.canonicalization_decisions
         (run_id, candidate_id, adjudication_class, policy_action, retrieval_method, candidate_set_size, ai_tokens, ai_cost_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          runId,
          candidateId,
          adjudication.classification,
          policyResult.action,
          matches[0]?.method ?? 'none',
          matches.length,
          adjudication.aiTokens,
          adjudication.aiCostUsd,
        ],
      );

      if (adjudication.classification === 'EQUIVALENT' || adjudication.classification === 'SUBSUMED_BY_EXISTING') {
        metrics.mappedToExisting++;
      } else if (policyResult.action === 'evidence_only' || policyResult.action === 'extend_or_evidence') {
        metrics.evidenceOnly++;
      } else if (policyResult.action === 'defer') {
        metrics.deferred++;
      } else if (policyResult.action === 'preserve_conflict') {
        metrics.conflicts++;
      } else if (policyResult.action === 'escalate') {
        metrics.escalated++;
      }

      if (policyResult.admit) {
        const staging = buildStagingFromPolicy(policyResult.action, {
          text: candidate.text,
          subject: candidate.subject,
          aspect: candidate.aspect,
          candidateType: candidate.candidateType,
        }, {
          sourceSystem: change.sourceSystem,
          sourceObjectId: change.sourceObjectId,
          sourceRevision: change.sourceRevision,
        });

        if (staging.some((s) => s.changeType === 'create_concept')) metrics.newConceptsProposed++;
        if (staging.some((s) => s.changeType === 'create_knowledge_object')) metrics.newKnowledgeObjects++;
        if (staging.some((s) => s.changeType === 'create_relationship')) metrics.newRelationshipsProposed++;

        await stageChanges(pool, runId, candidateId, staging);
        if (policyResult.admit && policyResult.action !== 'defer') metrics.automaticallyAdmitted++;
      }
    }

    await adapter.updateCursor(change.sourceObjectId, change.sourceRevision, change.contentHash);
    if (change.id) processedChangeIds.push(change.id);
  }

  const { applied } = await commitStagedChanges(pool, runId);
  await adapter.markProcessed(processedChangeIds);

  metrics.avgCandidateSetSize = candidateSetCount > 0 ? totalCandidateSetSize / candidateSetCount : 0;
  metrics.processingTimeMs = Date.now() - start;

  await pool.query(
    `UPDATE ckes.canonicalization_runs SET completed_at = NOW(), report = $2 WHERE id = $1`,
    [runId, metrics],
  );

  await pool.query(
    `INSERT INTO ckes.metrics_snapshots (corpus_stage, metrics) VALUES ($1, $2)`,
    [options.corpusStage, metrics],
  );

  return { runId, metrics, report: formatRunReport(metrics) + `\n\nCommitted changes: ${applied}` };
}
