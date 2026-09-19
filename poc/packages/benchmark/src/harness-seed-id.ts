import { createHash } from 'node:crypto';

/** Deterministic concept UUID from benchmark seedId (evaluation/harness only). */
export function deterministicConceptIdForSeed(seedId: string): string {
  const hex = createHash('sha256').update(`ckes-harness-seed:${seedId}`, 'utf8').digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
