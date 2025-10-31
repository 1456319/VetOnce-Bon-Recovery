# /app/scripts/run_py_verifier.py

import sys
import os
import random
import numpy as np
import json
import base64
import pickle

# --- 1. Add bon-jailbreaking-source to Python Path ---
source_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'bon-jailbreaking-source'))
if source_path not in sys.path:
    sys.path.insert(0, source_path)

from bon.attacks.run_text_bon import (
    apply_word_scrambling as original_apply_word_scrambling,
    apply_random_capitalization as original_apply_random_capitalization,
    apply_ascii_noising as original_apply_ascii_noising,
    process_text_augmentation as original_process_text_augmentation,
)

# --- 2. Helper Functions ---

def get_deserialized_np_state(state_dict):
    """Converts dictionary back to the tuple NumPy expects."""
    return (
        state_dict['mt19937'],
        np.array(state_dict['keys'], dtype=np.uint32),
        state_dict['pos'],
        state_dict['has_gauss'],
        state_dict['cached_gauss']
    )

log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'trace_py.log'))
with open(log_path, 'w') as f:
    pass

def log(message):
    """The global log function that writes to the Python trace file."""
    with open(log_path, 'a') as f:
        f.write(message + '\\n')

# --- 3. Instrumented Functions (same as before) ---
def instrumented_apply_word_scrambling(text, sigma):
    log(f'applyWordScrambling INPUT: "{text}"')
    words = text.split(' ')
    log(f'applyWordScrambling words: {json.dumps(words)}')
    scrambled_words = []
    for word in words:
        if len(word) > 3:
            rand_float = random.random()
            should_scramble = rand_float < sigma**(1/2)
            log(f'applyWordScrambling word: "{word}", rand_float: {rand_float:.17f}, should_scramble: {should_scramble}')
            if should_scramble:
                chars = list(word)
                middle_chars = chars[1:-1]
                log(f'applyWordScrambling middle_chars before shuffle: {json.dumps(middle_chars)}')
                random.shuffle(middle_chars)
                log(f'applyWordScrambling middle_chars after shuffle: {json.dumps(middle_chars)}')
                scrambled_word = chars[0] + "".join(middle_chars) + chars[-1]
                scrambled_words.append(scrambled_word)
                log(f'applyWordScrambling scrambled_word: "{scrambled_word}"')
            else:
                scrambled_words.append(word)
        else:
            scrambled_words.append(word)
    result = " ".join(scrambled_words)
    log(f'applyWordScrambling OUTPUT: "{result}"')
    return result

def instrumented_apply_random_capitalization(text, sigma):
    log(f'applyRandomCapitalization INPUT: "{text}"')
    new_text = []
    for c in text:
        if c.isalpha():
            rand_float = random.random()
            should_capitalize = rand_float < sigma**(1/2)
            log(f'applyRandomCapitalization char: "{c}", rand_float: {rand_float:.17f}, should_capitalize: {should_capitalize}')
            if should_capitalize:
                if "a" <= c <= "z":
                    new_text.append(chr(ord(c) - 32))
                elif "A" <= c <= "Z":
                    new_text.append(chr(ord(c) + 32))
            else:
                new_text.append(c)
        else:
            new_text.append(c)
    result = "".join(new_text)
    log(f'applyRandomCapitalization OUTPUT: "{result}"')
    return result

def instrumented_apply_ascii_noising(text, sigma):
    log(f'applyAsciiNoising INPUT: "{text}"')
    new_text = []
    for c in text:
        char_code = ord(c)
        is_printable = c.isprintable()
        if is_printable:
            rand_float_1 = random.random()
            should_noise = rand_float_1 < sigma**3
            log(f'applyAsciiNoising char: "{c}", char_code: {char_code}, is_printable: {is_printable}, rand_float_1: {rand_float_1:.17f}, should_noise: {should_noise}')
            if should_noise:
                rand_float_2 = random.random()
                perturbation = -1 if rand_float_2 < 0.5 else 1
                new_char_code = char_code + perturbation
                log(f'applyAsciiNoising rand_float_2: {rand_float_2:.17f}, perturbation: {perturbation}, new_char_code: {new_char_code}')
                if 32 <= new_char_code <= 126:
                    new_text.append(chr(new_char_code))
                else:
                    new_text.append(c)
            else:
                new_text.append(c)
        else:
            log(f'applyAsciiNoising char: "{c}", char_code: {char_code}, is_printable: {is_printable}')
            new_text.append(c)
    result = "".join(new_text)
    log(f'applyAsciiNoising OUTPUT: "{result}"')
    return result

def instrumented_process_text_augmentation(*args, **kwargs):
    original_scramble = sys.modules['bon.attacks.run_text_bon'].apply_word_scrambling
    original_capitalize = sys.modules['bon.attacks.run_text_bon'].apply_random_capitalization
    original_noise = sys.modules['bon.attacks.run_text_bon'].apply_ascii_noising
    sys.modules['bon.attacks.run_text_bon'].apply_word_scrambling = instrumented_apply_word_scrambling
    sys.modules['bon.attacks.run_text_bon'].apply_random_capitalization = instrumented_apply_random_capitalization
    sys.modules['bon.attacks.run_text_bon'].apply_ascii_noising = instrumented_apply_ascii_noising

    log('processTextAugmentation START')
    result = original_process_text_augmentation(*args, **kwargs)
    log('processTextAugmentation END')

    sys.modules['bon.attacks.run_text_bon'].apply_word_scrambling = original_scramble
    sys.modules['bon.attacks.run_text_bon'].apply_random_capitalization = original_capitalize
    sys.modules['bon.attacks.run_text_bon'].apply_ascii_noising = original_noise
    return result


# --- 4. Main Execution Block ---
if __name__ == "__main__":
    try:
        # 1. Parse arguments
        std_state_b64 = sys.argv[1]
        np_state_json_string = sys.argv[2]
        seed = int(sys.argv[3])
        text = sys.argv[4]
        sigma = float(sys.argv[5])
        apply_scrambling = sys.argv[6].lower() == 'true'
        apply_capitalization = sys.argv[7].lower() == 'true'
        apply_noising = sys.argv[8].lower() == 'true'

        # 2. Restore the 'random' state
        std_state_bytes = base64.b64decode(std_state_b64)
        std_state_obj = pickle.loads(std_state_bytes)
        random.setstate(std_state_obj)

        # 3. Restore the 'numpy.random' state
        np_state_dict = json.loads(np_state_json_string)
        np_state_obj = get_deserialized_np_state(np_state_dict)
        np.random.set_state(np_state_obj)

        log(f'processTextAugmentation rng created with seed: {seed}')

        # 4. Run the instrumented logic
        instrumented_process_text_augmentation(
            text=text,
            sigma=sigma,
            seed=seed,
            word_scrambling=apply_scrambling,
            random_capitalization=apply_capitalization,
            ascii_perturbation=apply_noising,
            random_prefix_length=0,
            random_suffix_length=0
        )
        print(f"[PY_VERIFIER] Python trace complete. Log saved to {log_path}", file=sys.stderr)

    except Exception as e:
        print(f"--- Python Verifier FAILED ---\\n{e}", file=sys.stderr)
        log(f"--- Python Verifier FAILED ---\\n{e}")
        import traceback
        log(traceback.format_exc())
        sys.exit(1)
