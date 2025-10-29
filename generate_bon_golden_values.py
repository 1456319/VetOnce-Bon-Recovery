import random
import math

# Re-implementation of the text augmentation functions from
# bon-jailbreaking/bon/attacks/run_text_bon.py

def apply_word_scrambling_with_logging(text: str, sigma: float) -> str:
    print("\n--- Python applyWordScrambling Trace ---")
    words = text.split(' ')
    scrambled_words = []
    word_index = 0
    for word in words:
        should_scramble = False
        print(f"Word [{word_index}] ('{word}'): len={len(word)}")
        if len(word) > 3:
            rand_val = random.random()
            should_scramble_check = rand_val < math.sqrt(sigma)
            print(f"  - len > 3, consuming random number: {rand_val}")
            print(f"  - check: {rand_val} < {math.sqrt(sigma)} -> {should_scramble_check}")
            if should_scramble_check:
                should_scramble = True

        if should_scramble:
            print(f"  - Decision: SCRAMBLE")
            chars = list(word)
            middle_chars = chars[1:-1]
            # Log the state of middle_chars before shuffle
            print(f"  - Middle chars before shuffle: {middle_chars}")
            random.shuffle(middle_chars)
            # Log the state of middle_chars after shuffle
            print(f"  - Middle chars after shuffle: {middle_chars}")
            scrambled_word = chars[0] + "".join(middle_chars) + chars[-1]
            scrambled_words.append(scrambled_word)
        else:
            print(f"  - Decision: KEEP")
            scrambled_words.append(word)
        word_index += 1
    return " ".join(scrambled_words)

# --- Main execution ---
seed = 123
text = 'The quick brown fox jumps over the lazy dog'
sigma = 1.0

# --- Word Scrambling ---
random.seed(seed)
scrambled_text = apply_word_scrambling_with_logging(text, sigma)
print("\nFinal Python Scrambled Text:", scrambled_text)
