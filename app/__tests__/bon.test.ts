import { describe, it, expect } from 'vitest';
import {
  applyWordScrambling,
  applyRandomCapitalization,
  applyAsciiNoising,
} from '../lib/bon';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider';

describe('Text Augmentation Functions', () => {
  it('should scramble the middle of words longer than 3 characters deterministically', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const scrambled = applyWordScrambling(text, 1.0, rng);
    const goldenScrambled = 'The qciuk bworn fox jupms oevr the lazy dog';
    expect(scrambled).toEqual(goldenScrambled);
  });

  it('should randomly capitalize and decapitalize letters deterministically', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const capitalized = applyRandomCapitalization(text, 1.0, rng);
    const goldenCapitalized = 'tHE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
    expect(capitalized).toEqual(goldenCapitalized);
  });

  it('should add ASCII noise to the text deterministically', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const rng = new PythonRandomProvider(123);
    const noised = applyAsciiNoising(text, 1.0, rng);
    const goldenNoised = 'Sid!pvhdl!aqnvo!epy!kvnor pwds!sif!kbyx!enf';
    expect(noised).toEqual(goldenNoised);
  });
});
