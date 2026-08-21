import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { normalizeLabel } from '@ckes/adapter';
import type { PolicyAction } from '@ckes/policy';

export interface StagingItem {
  changeType: 'create_concept' | 'create_knowledge_object' | 'create_relationship' | 'add_evidence' | 'record_conflict';
  payload: Record<string, unknown>;
  rationale: string;
  policyAction: PolicyAction;
}

export async function stageChanges(
  pool: Pool,
  runId: string,
  candidateId: string,
  items: StagingItem[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const item of items) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO ckes.staging_changes (id, run_id, candidate_id, change_type, payload, rationale, policy_decision)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, runId, candidateId, item.changeType, item.payload, item.rationale, item.policyAction],
    );
    ids.push(id);
  }
  return ids;
}

export async function commitStagedChanges(
  pool: Pool,
  runId: string,
): Promise<{ commitId: string; applied: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM ckes.staging_changes WHERE run_id = $1 AND policy_decision NOT IN ('defer', 'reject', 'escalate')`,
      [runId],
    );

    let applied = 0;
    for (const row of rows) {
      const payload = row.payload as Record<string, unknown>;
      switch (row.change_type) {
        case 'create_concept': {
          const label = String(payload.label);
          await client.query(
            `INSERT INTO ckes.canonical_concepts (id, label, normalized_label, description, experimental)
             VALUES ($1, $2, $3, $4, TRUE)
             ON CONFLICT (scope_id, normalized_label) DO NOTHING`,
            [uuidv4(), label, normalizeLabel(label), payload.description ?? null],
          );
          applied++;
          break;
        }
        case 'create_knowledge_object': {
          await client.query(
            `INSERT INTO ckes.canonical_knowledge_objects (id, subject, aspect, knowledge_text, experimental)
             VALUES ($1, $2, $3, $4, TRUE)`,
            [uuidv4(), payload.subject, payload.aspect ?? null, payload.knowledge_text],
          );
          applied++;
          break;
        }
        case 'create_relationship': {
          await client.query(
            `INSERT INTO ckes.canonical_relationships (from_concept_id, to_concept_id, relationship_type)
             VALUES ($1, $2, $3)`,
            [payload.fromConceptId, payload.toConceptId, payload.relationshipType],
          );
          applied++;
          break;
        }
        case 'add_evidence': {
          await client.query(
            `INSERT INTO ckes.evidence (source_system, source_object_id, source_revision, excerpt)
             VALUES ($1, $2, $3, $4)`,
            [payload.sourceSystem, payload.sourceObjectId, payload.sourceRevision, payload.excerpt],
          );
          applied++;
          break;
        }
        default:
          break;
      }
    }

    const commitId = uuidv4();
    await client.query(
      `INSERT INTO ckes.canonical_commits (id, run_id, change_count) VALUES ($1, $2, $3)`,
      [commitId, runId, applied],
    );
    await client.query('COMMIT');
    return { commitId, applied };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function buildStagingFromPolicy(
  policyAction: PolicyAction,
  candidate: { text: string; subject?: string; aspect?: string; candidateType: string },
  sourceMeta: { sourceSystem: string; sourceObjectId: string; sourceRevision: string },
): StagingItem[] {
  switch (policyAction) {
    case 'reuse_existing':
    case 'evidence_only':
    case 'extend_or_evidence':
      return [
        {
          changeType: 'add_evidence',
          payload: {
            ...sourceMeta,
            excerpt: candidate.text.slice(0, 500),
          },
          rationale: `Policy action: ${policyAction}`,
          policyAction,
        },
      ];
    case 'evaluate_new_identity':
      if (candidate.candidateType === 'knowledge_object') {
        return [
          {
            changeType: 'create_knowledge_object',
            payload: {
              subject: candidate.subject ?? 'Unknown',
              aspect: candidate.aspect,
              knowledge_text: candidate.text,
            },
            rationale: 'New knowledge object warranted',
            policyAction,
          },
        ];
      }
      return [
        {
          changeType: 'create_concept',
          payload: { label: candidate.text.slice(0, 200), description: candidate.subject },
          rationale: 'New concept warranted',
          policyAction,
        },
      ];
    case 'preserve_conflict':
      return [
        {
          changeType: 'record_conflict',
          payload: { candidateText: candidate.text },
          rationale: 'Contradiction preserved',
          policyAction,
        },
      ];
    default:
      return [];
  }
}
