/** Dependency-neutral API transport types (UI + server). */

export type BrowserPackSummary = {
  packId: string;
  name: string;
  packVersion: string;
  suiteClass: string;
  status: string;
  scenarioCount: number;
  contentHash: string;
};

export type RunStatusResponse = {
  runId: string;
  lifecycleState: string;
  resultPath?: string;
};
