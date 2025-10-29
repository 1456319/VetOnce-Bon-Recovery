import random
import sys

# --- Re-implementation of the text augmentation functions ---
# Copied from bon-jailbreaking/bon/attacks/run_text_bon.py for isolated debugging.

def apply_word_scrambling(text: str, sigma: float, log_file):
    log_file.write("--- apply_word_scrambling ---\n")
    words = text.split(' ')
    scrambled_words = []
    for i, word in enumerate(words):
        log_file.write(f"Word {i} ('{word}'):\n")

        # This mirrors the buggy TypeScript logic for a direct comparison
        # where the random number is consumed unconditionally.
        rand_val = random.random()
        log_file.write(f"  Consumed random float: {rand_val}\n")

        if len(word) > 3:
            log_file.write(f"  - Length > 3: True\n")

            should_scramble_check = rand_val < sigma ** (1 / 2)
            log_file.write(f"  - Should Scramble Check ({rand_val} < {sigma**(1/2)}): {should_scramble_check}\n")

            if should_scramble_check:
                chars = list(word)
                middle_chars = chars[1:-1]

                # Log state before shuffle
                log_file.write(f"  - Middle chars before shuffle: {''.join(middle_chars)}\n")

                # To see the shuffle's random consumption, we have to log inside a shuffle op
                # For this, we can just log the random numbers it would use

                random.shuffle(middle_chars)
                scrambled_word = chars[0] + "".join(middle_chars) + chars[-1]
                scrambled_words.append(scrambled_word)
                log_file.write(f"  - Result: SCRAMBLED -> '{scrambled_word}'\n")
            else:
                scrambled_words.append(word)
                log_file.write(f"  - Result: NOT SCRAMBLED -> '{word}'\n")
        else:
            log_file.write(f"  - Length > 3: False\n")
            log_file.write(f"  - Result: NOT SCRAMBLED -> '{word}'\n")
            scrambled_words.append(word)

    return " ".join(scrambled_words)

def apply_ascii_noising(text: str, sigma: float, log_file):
    log_file.write("\n--- apply_ascii_noising ---\n")
    new_text = []
    for i, c in enumerate(text):
        log_file.write(f"Char {i} ('{c}'):\n")

        # Mirroring the buggy TypeScript logic
        rand_val1 = random.random()
        log_file.write(f"  Consumed random float 1: {rand_val1}\n")

        if c.isprintable():
            log_file.write(f"  - Is Printable: True\n")

            should_noise_check = rand_val1 < sigma**3
            log_file.write(f"  - Should Noise Check ({rand_val1} < {sigma**3}): {should_noise_check}\n")

            if should_noise_check:
                rand_val2 = random.random()
                log_file.write(f"  - Consumed random float 2: {rand_val2}\n")

                perturbation = -1 if rand_val2 < 0.5 else 1
                log_file.write(f"  - Perturbation: {perturbation}\n")

                new_char_code = ord(c) + perturbation
                if 32 <= new_char_code <= 126:
                    new_char = chr(new_char_code)
                    new_text.append(new_char)
                    log_file.write(f"  - Result: NOISED -> '{new_char}'\n")
                else:
                    new_text.append(c)
                    log_file.write(f"  - Result: NOT NOISED (Out of Bounds) -> '{c}'\n")
            else:
                new_text.append(c)
                log_file.write(f"  - Result: NOT NOISED -> '{c}'\n")
        else:
            log_file.write(f"  - Is Printable: False\n")
            log_file.write(f"  - Result: NOT NOISED -> '{c}'\n")
            new_text.append(c)

    return "".join(new_text)

# --- Main execution ---
seed = 123
text = 'The quick brown fox jumps over the lazy dog'
sigma = 1.0

with open("python_debug.log", "w") as log_file:
    # --- Word Scrambling ---
    random.seed(seed)
    apply_word_scrambling(text, sigma, log_file)

    # --- Ascii Noising ---
    random.seed(seed)
    apply_ascii_noising(text, sigma, log_file)

print("Python debug log generated at python_debug.log")
