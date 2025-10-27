import { getTokenizer, getAttackString } from './text_utils';
import * as fs from 'fs';
import * as path from 'path';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider';

export interface TextAugmentation {
  seed: number;
  word_scrambling: boolean;
  random_capitalization: boolean;
  ascii_perturbation: boolean;
  random_prefix_length: number;
  random_suffix_length: number;
}

/**
 * Applies word scrambling to the input text.
 * Scrambles the middle characters of words longer than 3 characters.
 * @param text The input text.
 * @param sigma The probability of scrambling a word.
 * @returns The scrambled text.
 */
export function applyWordScrambling(text: string, sigma: number, rng: PythonRandomProvider): string {
  const words = text.split(' ');
  const scrambledWords = words.map(word => {
    if (word.length > 3 && rng.np_random() < Math.sqrt(sigma)) {
      const chars = word.split('');
      const middle_chars = chars.slice(1, -1);
      rng.np_shuffle(middle_chars);
      return chars[0] + middle_chars.join('') + chars[chars.length - 1];
    }
    return word;
  });
  return scrambledWords.join(' ');
}

/**
 * Applies random capitalization to the input text.
 * @param text The input text.
 * @param sigma The probability of changing the case of a letter.
 * @returns The text with random capitalization.
 */
export function applyRandomCapitalization(text: string, sigma: number, rng: PythonRandomProvider): string {
  return text
    .split('')
    .map(c => {
      if (/[a-zA-Z]/.test(c) && rng.np_random() < Math.sqrt(sigma)) {
        return c.toUpperCase() === c ? c.toLowerCase() : c.toUpperCase();
      }
      return c;
    })
    .join('');
}

/**
 * Applies ASCII noising to the input text.
 * @param text The input text.
 * @param sigma The probability of perturbing a character.
 * @returns The text with ASCII noise.
 */
export function applyAsciiNoising(text: string, sigma: number, rng: PythonRandomProvider): string {
  return text
    .split('')
    .map(c => {
      if (c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126 && rng.np_random() < Math.pow(sigma, 3)) {
        const perturbation = rng.np_random() < 0.5 ? -1 : 1;
        const newCharCode = c.charCodeAt(0) + perturbation;
        if (newCharCode >= 32 && newCharCode <= 126) {
          return String.fromCharCode(newCharCode);
        }
      }
      return c;
    })
    .join('');
}

/**
 * Processes the text with the selected augmentations.
 * @param text The input text.
 * @param sigma The overall probability of applying augmentations.
 * @param seed The random seed for reproducibility.
 * @param word_scrambling Whether to apply word scrambling.
 * @param random_capitalization Whether to apply random capitalization.
 * @param ascii_perturbation Whether to apply ASCII noising.
 * @param random_prefix_length The length of the random prefix to add.
 * @param random_suffix_length The length of the random suffix to add.
 * @returns A tuple containing the augmented text and the augmentation details.
 */
export function processTextAugmentation(
  text: string,
  sigma: number,
  seed: number,
  word_scrambling: boolean,
  random_capitalization: boolean,
  ascii_perturbation: boolean,
  random_prefix_length = 0,
  random_suffix_length = 0
): [string, TextAugmentation] {
  const rng = new PythonRandomProvider(seed);
  let augmentedText = text;

  const text_augmentation: TextAugmentation = {
    seed,
    word_scrambling,
    random_capitalization,
    ascii_perturbation,
    random_prefix_length,
    random_suffix_length,
  };

  if (random_prefix_length > 0) {
    const prefix = getAttackString(random_prefix_length, rng);
    augmentedText = prefix.getNormalisedString(getTokenizer()) + '\n\n' + augmentedText;
  }
  if (random_suffix_length > 0) {
    const suffix = getAttackString(random_suffix_length, rng);
    augmentedText = augmentedText + '\n\n' + suffix.getNormalisedString(getTokenizer());
  }
  if (word_scrambling) {
    augmentedText = applyWordScrambling(augmentedText, sigma, rng);
  }
  if (random_capitalization) {
    augmentedText = applyRandomCapitalization(augmentedText, sigma, rng);
  }
  if (ascii_perturbation) {
    augmentedText = applyAsciiNoising(augmentedText, sigma, rng);
  }

  return [augmentedText, text_augmentation];
}

/**
 * Processes the decorated text with the selected augmentations and returns the final prompt.
 * This function handles the logic for applying augmentations to the main text, prefix, and suffix.
 * @param text The main harmful text.
 * @param prefix An optional prefix to the text.
 * @param suffix An optional suffix to the text.
 * @param optim_harmful_text Whether to apply augmentations to the main text.
 * @param optim_prefix Whether to apply augmentations to the prefix.
 * @param optim_suffix Whether to apply augmentations to the suffix.
 * @param sigma The overall probability of applying augmentations.
 * @param seed The random seed for reproducibility.
 * @param word_scrambling Whether to apply word scrambling.
 * @param random_capitalization Whether to apply random capitalization.
 * @param ascii_perturbation Whether to apply ASCII noising.
 * @param random_prefix_length The length of the random prefix to add.
 * @param random_suffix_length The length of the random suffix to add.
 * @param msj_num_shots The number of multi-shot jailbreaking prompts to use.
 * @param msj_path The path to the MSJ prompts file.
 * @param msj_shuffle Whether to shuffle the MSJ prompts.
 * @param optim_msj_user_content Whether to apply augmentations to the user content of the MSJ prompts.
 * @param optim_msj_assistant_content Whether to apply augmentations to the assistant content of the MSJ prompts.
 * @returns A tuple containing the final augmented prompt, the augmentation details, and the MSJ prefixes.
 */
export function processDecoratedTextWithAugmentations(
  text: string,
  prefix: string | null,
  suffix: string | null,
  optim_harmful_text: boolean,
  optim_prefix: boolean,
  optim_suffix: boolean,
  sigma: number,
  seed: number,
  word_scrambling: boolean,
  random_capitalization: boolean,
  ascii_perturbation: boolean,
  random_prefix_length: number,
  random_suffix_length: number,
  msj_num_shots: number,
  msj_path: string,
  msj_shuffle: boolean,
  optim_msj_user_content: boolean,
  optim_msj_assistant_content: boolean,
): [string, TextAugmentation, [string, string][] | null] {
  if (!text.trim()) {
    throw new Error('Main text cannot be empty');
  }
  if (optim_prefix && !prefix) {
    throw new Error('Cannot optimize prefix when prefix is None');
  }
  if (optim_suffix && !suffix) {
    throw new Error('Cannot optimize suffix when suffix is None');
  }

  let msj_prefixes: [string, string][] | null = null;
  if (msj_num_shots > 0) {
    const jsonPath = path.resolve(process.cwd(), msj_path);
    const all_msj_prefixes: [string, string][] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    if (msj_shuffle) {
      const rng = new PythonRandomProvider(seed);
      rng.np_shuffle(all_msj_prefixes);
    }

    msj_prefixes = all_msj_prefixes.slice(0, msj_num_shots);

    if (optim_msj_user_content || optim_msj_assistant_content) {
      msj_prefixes = msj_prefixes.map(([user_content, assistant_content]) => {
        const [processed_user_content] = optim_msj_user_content
          ? processTextAugmentation(
              user_content,
              sigma,
              seed,
              word_scrambling,
              random_capitalization,
              ascii_perturbation
            )
          : [user_content];

        const [processed_assistant_content] = optim_msj_assistant_content
          ? processTextAugmentation(
              assistant_content,
              sigma,
              seed,
              word_scrambling,
              random_capitalization,
              ascii_perturbation
            )
          : [assistant_content];

        return [processed_user_content, processed_assistant_content];
      });
    }
  }

  const processed_parts: string[] = [];
  let text_augmentation: TextAugmentation = {
    seed,
    word_scrambling,
    random_capitalization,
    ascii_perturbation,
    random_prefix_length,
    random_suffix_length,
  };

  if (prefix) {
    if (optim_prefix) {
      const [processed_prefix, augmentation] = processTextAugmentation(
        prefix,
        sigma,
        seed,
        word_scrambling,
        random_capitalization,
        ascii_perturbation
      );
      processed_parts.push(processed_prefix);
      text_augmentation = augmentation;
    } else {
      processed_parts.push(prefix);
    }
  }

  if (optim_harmful_text) {
    const [processed_text, augmentation] = processTextAugmentation(
      text,
      sigma,
      seed,
      word_scrambling,
      random_capitalization,
      ascii_perturbation,
      random_prefix_length,
      random_suffix_length
    );
    processed_parts.push(processed_text);
    text_augmentation = augmentation;
  } else {
    processed_parts.push(text);
  }

  if (suffix) {
    if (optim_suffix) {
      const [processed_suffix, augmentation] = processTextAugmentation(
        suffix,
        sigma,
        seed,
        word_scrambling,
        random_capitalization,
        ascii_perturbation
      );
      processed_parts.push(processed_suffix);
      text_augmentation = augmentation;
    } else {
      processed_parts.push(suffix);
    }
  }

  const final_text = processed_parts.join(' ');

  return [final_text, text_augmentation, msj_prefixes];
}
