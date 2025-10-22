import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../lib/rng';

describe('SeededRandom', () => {
  it('should produce deterministic results', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const results1 = Array.from({ length: 10 }, () => rng1.next());
    const results2 = Array.from({ length: 10 }, () => rng2.next());

    expect(results1).toEqual(results2);
  });
});
