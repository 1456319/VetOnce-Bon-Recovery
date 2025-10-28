import sys
import numpy as np

def apply_ascii_noising(text, sigma, rng):
    result = []
    for char in text:
        if 32 <= ord(char) <= 126 and rng.random() < sigma**3:
            perturbation = -1 if rng.random() < 0.5 else 1
            new_char_code = ord(char) + perturbation
            if 32 <= new_char_code <= 126:
                result.append(chr(new_char_code))
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

    noised_text = apply_ascii_noising(text, sigma, rng)
    print(noised_text, end='')
