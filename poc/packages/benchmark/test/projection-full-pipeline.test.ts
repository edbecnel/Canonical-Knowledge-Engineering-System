import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toPipelineInput } from '../src/projection.js';

describe('full_pipeline projection (G4.1)', () => {
  it('derives sourceText from directCandidate when frozen pack has no sourceText', () => {
    const projected = toPipelineInput({
      scenarioId: 'ANC-0017',
      executionMode: 'full_pipeline',
      directCandidate: { candidateType: 'concept', text: 'technique: Deep fry' },
    });
    assert.equal(projected.sourceText, 'technique: Deep fry');
    assert.equal(projected.directCandidate?.text, 'technique: Deep fry');
  });
});
