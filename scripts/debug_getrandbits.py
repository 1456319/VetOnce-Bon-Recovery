import random

random.seed(123)
print(f"Bit 1: {random.getrandbits(1)}")
print(f"Bit 2: {random.getrandbits(1)}")
print(f"Next Random: {random.random():.17f}")
