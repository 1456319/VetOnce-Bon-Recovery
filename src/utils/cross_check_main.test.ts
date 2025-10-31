import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';
import { PythonRandomProvider } from './PythonRandomProvider';

function runPythonCrossCheck(seed: number, count: number, shuffleN: number) {
  const cmd = `python3 scripts/cross_check_numpy.py ${seed} ${count} ${shuffleN}`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  return JSON.parse(out);
}

describe('Step 1 — main cross-check (provider path)', () => {
  const seed = 42;
  const count = 200;
  const shuffleN = 10;

  it('raw uint32 streams from np_randint(0, 2**32) should match NumPy', () => {
    const py = runPythonCrossCheck(seed, count, shuffleN);
    const expectedRaw: number[] = py.raw_uint32s.map((x: number) => x >>> 0);

    const rng = new PythonRandomProvider(seed);

    const gotRaw: number[] = [];
    for (let i = 0; i < count; i++) {
      const v = rng.np_randint(0, 2 ** 32);
      gotRaw.push(v >>> 0);
    }
    expect(gotRaw).toEqual(expectedRaw);
  });

  it('np_shuffle should produce the same ordering as NumPy RandomState.shuffle', () => {
    const py = runPythonCrossCheck(seed, count, shuffleN);
    const expectedShuffled: number[] = py.numpy_shuffled;

    const rng = new PythonRandomProvider(seed);

    // Consume the same number of random numbers as the python script to align state
    for (let i = 0; i < count; i++) {
        rng.np_randint(0, 2**32);
    }

    const arr = Array.from({ length: shuffleN }, (_, i) => i + 1);
    rng.np_shuffle(arr);
    expect(arr).toEqual(expectedShuffled);
  });
});
