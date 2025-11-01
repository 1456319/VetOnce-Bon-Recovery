import { describe, it, expect } from 'vitest';
import {
  applyWordScrambling,
  applyRandomCapitalization,
  applyAsciiNoising,
} from '../lib/bon';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider';

describe('Text Augmentation Functions', () => {
  describe('applyWordScrambling', () => {
    it('should scramble the middle of words longer than 3 characters deterministically', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const rng1 = new PythonRandomProvider(123);
      const scrambled1 = applyWordScrambling(text, 1.0, rng1);

      const rng2 = new PythonRandomProvider(123);
      const scrambled2 = applyWordScrambling(text, 1.0, rng2);

      expect(scrambled1).toEqual(scrambled2);
      expect(scrambled1).not.toEqual(text);
    });
  });

  describe('applyRandomCapitalization', () => {
    it('should randomly capitalize and decapitalize letters deterministically', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const rng1 = new PythonRandomProvider(123);
      const capitalized1 = applyRandomCapitalization(text, 1.0, rng1);

      const rng2 = new PythonRandomProvider(123);
      const capitalized2 = applyRandomCapitalization(text, 1.0, rng2);

      expect(capitalized1).toEqual(capitalized2);
      expect(capitalized1).not.toEqual(text);
    });
  });

  describe('applyAsciiNoising', () => {
    it('should add ASCII noise to the text deterministically', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const rng1 = new PythonRandomProvider(123);
      const noised1 = applyAsciiNoising(text, 1.0, rng1);

      const rng2 = new PythonRandomProvider(123);
      const noised2 = applyAsciiNoising(text, 1.0, rng2);

      expect(noised1).toEqual(noised2);
      expect(noised1).not.toEqual(text);
    });
  });
});
