import { createHash } from 'node:crypto';
import canonicalize from 'canonicalize';

/** SHA-256(JCS(profile)) for reproducibility anchors — excludes profileContentHash if present. */
export function computeProfileContentHash(profile: Record<string, unknown>): string {
  const clone = { ...profile };
  delete clone.profileContentHash;
  const jcs = canonicalize(clone);
  if (!jcs) throw new Error('Failed to canonicalize run profile');
  return createHash('sha256').update(jcs, 'utf8').digest('hex');
}
