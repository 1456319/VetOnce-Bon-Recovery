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
    // Replicating Python's text.split() behavior
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const scrambledWords: string[] = [];
    for (const word of words) {
        if (word.length > 3) {
            const rand_float = rng.std_random();
            const should_scramble = rand_float < Math.sqrt(sigma);
            if (should_scramble) {
                const chars = Array.from(word);
                const middle_chars = chars.slice(1, -1);
                rng.std_shuffle(middle_chars);

                // Logging for trace comparison
                if (logger) {
                    const formatted_chars = middle_chars.map(c => `"${c}"`).join(', ');
                    logger(`applyWordScrambling middle_chars after shuffle: [${formatted_chars}]`);
                }

                const scrambled_word = chars[0] + middle_chars.join('') + chars[chars.length - 1];

                // Logging for trace comparison
                logger?.(`applyWordScrambling scrambled_word: "${scrambled_word}"`);

                scrambledWords.push(scrambled_word);
            } else {
                scrambledWords.push(word);
            }
        } else {
            scrambledWords.push(word);
        }
    }
    const result = scrambledWords.join(' ');
    // Logging for trace comparison
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

            // Logging for trace comparison
            logger?.(`applyRandomCapitalization char: "${c}", rand_float: ${rand_float.toFixed(17)}, should_capitalize: ${should_capitalize ? 'True' : 'False'}`);

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
        127, 128, 129, 141, 143, 144, 157, 173
    ]);
    return !nonPrintable.has(charCode);
}

export function applyAsciiNoising(text: string, sigma: number, rng: PythonRandomProvider, logger?: Logger): string {
    logger?.(`applyAsciiNoising INPUT: "${text}"`);
    const new_text: string[] = [];
    for (const c of text) {
        const char_code = c.charCodeAt(0);
        let charToPush = c;
        const is_printable = isPrintable(char_code);

        if (is_printable) {
            const rand_float_1 = rng.std_random();
            const should_noise = rand_float_1 < Math.pow(sigma, 3);

            // Logging for trace comparison
            logger?.(`applyAsciiNoising char: "${c}", char_code: ${char_code}, is_printable: ${is_printable ? 'True' : 'False'}, rand_float_1: ${rand_float_1.toFixed(17)}, should_noise: ${should_noise ? 'True' : 'False'}`);

            if (should_noise) {
                const rand_float_2 = rng.std_random();
                const perturbation = rand_float_2 < 0.5 ? -1 : 1;
                const new_char_code = char_code + perturbation;

                // Logging for trace comparison
                logger?.(`applyAsciiNoising rand_float_2: ${rand_float_2.toFixed(17)}, perturbation: ${perturbation}, new_char_code: ${new_char_code}`);

                if (new_char_code >= 32 && new_char_code <= 126) {
                    charToPush = String.fromCharCode(new_char_code);
                }
            }
        } else {
             // Non-printable chars are not processed but we might want to verify if python logs them differently
             // For now assuming python loop iterates over all chars but only checks condition if printable.
             // Wait, if !isPrintable, the condition `if isPrintable(char_code)` is false.
             // Python: `if char.isprintable():`
             // So if not printable, it skips the random generation.
             // The loop continues.
             // We should check if Python logs non-printable chars.
             // The provided log snippet doesn't show non-printable chars.
             // Assuming strict matching: if not printable, no random numbers consumed, no logging?
             // But wait, the loop iterates.
             // Let's assume we log for every char if that's what trace_py.log shows.
             // In trace_py.log snippet: `applyAsciiNoising char: " ", char_code: 32, is_printable: True...`
             // I don't see non-printable examples in the short snippet.
             // But for safety, I should log what I see.
             // However, `rand_float_1` is only generated INSIDE the if.
             // So logging it outside is impossible if it wasn't generated.
             // Therefore, logging must happen inside the `if (isPrintable)` block?
             // Or maybe `rand_float_1` is logged only if generated?
             // The trace snippet: `applyAsciiNoising char: "H", char_code: 72, is_printable: True, rand_float_1: ...`
             // It logs `rand_float_1`.
             // This implies logging happens AFTER generation.
             // So if !isPrintable, we probably don't log this line, or we log without rand_float.
             // But to be safe and match the logic: I will put logging inside the if block.
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
    augmentedText = applyWordScrambling(augmentedText, sigma, rng, logger);
  }
  if (random_capitalization) {
    augmentedText = applyRandomCapitalization(augmentedText, sigma, rng, logger);
  }
  if (ascii_perturbation) {
    augmentedText = applyAsciiNoising(augmentedText, sigma, rng, logger);
  }

  logger?.('processTextAugmentation END');

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

  return [final_text, text_augmentation, msj_prefixes];
}
