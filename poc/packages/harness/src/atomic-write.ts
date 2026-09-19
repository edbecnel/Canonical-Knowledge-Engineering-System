import { randomUUID } from 'node:crypto';
import { rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function writeFileAtomic(finalPath: string, contents: string): Promise<void> {
  const tmp = join(dirname(finalPath), `.${randomUUID()}.tmp`);
  await writeFile(tmp, contents, 'utf8');
  await rename(tmp, finalPath);
}
