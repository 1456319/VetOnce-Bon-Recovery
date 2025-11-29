import { describe, it, expect } from 'vitest';
import {
  applyWordScrambling,
  applyRandomCapitalization,
  applyAsciiNoising,
} from '../lib/bon';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider';

/**
 * FUNCTIONAL INTENT:
 * This test suite verifies 1:1 algorithmic parity with the Python reference implementation.
 * The seeds and expected output strings are "Golden Values" derived from the Python source.
 * DO NOT MODIFY these values unless the upstream Python algorithm changes.
 */
describe('Text Augmentation Functions', () => {
  /**
   * FUNCTIONAL INTENT:
   * Verifies that word scrambling exactly matches the Python implementation's output for seed 123.
   * This includes handling of whitespace splitting which differs between JS and Python.
   */
  it('should scramble the middle of words longer than 3 characters deterministically', () => {
    // This text now includes multiple spaces to test the implementation's divergence
    // from Python's `split()` behavior.
    const text = 'The quick  brown   fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const scrambled = applyWordScrambling(text, 1.0, rng);
    // Golden value generated from the real Python implementation with `text.split()`.
    const goldenScrambled = 'The qicuk brown fox jmups over the lzay dog';
    expect(scrambled).toEqual(goldenScrambled);
  });

  /**
   * FUNCTIONAL INTENT:
   * Verifies that random capitalization exactly matches the Python implementation's output for seed 123.
   * Ensures bit-for-bit parity in RNG consumption for character modification.
   */
  it('should randomly capitalize and decapitalize letters deterministically', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const capitalized = applyRandomCapitalization(text, 1.0, rng);
    const goldenCapitalized = 'tHE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
    expect(capitalized).toEqual(goldenCapitalized);
  });

  /**
   * FUNCTIONAL INTENT:
   * Verifies that ASCII noising exactly matches the Python implementation's output for seed 42.
   * This specifically tests parity for `isprintable()` behavior and char code manipulation.
   */
  it('should add ASCII noise to the text deterministically', () => {
    // This text now includes a non-printable character (char code 128) to test
    // the implementation's divergence from Python's `isprintable()` behavior.
    const text = 'test' + String.fromCharCode(128) + 'test';
    const rng = new PythonRandomProvider(42);
    const noised = applyAsciiNoising(text, 1.0, rng);
    // Golden value generated from the real Python implementation.
    const goldenNoised = 'sdts' + String.fromCharCode(128) + 'sfru';
    expect(noised).toEqual(goldenNoised);
  });
});
