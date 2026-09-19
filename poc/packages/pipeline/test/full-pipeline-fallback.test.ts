import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveSourceTextForFullPipeline } from '@ckes/benchmark';

describe('full_pipeline benchmark contract (G4.1)', () => {
  it('deriveSourceText uses directCandidate text from frozen scenarios', () => {
    const text = deriveSourceTextForFullPipeline({
      scenarioId: 'ANC-0034',
      executionMode: 'full_pipeline',
      directCandidate: { candidateType: 'concept', text: 'process of Clarify' },
    });
    assert.equal(text, 'process of Clarify');
  });
});
