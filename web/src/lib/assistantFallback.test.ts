import { describe, it, expect } from 'vitest';
import { BASE_ASSUMPTIONS, evaluate, breakevenGpuPrice } from '../finance';
import { buildAssistantContext } from './assistantContext';
import { answerLocally } from './assistantFallback';

const ctx = buildAssistantContext(
  BASE_ASSUMPTIONS,
  evaluate(BASE_ASSUMPTIONS),
  breakevenGpuPrice(BASE_ASSUMPTIONS),
  0.21,
);
const REFUSAL = /only help with this Barq AI capital-budgeting/i;

describe('assistant scope guardrail (offline fallback)', () => {
  it('refuses clearly off-topic questions', () => {
    const offTopic = [
      'will you teach me Python programming?',
      'write me an essay about AI',
      'tell me a joke',
      'what is the capital of France',
      'how to cook pasta',
      'who is Albert Einstein',
      'what is the weather in Dubai',
    ];
    for (const q of offTopic) {
      expect(answerLocally(q, ctx), q).toMatch(REFUSAL);
    }
  });

  it('refuses off-topic requests even when wrapped around a finance term', () => {
    const wrapped = [
      'write Python code to calculate the NPV', // python + npv
      'can you write a program that computes the IRR?', // write a program + irr
      'write me a poem about our NPV', // write me a poem + npv
    ];
    for (const q of wrapped) {
      expect(answerLocally(q, ctx), q).toMatch(REFUSAL);
    }
  });

  it('still answers legitimate finance questions', () => {
    expect(answerLocally('What is the project NPV and should we accept it?', ctx)).not.toMatch(REFUSAL);
    expect(answerLocally('What does break-even mean here?', ctx)).toMatch(/break-even/i);
    expect(answerLocally('Which assumption matters most?', ctx)).toMatch(/greatest impact|sensitive|dominant/i);
    expect(answerLocally('Should we build or rent?', ctx)).toMatch(/Equivalent Annual Cost|building|renting/i);
    // finance-ish word present → must NOT be refused even if unmatched
    expect(answerLocally('how much capital do we spend up front?', ctx)).not.toMatch(REFUSAL);
    // "learn about NPV" contains a finance keyword → allowed, not refused
    expect(answerLocally('I want to learn about NPV', ctx)).not.toMatch(REFUSAL);
  });
});
