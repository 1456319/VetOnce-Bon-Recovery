import random
import sys

# Redirect print to a log file
sys.stdout = open('python_debug.log', 'w')

def apply_word_scrambling(text: str, sigma: float) -> str:
    print("--- apply_word_scrambling ---")
    words = text.split(' ')
    scrambled_words = []
    word_index = 0
    for word in words:
        print(f"[{word_index}] Word: '{word}'")
        if len(word) > 3:
            print(f"  - Length > 3, checking sigma...")
            rand_val = random.random()
            should_scramble = rand_val < sigma ** (1 / 2)
            print(f"  - random.random() -> {rand_val}")
            print(f"  - Scramble check: {rand_val} < {sigma ** (1 / 2)} -> {should_scramble}")
            if should_scramble:
                chars = list(word)
                middle_chars = chars[1:-1]
                print(f"  - Before shuffle: {middle_chars}")
                random.shuffle(middle_chars)
                print(f"  - After shuffle:  {middle_chars}")
                scrambled_word = chars[0] + "".join(middle_chars) + chars[-1]
                scrambled_words.append(scrambled_word)
                print(f"  - Result: '{scrambled_word}'")
            else:
                scrambled_words.append(word)
                print(f"  - Result: '{word}' (no scramble)")
        else:
            print(f"  - Length <= 3, skipping.")
            scrambled_words.append(word)
        word_index += 1
    return " ".join(scrambled_words)

def apply_ascii_noising(text: str, sigma: float) -> str:
    print("\n--- apply_ascii_noising ---")
    new_text = []
    char_index = 0
    for c in text:
        print(f"[{char_index}] Char: '{c}' (code: {ord(c)})")
        if c.isprintable():
            print(f"  - Is printable, checking sigma...")
            rand_val1 = random.random()
            should_noise = rand_val1 < sigma**3
            print(f"  - random.random() -> {rand_val1}")
            print(f"  - Noise check: {rand_val1} < {sigma**3} -> {should_noise}")
            if should_noise:
                rand_val2 = random.random()
                perturbation = -1 if rand_val2 < 0.5 else 1
                print(f"  - random.random() -> {rand_val2}")
                print(f"  - Perturbation: {'-1' if perturbation == -1 else '+1'}")
                new_char_code = ord(c) + perturbation
                if 32 <= new_char_code <= 126:
                    new_char = chr(new_char_code)
                    new_text.append(new_char)
                    print(f"  - Result: '{new_char}' (code: {new_char_code})")
                else:
                    new_text.append(c)
                    print(f"  - Result: '{c}' (new code {new_char_code} out of bounds)")
            else:
                new_text.append(c)
                print(f"  - Result: '{c}' (no noise)")
        else:
            print(f"  - Not printable, skipping.")
            new_text.append(c)
        char_index += 1
    return "".join(new_text)

# --- Main execution ---
seed = 123
text = 'The quick brown fox jumps over the lazy dog'
sigma = 1.0

# --- Word Scrambling ---
random.seed(seed)
scrambled_text = apply_word_scrambling(text, sigma)
print(f"\nFinal Scrambled: {scrambled_text}")


# --- Ascii Noising ---
random.seed(seed)
noised_text = apply_ascii_noising(text, sigma)
print(f"\nFinal Noised: {noised_text}")
