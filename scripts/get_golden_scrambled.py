import sys
import numpy as np

def apply_word_scrambling(text, sigma, rng):
    words = text.split(' ')
    scrambled_words = []
    for word in words:
        if len(word) > 3 and rng.random() < np.sqrt(sigma):
            middle_chars = list(word[1:-1])
            rng.shuffle(middle_chars)
            scrambled_words.append(word[0] + "".join(middle_chars) + word[-1])
        else:
            scrambled_words.append(word)
    return " ".join(scrambled_words)

if __name__ == "__main__":
    seed = int(sys.argv[1])
    text = "The quick brown fox jumps over the lazy dog"
    sigma = 1.0

    # We need to match the TypeScript implementation which uses the numpy RNG
    rng = np.random.RandomState(seed)

    scrambled_text = apply_word_scrambling(text, sigma, rng)
    print(scrambled_text, end='')
