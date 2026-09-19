import { createHash } from 'node:crypto';
import canonicalize from 'canonicalize';

const PACK_HASH_EXCLUDED_TOP_LEVEL = new Set(['contentHash', 'integrity']);

/**
 * Build hash-eligible document for benchmark pack content (RFC 8785 JCS + SHA-256).
 */
export function buildPackHashDocument(pack: Record<string, unknown>): Record<string, unknown> {
  const clone = structuredClone(pack) as Record<string, unknown>;
  for (const key of PACK_HASH_EXCLUDED_TOP_LEVEL) {
    delete clone[key];
  }
  if (clone.pack && typeof clone.pack === 'object') {
    const packMeta = { ...(clone.pack as Record<string, unknown>) };
    delete packMeta.contentHash;
    clone.pack = packMeta;
  }
  if (clone.integrity && typeof clone.integrity === 'object') {
    const integrity = { ...(clone.integrity as Record<string, unknown>) };
    delete integrity.signature;
    delete integrity.attestation;
    clone.integrity = integrity;
  }
  return clone;
}

export function jcsStringify(value: unknown): string {
  const serialized = canonicalize(value);
  if (serialized === undefined) {
    throw new Error('Value is not JSON-serializable for JCS');
  }
  return serialized;
}

export function sha256HexUtf8(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function computePackContentHash(pack: Record<string, unknown>): string {
  const doc = buildPackHashDocument(pack);
  return sha256HexUtf8(jcsStringify(doc));
}

export function computeCanonicalSeedHash(seedMaterial: unknown[]): string {
  return sha256HexUtf8(jcsStringify(seedMaterial));
}

export function assertPackContentHash(pack: Record<string, unknown>): void {
  const packMeta = pack.pack as Record<string, unknown> | undefined;
  const declared = packMeta?.contentHash as string | undefined;
  if (!declared) {
    throw new Error('pack.contentHash is required');
  }
  const computed = computePackContentHash(pack);
  if (declared !== computed) {
    throw new Error(`pack.contentHash mismatch: declared ${declared}, computed ${computed}`);
  }
}
