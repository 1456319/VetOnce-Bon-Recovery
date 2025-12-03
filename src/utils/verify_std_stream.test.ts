import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';
import { PythonRandomProvider } from './PythonRandomProvider';
import { buildPythonCommand } from './platform-config';

function getPythonStdStream(seed: number, count: number): number[] {
  // Use platform-aware command builder
  // Note: Originally this used 'python3', but we should use the venv python for consistency
  const cmd = buildPythonCommand('scripts/verify_std_stream.py', [seed, count]);
  const out = execSync(cmd, { encoding: 'utf-8' });
  return JSON.parse(out);
}

describe('`std_random` Stream Verification', () => {
  const seed = 123;
  const count = 50;

  it('should produce a stream of floats identical to Python `random.random()`', () => {
    const pythonValues = getPythonStdStream(seed, count);

    const rng = new PythonRandomProvider(seed);
    const tsValues: number[] = [];
    for (let i = 0; i < count; i++) {
      tsValues.push(rng.std_random());
    }

    // Use toBeCloseTo for floating point comparisons, but with high precision
    for (let i = 0; i < count; i++) {
        expect(tsValues[i]).toBeCloseTo(pythonValues[i], 15);
    }

    // Also do a final check on the whole array to be safe
    expect(tsValues).toEqual(pythonValues);
  });
});
