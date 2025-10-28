import { describe, it, expect } from 'vitest';
import {
  applyWordScrambling,
  applyRandomCapitalization,
  applyAsciiNoising,
} from '../lib/bon';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider';

describe('Text Augmentation Functions', () => {
  describe('applyWordScrambling', () => {
    it('should scramble the middle of words longer than 3 characters correctly', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const rng = new PythonRandomProvider(123);
      const scrambled = applyWordScrambling(text, 1.0, rng);
      const expectedGoldenOutput = "The qiuck brown fox jpums over the lazy dog";
      expect(scrambled.trim()).toEqual(expectedGoldenOutput.trim());
    });
  });

  describe('applyRandomCapitalization', () => {
    it('should randomly capitalize and decapitalize letters correctly', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const rng = new PythonRandomProvider(123);
      const capitalized = applyRandomCapitalization(text, 1.0, rng);
      const expectedGoldenOutput = "tHE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
      expect(capitalized.trim()).toEqual(expectedGoldenOutput.trim());
    });
  });

  describe('applyAsciiNoising', () => {
    it('should add ASCII noise to the text correctly', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const rng = new PythonRandomProvider(123);
      const noised = applyAsciiNoising(text, 1.0, rng);
      const expectedGoldenOutput = "Sid!pvhdj!csnvo eny!itlqt!pufs!ugd!mb{x!enh";
      expect(noised.trim()).toEqual(expectedGoldenOutput.trim());
    });
  });
});
