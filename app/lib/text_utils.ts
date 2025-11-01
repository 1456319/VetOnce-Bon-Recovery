import { Tiktoken } from 'tiktoken/lite';
import getEncoding from 'tiktoken';
import { PythonRandomProvider } from '../../src/utils/PythonRandomProvider.ts';

// A simple class to hold the attack string
export class AttackString {
  constructor(public token_ids: number[]) {}

  decode(tokenizer: Tiktoken): string {
    return new TextDecoder().decode(tokenizer.decode(this.token_ids));
  }

  getNormalisedString(tokenizer: Tiktoken): string {
    return this.decode(tokenizer).split(/\s+/).join(' ');
  }
}

// Cache the tokenizer instance
let tokenizer: Tiktoken | null = null;
export function getTokenizer(): Tiktoken {
  if (!tokenizer) {
    tokenizer = getEncoding('cl100k_base');
  }
  return tokenizer;
}

// Function to get filtered token IDs, similar to the Python version
export function getFilteredTokenIds(tokenizer: Tiktoken, regex_pattern?: RegExp): number[] {
  const specialIds = new Set(
    Array.from(tokenizer.specialTokensSet).map(token => tokenizer.encode(token)[0])
  );
  const errorIds = new Set([...Array(15).keys()].map(i => 100261 + i).concat(100256));
  const disallowed = new Set([...specialIds, ...errorIds, 0]);

  const idsToSample = [...Array(tokenizer.n_vocab).keys()].filter(id => !disallowed.has(id));

  if (!regex_pattern) {
    return idsToSample;
  }

  return idsToSample.filter(id => {
    const token = new TextDecoder().decode(tokenizer.decode([id]));
    return regex_pattern.test(token);
  });
}

// Function to generate an attack string of a given number of tokens
export function getAttackString(num_tokens: number, rng: PythonRandomProvider): AttackString {
  const tokenizer = getTokenizer();
  const all_ids = getFilteredTokenIds(tokenizer);

  // Shuffle the array using the provider's built-in method
  rng.std_shuffle(all_ids);

  // Take the first num_tokens elements
  const sampled_ids = all_ids.slice(0, num_tokens);
  return new AttackString(sampled_ids);
}
