import type { Pool } from 'pg';
import { normalizeLabel } from '@ckes/adapter';
import type { DiscoveredCandidate } from './discovery.js';

export interface RetrievalMatch {
  id: string;
  matchType: 'concept' | 'knowledge_object';
  label: string;
  score: number;
  method: string;
}

export async function hybridRetrieve(
  pool: Pool,
  candidate: DiscoveredCandidate,
  limit = 10,
): Promise<RetrievalMatch[]> {
  const matches: RetrievalMatch[] = [];
  const normalized = normalizeLabel(candidate.text);

  const exact = await pool.query(
    `SELECT id, label, 'concept' AS match_type
     FROM ckes.canonical_concepts
     WHERE normalized_label = $1
     LIMIT $2`,
    [normalized, limit],
  );
  for (const row of exact.rows) {
    matches.push({
      id: row.id,
      matchType: 'concept',
      label: row.label,
      score: 1.0,
      method: 'exact',
    });
  }

  if (matches.length < limit) {
    const fuzzy = await pool.query(
      `SELECT id, label, 'concept' AS match_type,
              GREATEST(similarity(normalized_label, $1),
                CASE WHEN $1 LIKE '%' || normalized_label || '%' OR normalized_label LIKE '%' || $1 || '%'
                THEN 0.8 ELSE 0 END) AS score
       FROM ckes.canonical_concepts
       WHERE normalized_label % $1
          OR $1 LIKE '%' || normalized_label || '%'
          OR normalized_label LIKE '%' || $1 || '%'
       ORDER BY score DESC
       LIMIT $2`,
      [normalized, limit - matches.length],
    );
    for (const row of fuzzy.rows) {
      if (!matches.find((m) => m.id === row.id)) {
        matches.push({
          id: row.id,
          matchType: 'concept',
          label: row.label,
          score: Number(row.score),
          method: 'normalized',
        });
      }
    }
  }

  if (candidate.candidateType === 'knowledge_object' && matches.length < limit) {
    const fts = await pool.query(
      `SELECT id, subject AS label, 'knowledge_object' AS match_type,
              similarity(subject, $1) AS score
       FROM ckes.canonical_knowledge_objects
       WHERE subject % $1 OR knowledge_text ILIKE '%' || $1 || '%'
       ORDER BY score DESC NULLS LAST
       LIMIT $2`,
      [candidate.subject ?? candidate.text.slice(0, 50), limit - matches.length],
    );
    for (const row of fts.rows) {
      matches.push({
        id: row.id,
        matchType: 'knowledge_object',
        label: row.label,
        score: Number(row.score ?? 0.5),
        method: 'fulltext',
      });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
