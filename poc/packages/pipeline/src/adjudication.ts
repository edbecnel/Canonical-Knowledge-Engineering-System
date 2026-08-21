import OpenAI from 'openai';
import type { AdjudicationClass } from '@ckes/policy';
import type { DiscoveredCandidate } from './discovery.js';
import type { RetrievalMatch } from './retrieval.js';

export interface AdjudicationResult {
  classification: AdjudicationClass;
  confidence: number;
  rationale: string;
  aiTokens: number;
  aiCostUsd: number;
  usedAi: boolean;
}

const TOKEN_COST_PER_1K = 0.00015;

export async function adjudicateSemantic(
  candidate: DiscoveredCandidate,
  matches: RetrievalMatch[],
  options: { openaiKey?: string; model?: string; deterministic?: boolean },
): Promise<AdjudicationResult> {
  if (matches.length === 0) {
    return {
      classification: 'DISTINCT',
      confidence: 0.9,
      rationale: 'No existing matches retrieved',
      aiTokens: 0,
      aiCostUsd: 0,
      usedAi: false,
    };
  }

  if (options.deterministic || !options.openaiKey) {
    return deterministicAdjudication(candidate, matches);
  }

  const client = new OpenAI({ apiKey: options.openaiKey });
  const prompt = buildAdjudicationPrompt(candidate, matches);
  const response = await client.chat.completions.create({
    model: options.model ?? 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'Classify the relationship between candidate knowledge and existing canonical match. Respond JSON only: {"classification":"EQUIVALENT|SUBSUMED_BY_EXISTING|EXTENDS_EXISTING|CONTRADICTS|DISTINCT|UNCERTAIN","confidence":0.0-1.0,"rationale":"..."}',
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '{}';
  const tokens = response.usage?.total_tokens ?? 0;
  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '')) as {
      classification: AdjudicationClass;
      confidence: number;
      rationale: string;
    };
    return {
      classification: parsed.classification,
      confidence: parsed.confidence,
      rationale: parsed.rationale,
      aiTokens: tokens,
      aiCostUsd: (tokens / 1000) * TOKEN_COST_PER_1K,
      usedAi: true,
    };
  } catch {
    return deterministicAdjudication(candidate, matches);
  }
}

function buildAdjudicationPrompt(
  candidate: DiscoveredCandidate,
  matches: RetrievalMatch[],
): string {
  const top = matches[0];
  return `Candidate (${candidate.candidateType}): ${candidate.text.slice(0, 500)}
Existing match (${top.matchType}): ${top.label}
Score: ${top.score}
Method: ${top.method}`;
}

function deterministicAdjudication(
  candidate: DiscoveredCandidate,
  matches: RetrievalMatch[],
): AdjudicationResult {
  const top = matches[0];
  const candNorm = candidate.text.toLowerCase();
  const matchNorm = top.label.toLowerCase();

  if (top.score >= 0.95 || candNorm === matchNorm) {
    return {
      classification: 'EQUIVALENT',
      confidence: 0.92,
      rationale: 'Deterministic: exact or near-exact label match',
      aiTokens: 0,
      aiCostUsd: 0,
      usedAi: false,
    };
  }
  if (top.score >= 0.7) {
    return {
      classification: 'SUBSUMED_BY_EXISTING',
      confidence: 0.8,
      rationale: 'Deterministic: high similarity to existing concept',
      aiTokens: 0,
      aiCostUsd: 0,
      usedAi: false,
    };
  }
  if (candNorm.includes(matchNorm) || matchNorm.includes(candNorm)) {
    return {
      classification: 'EXTENDS_EXISTING',
      confidence: 0.75,
      rationale: 'Deterministic: partial overlap',
      aiTokens: 0,
      aiCostUsd: 0,
      usedAi: false,
    };
  }
  return {
    classification: 'DISTINCT',
    confidence: 0.7,
    rationale: 'Deterministic: low similarity — treat as distinct',
    aiTokens: 0,
    aiCostUsd: 0,
    usedAi: false,
  };
}
