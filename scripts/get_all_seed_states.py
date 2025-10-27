import sys
import json
import random
import numpy as np
import base64

try:
    # Get the single seed value from the command-line argument
    seed = int(sys.argv[1])
except (IndexError, ValueError):
    print("Usage: python get_all_seed_states.py <seed>")
    sys.exit(1)

# 1. Seed both generators with the same seed
random.seed(seed)
np.random.seed(seed)

# 2. Get the internal state from the standard 'random' library
std_state_tuple = random.getstate()[1]
std_state_array = np.array(std_state_tuple[:-1], dtype=np.uint32)
std_state_index = std_state_tuple[-1]

# 3. Get the internal state from 'numpy.random'
np_state = np.random.get_state()
np_state_array = np.array(np_state[1], dtype=np.uint32)
np_state_index = np_state[2]

# 4. Encode the state arrays as Base64
std_state_b64 = base64.b64encode(std_state_array.tobytes()).decode('utf-8')
np_state_b64 = base64.b64encode(np_state_array.tobytes()).decode('utf-8')

# 5. Package everything into a single JSON object and print to stdout
output = {
    "std_random": {
        "state_b64": std_state_b64,
        "index": std_state_index
    },
    "np_random": {
        "state_b64": np_state_b64,
        "index": np_state_index
    }
}

print(json.dumps(output))
