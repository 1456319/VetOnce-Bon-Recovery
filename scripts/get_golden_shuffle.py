import numpy as np
import json

def get_authoritative_shuffle():
    # 1. Seed the generator.
    np.random.seed(42)

    # 2. Create the identical array.
    arr = np.arange(1, 11) # Creates [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    # 3. IMMEDIATELY run the shuffle.
    #    No other random functions are called first.
    np.random.shuffle(arr)

    # 4. Print the result.
    print(json.dumps(arr.tolist()))

# Call the function
if __name__ == "__main__":
    get_authoritative_shuffle()