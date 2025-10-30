import random
import math
import sys

# Re-implementation of the text augmentation functions from
# bon-jailbreaking/bon/attacks/run_text_bon.py with added logging.

def apply_word_scrambling(text: str, sigma: float) -> str:
    print("\n--- Python apply_word_scrambling Trace ---")
    words = text.split()
    scrambled_words = []
    for i, word in enumerate(words):
        print(f"Word [{i}] ('{word}'): len={len(word)}")
        if len(word) > 3:
            rand_float = random.random()
            print(f"  - Consumed random float: {rand_float}")
            if rand_float < math.sqrt(sigma):
                chars = list(word)
                middle_chars = chars[1:-1]
                random.shuffle(middle_chars)
                scrambled_word = chars[0] + "".join(middle_chars) + chars[-1]
                scrambled_words.append(scrambled_word)
                print(f"  - Scrambled: {scrambled_word}")
            else:
                scrambled_words.append(word)
        else:
            scrambled_words.append(word)
    return " ".join(scrambled_words)

def apply_random_capitalization(text: str, sigma: float) -> str:
    print("\n--- Python apply_random_capitalization Trace ---")
    new_text = []
    for c in text:
        print(f"Char ('{c}')")
        if c.isalpha():
            rand_float = random.random()
            print(f"  - isalpha(), consumed random float: {rand_float}")
            if rand_float < math.sqrt(sigma):
                if "a" <= c <= "z":
                    new_text.append(chr(ord(c) - 32)) # Uppercase
                elif "A" <= c <= "Z":
                    new_text.append(chr(ord(c) + 32)) # Lowercase
            else:
                new_text.append(c)
        else:
            new_text.append(c)
    return "".join(new_text)

def apply_ascii_noising(text: str, sigma: float) -> str:
    print("\n--- Python apply_ascii_noising Trace ---")
    new_text = []
    for c in text:
        print(f"Char ('{c}'), isprintable: {c.isprintable()}")
        if c.isprintable():
            rand_float_1 = random.random()
            print(f"  - isprintable(), consumed random float 1: {rand_float_1}")
            if rand_float_1 < sigma**3:
                perturbation = random.choice([-1, 1])
                print(f"  - Perturbation chosen: {perturbation}")
                new_char_code = ord(c) + perturbation
                if 32 <= new_char_code <= 126:
                    new_text.append(chr(new_char_code))
                else:
                    new_text.append(c)
            else:
                new_text.append(c)
        else:
            new_text.append(c)
    return "".join(new_text)

# --- Main execution ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_bon_golden_values.py <text> [seed]")
        sys.exit(1)

    text = sys.argv[1]
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 123
    sigma = 1.0

    print(f"--- Generating Golden Values for Seed: {seed} ---")

    # --- Word Scrambling ---
    random.seed(seed)
    scrambled_text = apply_word_scrambling(text, sigma)
    print(f"\nFinal Python Scrambled Text:\n{scrambled_text}")

    # --- Random Capitalization ---
    random.seed(seed)
    capitalized_text = apply_random_capitalization(text, sigma)
    print(f"\nFinal Python Capitalized Text:\n{capitalized_text}")

    # --- ASCII Noising ---
    random.seed(seed)
    noised_text = apply_ascii_noising(text, sigma)
    print(f"\nFinal Python Noised Text:\n{noised_text}")

