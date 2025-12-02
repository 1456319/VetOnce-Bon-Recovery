import random
import sys

def main():
    seed = 12345
    random.seed(seed)

    test_bits = [1, 2, 3, 4, 16, 31, 32, 33, 63, 64]
    results = []

    print(f"Seed: {seed}")
    for k in test_bits:
        val = random.getrandbits(k)
        print(f"k={k}: {val}")

if __name__ == "__main__":
    main()
