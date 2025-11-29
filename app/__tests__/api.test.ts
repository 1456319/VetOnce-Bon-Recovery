import { describe, it, expect, vi } from 'vitest';
import { POST } from '../api/generate/route';
import { NextRequest } from 'next/server';

// Mock the @lmstudio/sdk module
vi.mock('@lmstudio/sdk', () => {
  // Mock the LLM object returned by client.llm.load()
  const MockLLM = {
    path: 'mock-model-path',
    // The route expects a response object with a 'content' property
    respond: vi.fn().mockResolvedValue({
      content: '[Mocked LM Response]',
      stats: {},
      model: 'mock-model-path'
    }),
  };

  // Mock the Client object
  const MockClient = {
    llm: {
      load: vi.fn().mockResolvedValue(MockLLM),
    },
  };

  // Mock the constructor
  return {
    LMStudioClient: vi.fn(() => MockClient),
  };
});

describe('API Route: /api/generate', () => {
  it('should process a valid request and return the best augmented prompt', async () => {
    const requestBody = {
      harmful_text: 'This is a test.',
      model: 'mock-model-path',
      transforms: {
        changeCase: true,
        shuffleLetters: true,
        replaceLetters: true,
      },
      n_steps: 2,
      num_concurrent_k: 3,
      msj_num_shots: 1,
      asr_threshold: 1.0,
    };

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('best_prompt');
    expect(data).toHaveProperty('best_asr');
    expect(data).toHaveProperty('best_augmentation');
    expect(typeof data.best_asr).toBe('number');
    expect(data.best_asr).toBeGreaterThanOrEqual(0);
    expect(data.best_asr).toBeLessThanOrEqual(1);
  }, 30000);

  it('should return a 400 error for an invalid request', async () => {
    const requestBody = {
      // Missing harmful_text
    };

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
