// In src/utils/PythonRandomProvider.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { PythonRandomProvider } from './PythonRandomProvider';

// --- THIS IS THE FIX ---

// 1. Declare the provider, but DO NOT initialize it here.
let rng: PythonRandomProvider;

// 2. Use 'beforeEach' to create a NEW instance before every test
beforeEach(() => {
  // This ensures every 'it(...)' block gets a fresh, clean
  // generator, seeded to 42, with a clean state.
  rng = new PythonRandomProvider(42);
});

// --- END FIX ---

describe('PythonRandomProvider', () => {
  it('should produce deterministic random numbers based on a seed ("Golden Test")', () => {
    // This test will now use its own fresh 'rng' instance
    const val = rng.np_random();
    expect(val).toBeCloseTo(0.3745401188473625);
  });

  it('should shuffle an array deterministically', () => {
    // This test will ALSO use its own fresh 'rng' instance,
    // so its state is not polluted by the test above.
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const expectedShuffledArr = [9, 2, 6, 1, 8, 3, 10, 5, 4, 7]; // The original target

    rng.np_shuffle(arr);

    expect(arr).toEqual(expectedShuffledArr);
  });
});
