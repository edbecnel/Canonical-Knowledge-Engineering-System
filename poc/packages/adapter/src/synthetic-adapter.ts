import type { Pool } from 'pg';
import type {
  KnowledgeSourceChange,
  SourceAdapter,
  SourceCursor,
  SourceRecord,
} from './types.js';

const SOURCE_SYSTEM = 'synthetic_rv';

export class SyntheticRecipeVaultAdapter implements SourceAdapter {
  constructor(private readonly pool: Pool) {}

  async pollChanges(cursor: SourceCursor): Promise<KnowledgeSourceChange[]> {
    const params: unknown[] = [];
    let sql = `
      SELECT e.id, e.recipe_id, e.revision_number, e.event_type, e.changed_fields,
             e.content_fingerprint, e.occurred_at, r.revision_number AS current_revision
      FROM recipe_change_events e
      JOIN recipes r ON r.id = e.recipe_id
      WHERE e.processed = FALSE
    `;
    if (cursor.lastEventId) {
      params.push(cursor.lastEventId);
      sql += ` AND e.occurred_at > (SELECT occurred_at FROM recipe_change_events WHERE id = $1)`;
    }
    sql += ' ORDER BY e.occurred_at ASC LIMIT 500';

    const { rows } = await this.pool.query(sql, params);
    return rows.map((row) => ({
      id: row.id,
      sourceSystem: SOURCE_SYSTEM,
      sourceObjectId: row.recipe_id,
      sourceRevision: String(row.revision_number),
      changeType: row.event_type,
      changedFields: Array.isArray(row.changed_fields)
        ? row.changed_fields
        : JSON.parse(row.changed_fields ?? '[]'),
      contentHash: row.content_fingerprint ?? '',
      timestamp: new Date(row.occurred_at).toISOString(),
    }));
  }

  async fetchSourceObject(objectId: string): Promise<SourceRecord> {
    const { rows } = await this.pool.query(
      `SELECT id, title, description, recipe_json, revision_number, content_fingerprint
       FROM recipes WHERE id = $1 AND deleted_at IS NULL`,
      [objectId],
    );
    if (!rows[0]) throw new Error(`Recipe not found: ${objectId}`);
    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      recipeJson: row.recipe_json,
      revisionNumber: row.revision_number,
      contentFingerprint: row.content_fingerprint,
    };
  }

  async markProcessed(changeIds: string[]): Promise<void> {
    if (changeIds.length === 0) return;
    await this.pool.query(
      `UPDATE recipe_change_events SET processed = TRUE WHERE id = ANY($1::uuid[])`,
      [changeIds],
    );
  }

  async getCursor(sourceObjectId: string): Promise<{ revision?: string; hash?: string }> {
    const { rows } = await this.pool.query(
      `SELECT last_processed_revision, last_processed_hash
       FROM ckes.source_cursors
       WHERE source_system = $1 AND source_object_id = $2`,
      [SOURCE_SYSTEM, sourceObjectId],
    );
    return {
      revision: rows[0]?.last_processed_revision,
      hash: rows[0]?.last_processed_hash,
    };
  }

  async updateCursor(
    sourceObjectId: string,
    revision: string,
    hash: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO ckes.source_cursors (source_system, source_object_id, last_processed_revision, last_processed_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (source_system, source_object_id)
       DO UPDATE SET last_processed_revision = $3, last_processed_hash = $4, updated_at = NOW()`,
      [SOURCE_SYSTEM, sourceObjectId, revision, hash],
    );
  }
}

export { SOURCE_SYSTEM };
