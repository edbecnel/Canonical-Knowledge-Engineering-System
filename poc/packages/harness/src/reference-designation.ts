import { randomUUID } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileAtomic } from './atomic-write.js';

export type ReferenceDesignationLabel =
  | 'smoke_reference'
  | 'development_reference'
  | 'harness_comparison_fixture'
  | 'non_architectural_test_baseline'
  | 'reference_baseline_001';

export interface ReferenceDesignationEvent {
  eventId: string;
  runId: string;
  runResultHash: string;
  label: ReferenceDesignationLabel;
  designatedAt: string;
  designatedBy: string;
  status: 'active' | 'superseded' | 'revoked';
  supersedesEventId?: string;
}

/** Append-only designation log — never mutates run-result JSON. */
export async function appendDesignation(
  designationsDir: string,
  event: ReferenceDesignationEvent,
): Promise<void> {
  const path = join(designationsDir, 'designations.jsonl');
  await appendFile(path, JSON.stringify(event) + '\n', 'utf8');
}

export async function designateReference(params: {
  designationsDir: string;
  runId: string;
  runResultHash: string;
  label: ReferenceDesignationLabel;
  designatedBy: string;
  runTerminalState: string;
  /** Set true only after architect G5 authorization. */
  allowOfficialReferenceBaseline?: boolean;
}): Promise<ReferenceDesignationEvent> {
  if (params.label === 'reference_baseline_001' && !params.allowOfficialReferenceBaseline) {
    throw new Error('reference_baseline_001 designation requires G5 authorization');
  }
  if (params.runTerminalState !== 'completed') {
    throw new Error(
      'Only fully completed runs may be designated; partial or cancelled runs are excluded',
    );
  }
  const event: ReferenceDesignationEvent = {
    eventId: randomUUID(),
    runId: params.runId,
    runResultHash: params.runResultHash,
    label: params.label,
    designatedAt: new Date().toISOString(),
    designatedBy: params.designatedBy,
    status: 'active',
  };
  await appendDesignation(params.designationsDir, event);
  await writeFileAtomic(
    join(params.designationsDir, `reference-${params.runId}.json`),
    JSON.stringify(event, null, 2),
  );
  return event;
}

export async function loadDesignations(designationsDir: string): Promise<ReferenceDesignationEvent[]> {
  const path = join(designationsDir, 'designations.jsonl');
  try {
    const raw = await readFile(path, 'utf8');
    return raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ReferenceDesignationEvent);
  } catch {
    return [];
  }
}
