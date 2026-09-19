import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { toBrowserPackView, validateBenchmarkPack } from '@ckes/benchmark';
import {
  HarnessRunner,
  compareRunCompatibility,
  designateReference,
  defaultHarnessRoots,
} from '@ckes/harness';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '../../..');
const roots = defaultHarnessRoots(pocRoot);
const runsDir = join(pocRoot, 'experiments/runs');
const designationsDir = join(pocRoot, 'experiments/reference-designations');
const packsDir = join(pocRoot, 'benchmark/fixtures');

const CAPABILITY_COOKIE = 'ckes_scenario_lab_session';
const sessionToken = randomBytes(32).toString('hex');
const allowedOrigins = new Set(['http://127.0.0.1:5173', 'http://localhost:5173']);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://ckes:ckes_dev@localhost:5433/ckes_poc',
});

const runners = new Map<string, HarnessRunner>();
const runStatus = new Map<string, { lifecycleState: string; resultPath?: string }>();

function redact(msg: string): string {
  return msg.replaceAll(sessionToken, '[REDACTED]');
}

function validateHostOrigin(req: Request, res: Response, next: NextFunction): void {
  const host = req.headers.host ?? '';
  if (!host.startsWith('127.0.0.1:') && !host.startsWith('localhost:')) {
    res.status(403).json({ error: 'Invalid Host' });
    return;
  }
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'Invalid Origin' });
    return;
  }
  next();
}

function requireSession(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[CAPABILITY_COOKIE] ?? req.headers.authorization?.replace('Bearer ', '');
  if (token !== sessionToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

const app = express();
app.use(validateHostOrigin);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/session/bootstrap', (req, res) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'Invalid Origin' });
    return;
  }
  res.cookie(CAPABILITY_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
  });
  res.json({ ok: true });
});

app.get('/packs/:file', requireSession, async (req, res) => {
  try {
    const path = join(packsDir, req.params.file);
    const raw = await readFile(path, 'utf8');
    const pack = JSON.parse(raw) as Record<string, unknown>;
    validateBenchmarkPack(pack);
    res.json(toBrowserPackView(pack));
  } catch (err) {
    res.status(400).json({ error: redact(err instanceof Error ? err.message : 'invalid pack') });
  }
});

app.post('/runs', requireSession, async (req, res) => {
  try {
    const packFile = req.body.packFile as string;
    const packPath = join(packsDir, packFile);
    const pack = await HarnessRunner.loadPack(packPath);
    const runner = new HarnessRunner();
    const runIdPlaceholder = 'pending';
    runners.set(runIdPlaceholder, runner);
    runner.on('event', () => {
      /* SSE subscribers attach per run */
    });
    const { runId, resultPath } = await runner.startRun({
      packPath,
      pack,
      runsDir,
      pool,
      scenarioIds: req.body.scenarioIds as string[] | undefined,
      concurrency: 1,
      deterministicAi: true,
      gitCommit: process.env.GIT_COMMIT ?? 'local',
      databaseProfile: 'clean',
      retrievalMode: 'deterministic_fixture',
      costCeilingUsd: req.body.costCeilingUsd as number | undefined,
      pricingSnapshotId: 'scenario-lab-default',
    });
    runStatus.set(runId, { lifecycleState: 'completed', resultPath });
    res.json({ runId, resultPath });
  } catch (err) {
    res.status(500).json({ error: redact(err instanceof Error ? err.message : 'run failed') });
  }
});

app.get('/runs/:id', requireSession, (req, res) => {
  const st = runStatus.get(req.params.id);
  if (!st) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.json({ runId: req.params.id, ...st });
});

app.get('/runs/:id/result', requireSession, async (req, res) => {
  const st = runStatus.get(req.params.id);
  if (!st?.resultPath) {
    res.status(404).json({ error: 'Result not ready' });
    return;
  }
  const raw = await readFile(st.resultPath, 'utf8');
  res.type('json').send(raw);
});

app.get('/runs/:id/events', requireSession, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();
  let id = 0;
  const send = (type: string, data: Record<string, unknown>) => {
    id += 1;
    res.write(`id: ${id}\n`);
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  send('connected', { runId: req.params.id });
  req.on('close', () => res.end());
});

app.post('/reference/designate', requireSession, async (req, res) => {
  try {
    const { runId, label, runResultHash } = req.body as {
      runId: string;
      label: string;
      runResultHash: string;
    };
    const st = runStatus.get(runId);
    if (!st || st.lifecycleState !== 'completed') {
      res.status(400).json({ error: 'Run not eligible for designation' });
      return;
    }
    const event = await designateReference({
      designationsDir,
      runId,
      runResultHash,
      label: label as 'harness_comparison_fixture',
      designatedBy: 'scenario-lab-api',
      runTerminalState: 'completed',
    });
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'designation failed' });
  }
});

app.post('/compare', requireSession, async (req, res) => {
  const { experimentPath, referencePath } = req.body as {
    experimentPath: string;
    referencePath: string;
  };
  const experiment = JSON.parse(await readFile(experimentPath, 'utf8')) as Record<string, unknown>;
  const reference = JSON.parse(await readFile(referencePath, 'utf8')) as Record<string, unknown>;
  res.json(compareRunCompatibility(experiment, reference));
});

const port = Number(process.env.SCENARIO_LAB_PORT ?? 3847);
const host = process.env.SCENARIO_LAB_HOST ?? '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Scenario Lab API on http://${host}:${port}`);
  console.log('Session bootstrap: POST /session/bootstrap then use cookie for API calls');
  console.log('SSE: use fetch with Authorization header (not query token)');
});
