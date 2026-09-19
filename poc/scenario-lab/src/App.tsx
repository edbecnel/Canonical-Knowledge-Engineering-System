import { useState } from 'react';

const API = '/api';

export function App() {
  const [pack, setPack] = useState<Record<string, unknown> | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function bootstrap() {
    await fetch(`${API}/session/bootstrap`, { method: 'POST', credentials: 'include' });
  }

  async function loadPack() {
    setError(null);
    await bootstrap();
    const res = await fetch(`${API}/packs/CKES-SMOKE-HARNESS-001.json`, { credentials: 'include' });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setPack(await res.json());
  }

  async function runPack() {
    setError(null);
    await bootstrap();
    const res = await fetch(`${API}/runs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packFile: 'CKES-SMOKE-HARNESS-001.json' }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'run failed');
      return;
    }
    setRunId(body.runId);
    const r = await fetch(`${API}/runs/${body.runId}/result`, { credentials: 'include' });
    setResult(await r.json());
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 960 }}>
      <h1>CKES Scenario Lab (POC)</h1>
      <p>Local development tool — uses Scenario Lab API → @ckes/harness only.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={loadPack}>Load smoke pack (browser-safe view)</button>
        <button type="button" onClick={runPack}>Run smoke pack</button>
      </div>
      {error && <pre role="alert" style={{ color: 'crimson' }}>{error}</pre>}
      {pack && (
        <section>
          <h2>Pack (no expected outcomes)</h2>
          <pre>{JSON.stringify(pack, null, 2)}</pre>
        </section>
      )}
      {runId && result && (
        <section>
          <h2>Run {runId} — scored expected vs actual per scenario</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
