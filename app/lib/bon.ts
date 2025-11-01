import { getTokenizer, getAttackString } from './text_utils.ts';
import * as fs from 'fs';
import * as path from 'path';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider.ts';

// A simple logger type for dependency injection
export type Logger = (message: string) => void;

export interface TextAugmentation {
  seed: number;
  word_scrambling: boolean;
  random_capitalization: boolean;
  ascii_perturbation: boolean;
  random_prefix_length: number;
  random_suffix_length: number;
}

/**
 * Applies word scrambling like the Python script.
 */
export function applyWordScrambling(text: string, sigma: number, rng: PythonRandomProvider, logger?: Logger): string {
    logger?.(`applyWordScrambling INPUT: "${text}"`);
    // Replicating Python's text.split() behavior
    const words = text.split(/\s+/).filter(word => word.length > 0);
    logger?.(`applyWordScrambling words: ${JSON.stringify(words)}`);
    const scrambledWords: string[] = [];
    for (const word of words) {
        if (word.length > 3) {
            const rand_float = rng.std_random();
            const should_scramble = rand_float < Math.sqrt(sigma);
            logger?.(`applyWordScrambling word: "${word}", rand_float: ${rand_float.toPrecision(17)}, should_scramble: ${should_scramble}`);
            if (should_scramble) {
                const chars = Array.from(word);
                const middle_chars = chars.slice(1, -1);
                logger?.(`applyWordScrambling middle_chars before shuffle: ${JSON.stringify(middle_chars)}`);
                logger?.(`applyWordScrambling PRE_SHUFFLE_STATE: ${JSON.stringify(rng.getState())}`);
                rng.std_shuffle(middle_chars);
                logger?.(`applyWordScrambling POST_SHUFFLE_STATE: ${JSON.stringify(rng.getState())}`);
                logger?.(`applyWordScrambling middle_chars after shuffle: ${JSON.stringify(middle_chars)}`);
                const scrambled_word = chars[0] + middle_chars.join('') + chars[chars.length - 1];
                scrambledWords.push(scrambled_word);
                logger?.(`applyWordScrambling scrambled_word: "${scrambled_word}"`);
            } else {
                scrambledWords.push(word);
            }
        } else {
            scrambledWords.push(word);
        }
    }
    const result = scrambledWords.join(' ');
    logger?.(`applyWordScrambling OUTPUT: "${result}"`);
    return result;
}

/**
 * Applies random capitalization like the Python script.
 */
export function applyRandomCapitalization(text: string, sigma: number, rng: PythonRandomProvider, logger?: Logger): string {
    logger?.(`applyRandomCapitalization INPUT: "${text}"`);
    const new_text: string[] = [];
    for (const c of text) {
        if (/[a-zA-Z]/.test(c)) {
            const rand_float = rng.std_random();
            const should_capitalize = rand_float < Math.sqrt(sigma);
            logger?.(`applyRandomCapitalization char: "${c}", rand_float: ${rand_float.toPrecision(17)}, should_capitalize: ${should_capitalize}`);
            if (should_capitalize) {
                const charCode = c.charCodeAt(0);
                if (c >= 'a' && c <= 'z') {
                    new_text.push(String.fromCharCode(charCode - 32));
                } else if (c >= 'A' && c <= 'Z') {
                    new_text.push(String.fromCharCode(charCode + 32));
                } else {
                    new_text.push(c);
                }
            } else {
                new_text.push(c);
            }
        } else {
            new_text.push(c);
        }
    }
    const result = new_text.join('');
    logger?.(`applyRandomCapitalization OUTPUT: "${result}"`);
    return result;
}

/**
 * Applies ASCII noising like the Python script.
 */
function isPrintable(charCode: number): boolean {
    // Replicates Python's `isprintable()` for the relevant character set.
    // Based on the generated log, non-printable characters in the 0-255 range are:
    // 0-31, 127, 129, 141, 143, 144, 157, 173
    const nonPrintable = new Set([
        ...Array.from({ length: 32 }, (_, i) => i), // 0-31
        127, 129, 141, 143, 144, 157, 173
    ]);
    return !nonPrintable.has(charCode);
}

export function applyAsciiNoising(text: string, sigma: number, rng: PythonRandomProvider, logger?: Logger): string {
    logger?.(`applyAsciiNoising INPUT: "${text}"`);
    const new_text: string[] = [];
    for (const c of text) {
        const char_code = c.charCodeAt(0);
        let charToPush = c;
        if (isPrintable(char_code)) {
            const rand_float_1 = rng.std_random();
            const should_noise = rand_float_1 < Math.pow(sigma, 3);
            logger?.(`applyAsciiNoising char: "${c}", char_code: ${char_code}, is_printable: true, rand_float_1: ${rand_float_1.toPrecision(17)}, should_noise: ${should_noise}`);
            if (should_noise) {
                const rand_float_2 = rng.std_random();
                const perturbation = rand_float_2 < 0.5 ? -1 : 1;
                const new_char_code = char_code + perturbation;
                logger?.(`applyAsciiNoising rand_float_2: ${rand_float_2.toPrecision(17)}, perturbation: ${perturbation}, new_char_code: ${new_char_code}`);

                if (new_char_code >= 32 && new_char_code <= 126) {
                    charToPush = String.fromCharCode(new_char_code);
                }
            }
        } else {
             logger?.(`applyAsciiNoising char: "${c}", char_code: ${char_code}, is_printable: false`);
        }
        new_text.push(charToPush);
    }
    const result = new_text.join('');
    logger?.(`applyAsciiNoising OUTPUT: "${result}"`);
    return result;
}
/**
 * Processes the text with the selected augmentations.
 */
export function processTextAugmentation(
  text: string,
  sigma: number,
  seed: number,
  word_scrambling: boolean,
  random_capitalization: boolean,
  ascii_perturbation: boolean,
  random_prefix_length = 0,
  random_suffix_length = 0,
  logger?: Logger,
): [string, TextAugmentation] {
  logger?.(`processTextAugmentation START`);
  const rng = new PythonRandomProvider(seed);
  logger?.(`processTextAugmentation rng created with seed: ${seed}`);
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
    logger?.(`processTextAugmentation applying random prefix of length: ${random_prefix_length}`);
    const prefix = getAttackString(random_prefix_length, rng);
    augmentedText = prefix.getNormalisedString(getTokenizer()) + '\n\n' + augmentedText;
  }
  if (random_suffix_length > 0) {
    logger?.(`processTextAugmentation applying random suffix of length: ${random_suffix_length}`);
    const suffix = getAttackString(random_suffix_length, rng);
    augmentedText = augmentedText + '\n\n' + suffix.getNormalisedString(getTokenizer());
  }
  if (word_scrambling) {
    logger?.(`processTextAugmentation applying word scrambling`);
    augmentedText = applyWordScrambling(augmentedText, sigma, rng, logger);
  }
  if (random_capitalization) {
    logger?.(`processTextAugmentation applying random capitalization`);
    augmentedText = applyRandomCapitalization(augmentedText, sigma, rng, logger);
  }
  if (ascii_perturbation) {
    logger?.(`processTextAugmentation applying ascii perturbation`);
    augmentedText = applyAsciiNoising(augmentedText, sigma, rng, logger);
  }

  logger?.(`processTextAugmentation END`);
  return [augmentedText, text_augmentation];
}

/**
 * Processes the decorated text with the selected augmentations and returns the final prompt.
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
  logger?: Logger,
): [string, TextAugmentation, [string, string][] | null] {
  logger?.('processDecoratedTextWithAugmentations START');

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
      logger?.(`processDecoratedTextWithAugmentations shuffling msj_prefixes with seed: ${seed}`);
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
              ascii_perturbation,
              0,
              0,
              logger
            )
          : [user_content];

        const [processed_assistant_content] = optim_msj_assistant_content
          ? processTextAugmentation(
              assistant_content,
              sigma,
              seed,
              word_scrambling,
              random_capitalization,
              ascii_perturbation,
              0,
              0,
              logger
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
      logger?.('processDecoratedTextWithAugmentations processing prefix');
      const [processed_prefix, augmentation] = processTextAugmentation(
        prefix,
        sigma,
        seed,
        word_scrambling,
        random_capitalization,
        ascii_perturbation,
        0,
        0,
        logger
      );
      processed_parts.push(processed_prefix);
      text_augmentation = augmentation;
    } else {
      processed_parts.push(prefix);
    }
  }

  if (optim_harmful_text) {
    logger?.('processDecoratedTextWithAugmentations processing harmful text');
    const [processed_text, augmentation] = processTextAugmentation(
      text,
      sigma,
      seed,
      word_scrambling,
      random_capitalization,
      ascii_perturbation,
      random_prefix_length,
      random_suffix_length,
      logger
    );
    processed_parts.push(processed_text);
    text_augmentation = augmentation;
  } else {
    processed_parts.push(text);
  }

  if (suffix) {
    if (optim_suffix) {
      logger?.('processDecoratedTextWithAugmentations processing suffix');
      const [processed_suffix, augmentation] = processTextAugmentation(
        suffix,
        sigma,
        seed,
        word_scrambling,
        random_capitalization,
        ascii_perturbation,
        0,
        0,
        logger,
      );
      processed_parts.push(processed_suffix);
      text_augmentation = augmentation;
    } else {
      processed_parts.push(suffix);
    }
  }

  const final_text = processed_parts.join(' ');
  logger?.(`processDecoratedTextWithAugmentations final text: "${final_text}"`);
  logger?.('processDecoratedTextWithAugmentations END');

  return [final_text, text_augmentation, msj_prefixes];
}
