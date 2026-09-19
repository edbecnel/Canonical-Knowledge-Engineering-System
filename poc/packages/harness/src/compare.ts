export interface ComparisonCompatibility {
  comparable: boolean;
  controlledDifferences: string[];
  blockingDifferences: string[];
}

export function compareRunCompatibility(
  experiment: Record<string, unknown>,
  reference: Record<string, unknown>,
): ComparisonCompatibility {
  const expRun = experiment.run as Record<string, unknown>;
  const refRun = reference.run as Record<string, unknown>;
  const controlled: string[] = [];
  const blocking: string[] = [];

  if (expRun.packContentHash !== refRun.packContentHash) {
    blocking.push('packContentHash differs — benchmark content changed');
  }
  if (expRun.packId !== refRun.packId) {
    blocking.push('packId differs');
  }
  if (expRun.gitCommit !== refRun.gitCommit) {
    controlled.push(`gitCommit: ${refRun.gitCommit} → ${expRun.gitCommit}`);
  }
  if (expRun.retrievalMode !== refRun.retrievalMode) {
    controlled.push(`retrievalMode: ${refRun.retrievalMode} → ${expRun.retrievalMode}`);
  }
  if (expRun.databaseProfile !== refRun.databaseProfile) {
    blocking.push('databaseProfile differs');
  }

  return {
    comparable: blocking.length === 0,
    controlledDifferences: controlled,
    blockingDifferences: blocking,
  };
}
