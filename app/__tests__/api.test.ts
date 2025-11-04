import { describe, it, expect, vi } from 'vitest';
import { POST } from '../api/generate/route';
import { NextRequest } from 'next/server';

// Mock the OpenAI module
vi.mock('openai', () => {
  const OpenAI = vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockImplementation((args) => {
          if (args.model === 'gpt-4o') {
            // Classifier call
            return Promise.resolve({
              choices: [{ message: { content: 'Yes' } }],
            });
          }
          // LLM call
          return Promise.resolve({
            choices: [{ message: { content: '[Mocked LM Response]' }, finish_reason: 'stop' }],
          });
        }),
      },
    },
  }));
  return { default: OpenAI };
});

describe('API Route: /api/generate', () => {
  it('should process a valid request and return the best augmented prompt', async () => {
    const requestBody = {
      harmful_text: 'This is a test.',
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