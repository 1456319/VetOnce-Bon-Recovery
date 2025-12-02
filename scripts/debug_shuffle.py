import random
import sys

seed = 123
random.seed(seed)

chars = ['e', 'l', 'l']
print(f"Before shuffle: {chars}")
random.shuffle(chars)
print(f"After shuffle: {chars}")

rand = random.random()
print(f"Next random: {rand:.17f}")
