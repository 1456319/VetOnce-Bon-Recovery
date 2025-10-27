import random
import numpy as np

seed = 42
random.seed(seed)
np.random.seed(seed)

print("--- Standard `random` Golden Values ---")
for _ in range(5):
    print(random.random())

print("\n--- NumPy `random` Golden Values ---")
for _ in range(5):
    print(np.random.random())
