import { describe, it, expect } from 'vitest';
import { processDecoratedTextWithAugmentations } from '../lib/bon';

describe('processDecoratedTextWithAugmentations Error Cases', () => {
  const defaultParams = {
    text: 'Harmful text',
    prefix: null,
    suffix: null,
    optim_harmful_text: false,
    optim_prefix: false,
    optim_suffix: false,
    sigma: 1.0,
    seed: 123,
    word_scrambling: false,
    random_capitalization: false,
    ascii_perturbation: false,
    random_prefix_length: 0,
    random_suffix_length: 0,
    msj_num_shots: 0,
    msj_path: 'prompts/msj_data.json',
    msj_shuffle: false,
    optim_msj_user_content: false,
    optim_msj_assistant_content: false,
  };

  it('should throw an error if main text is empty', () => {
    expect(() => processDecoratedTextWithAugmentations(
      '',
      defaultParams.prefix,
      defaultParams.suffix,
      defaultParams.optim_harmful_text,
      defaultParams.optim_prefix,
      defaultParams.optim_suffix,
      defaultParams.sigma,
      defaultParams.seed,
      defaultParams.word_scrambling,
      defaultParams.random_capitalization,
      defaultParams.ascii_perturbation,
      defaultParams.random_prefix_length,
      defaultParams.random_suffix_length,
      defaultParams.msj_num_shots,
      defaultParams.msj_path,
      defaultParams.msj_shuffle,
      defaultParams.optim_msj_user_content,
      defaultParams.optim_msj_assistant_content
    )).toThrow('Main text cannot be empty');
  });

  it('should throw an error if optim_prefix is true but prefix is null', () => {
    expect(() => processDecoratedTextWithAugmentations(
      defaultParams.text,
      null,
      defaultParams.suffix,
      defaultParams.optim_harmful_text,
      true, // optim_prefix
      defaultParams.optim_suffix,
      defaultParams.sigma,
      defaultParams.seed,
      defaultParams.word_scrambling,
      defaultParams.random_capitalization,
      defaultParams.ascii_perturbation,
      defaultParams.random_prefix_length,
      defaultParams.random_suffix_length,
      defaultParams.msj_num_shots,
      defaultParams.msj_path,
      defaultParams.msj_shuffle,
      defaultParams.optim_msj_user_content,
      defaultParams.optim_msj_assistant_content
    )).toThrow('Cannot optimize prefix when prefix is None');
  });

  it('should throw an error if optim_suffix is true but suffix is null', () => {
    expect(() => processDecoratedTextWithAugmentations(
      defaultParams.text,
      defaultParams.prefix,
      null,
      defaultParams.optim_harmful_text,
      defaultParams.optim_prefix,
      true, // optim_suffix
      defaultParams.sigma,
      defaultParams.seed,
      defaultParams.word_scrambling,
      defaultParams.random_capitalization,
      defaultParams.ascii_perturbation,
      defaultParams.random_prefix_length,
      defaultParams.random_suffix_length,
      defaultParams.msj_num_shots,
      defaultParams.msj_path,
      defaultParams.msj_shuffle,
      defaultParams.optim_msj_user_content,
      defaultParams.optim_msj_assistant_content
    )).toThrow('Cannot optimize suffix when suffix is None');
  });
});
