import sys
import numpy as np

def apply_random_capitalization(text, sigma, rng):
    result = []
    for char in text:
        if 'a' <= char <= 'z' or 'A' <= char <= 'Z':
            if rng.random() < np.sqrt(sigma):
                result.append(char.upper() if char.islower() else char.lower())
            else:
                result.append(char)
        else:
            result.append(char)
    return "".join(result)

if __name__ == "__main__":
    seed = int(sys.argv[1])
    text = "The quick brown fox jumps over the lazy dog"
    sigma = 1.0

    rng = np.random.RandomState(seed)

    capitalized_text = apply_random_capitalization(text, sigma, rng)
    print(capitalized_text, end='')
