import numpy as np

# --- Verification for the first test: np_random() ---
np.random.seed(42)
random_val = np.random.random()
print(f"Generated np.random.random() with seed 42: {random_val}")
print(f"Expected value from test: 0.3745401188473625")


# --- Verification for the second test: np_shuffle() ---
np.random.seed(42)
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
np.random.shuffle(arr)
print(f"Generated shuffled array with seed 42: {arr}")
print(f"Expected value from test: [9, 2, 6, 1, 8, 3, 10, 5, 4, 7]")
