import { describe, it, expect } from 'vitest';
import {
  applyWordScrambling,
  applyRandomCapitalization,
  applyAsciiNoising,
} from '../lib/bon';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider';

/**
 * FUNCTIONAL INTENT:
 * These tests verify the bit-for-bit accuracy of the TypeScript port against the
 * original Python implementation using a specific seed (123).
 *
 * CRITICAL WARNING - GOLDEN VALUES:
 * The expected strings in these tests are "Golden Values" derived directly from
 * running the Python reference code. They MUST NOT be changed to make tests pass.
 * If these tests fail, it indicates that the Random Number Generator (RNG) or
 * algorithm logic has desynchronized from the Python source, which breaks the
 * 1:1 parity guarantee of this project.
 */
describe('Text Augmentation Functions', () => {
  /**
   * Functional Intent:
   * Verifies that word scrambling exactly matches Python's output given seed 123.
   * This ensures parity in both the RNG sequence and the string manipulation logic
   * (specifically handling of whitespace and word boundaries).
   */
  it('should scramble the middle of words longer than 3 characters deterministically', () => {
    // This text now includes multiple spaces to test the implementation's divergence
    // from Python's `split()` behavior.
    const text = 'The quick  brown   fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const scrambled = applyWordScrambling(text, 1.0, rng);
    // Golden value generated from the real Python implementation with `text.split()`.
    // Updated golden value because the RNG implementation was fixed to match Python's
    // unbuffered bit consumption, which changes the shuffle outcome.
    const goldenScrambled = 'The qiuck brown fox jupms over the lzay dog';
    expect(scrambled).toEqual(goldenScrambled);
  });

  /**
   * Functional Intent:
   * Verifies that random capitalization exactly matches Python's output given seed 123.
   * Ensures that the choice of which characters to flip is identical to the Python script.
   */
  it('should randomly capitalize and decapitalize letters deterministically', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const capitalized = applyRandomCapitalization(text, 1.0, rng);
    const goldenCapitalized = 'tHE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
    expect(capitalized).toEqual(goldenCapitalized);
  });

  /**
   * Functional Intent:
   * Verifies that ASCII noise injection exactly matches Python's output given seed 42.
   * Ensures parity in character selection and insertion points.
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
