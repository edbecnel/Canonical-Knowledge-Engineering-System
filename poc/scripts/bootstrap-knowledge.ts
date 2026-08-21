import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { v4 as uuidv4 } from 'uuid';
import { normalizeLabel } from '../packages/adapter/src/fingerprint.js';
import { getPool, runMigrations } from './db-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface BootstrapManifest {
  concepts: { label: string; description?: string }[];
  relationships: { from: string; to: string; type: string }[];
  knowledgeObjects: { subject: string; aspect?: string; text: string }[];
}

async function main(): Promise<void> {
  const pool = getPool();
  const manifestPath = join(__dirname, '../experiments/bootstrap-knowledge.yaml');
  const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as BootstrapManifest;

  await runMigrations(pool);

  const conceptIds = new Map<string, string>();
  for (const c of manifest.concepts) {
    const id = uuidv4();
    conceptIds.set(c.label, id);
    await pool.query(
      `INSERT INTO ckes.canonical_concepts (id, label, normalized_label, description, experimental)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (scope_id, normalized_label) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [id, c.label, normalizeLabel(c.label), c.description ?? null],
    );
  }

  for (const rel of manifest.relationships) {
    const fromId = conceptIds.get(rel.from);
    const toId = conceptIds.get(rel.to);
    if (!fromId || !toId) continue;
    await pool.query(
      `INSERT INTO ckes.canonical_relationships (from_concept_id, to_concept_id, relationship_type)
       SELECT $1, $2, $3 WHERE NOT EXISTS (
         SELECT 1 FROM ckes.canonical_relationships
         WHERE from_concept_id = $1 AND to_concept_id = $2 AND relationship_type = $3
       )`,
      [fromId, toId, rel.type],
    );
  }

  for (const ko of manifest.knowledgeObjects) {
    await pool.query(
      `INSERT INTO ckes.canonical_knowledge_objects (subject, aspect, knowledge_text, experimental)
       VALUES ($1, $2, $3, TRUE)`,
      [ko.subject, ko.aspect ?? null, ko.text],
    );
  }

  console.log(`Bootstrap knowledge loaded: ${manifest.concepts.length} concepts, ${manifest.knowledgeObjects.length} knowledge objects`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
