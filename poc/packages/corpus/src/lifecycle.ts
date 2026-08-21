import type { Pool } from 'pg';
import { contentFingerprint } from '@ckes/adapter';
import type { CorpusManifest } from './manifest.js';

export async function runLifecycleSimulation(
  pool: Pool,
  manifest: CorpusManifest,
): Promise<{ eventsApplied: number }> {
  const schedule = manifest.lifecycleSimulation?.schedule ?? [];
  let eventsApplied = 0;

  for (const event of schedule) {
    if (event.modifies && event.modifies > 0) {
      const { rows } = await pool.query(
        `SELECT id, recipe_json, revision_number FROM recipes
         WHERE deleted_at IS NULL ORDER BY created_at LIMIT $1`,
        [event.modifies],
      );
      for (const row of rows) {
        const recipe = row.recipe_json;
        recipe.instructions = recipe.instructions.map((s: { text: string }) => ({
          ...s,
          text: s.text + ' (updated day ' + event.day + ')',
        }));
        const newRev = row.revision_number + 1;
        const fp = contentFingerprint(recipe);
        await pool.query(
          `UPDATE recipes SET recipe_json = $1, instructions = $2, revision_number = $3,
           content_fingerprint = $4, updated_at = NOW() WHERE id = $5`,
          [recipe, JSON.stringify(recipe.instructions), newRev, fp, row.id],
        );
        await pool.query(
          `INSERT INTO recipe_change_events (recipe_id, revision_number, event_type, changed_fields, content_fingerprint)
           VALUES ($1, $2, 'INSTRUCTION_CHANGED', $3, $4)`,
          [row.id, newRev, JSON.stringify(['instructions']), fp],
        );
        eventsApplied++;
      }
    }

    if (event.deletes && event.deletes > 0) {
      const { rows } = await pool.query(
        `SELECT id, revision_number, content_fingerprint FROM recipes
         WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1`,
        [event.deletes],
      );
      for (const row of rows) {
        const newRev = row.revision_number + 1;
        await pool.query(`UPDATE recipes SET deleted_at = NOW(), revision_number = $2 WHERE id = $1`, [
          row.id,
          newRev,
        ]);
        await pool.query(
          `INSERT INTO recipe_change_events (recipe_id, revision_number, event_type, changed_fields, content_fingerprint)
           VALUES ($1, $2, 'DELETED', '[]', $3)`,
          [row.id, newRev, row.content_fingerprint],
        );
        eventsApplied++;
      }
    }
  }

  return { eventsApplied };
}
