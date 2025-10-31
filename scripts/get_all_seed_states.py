# scripts/get_all_seed_states.py
import sys
import json
import random
import numpy as np
import pickle
import base64

# This function is crucial for making NumPy's state JSON-serializable
def get_serializable_np_state(state):
    """Converts NumPy state tuple to a JSON-serializable dictionary."""
    return {
        'mt19937': state[0],
        'keys': state[1].tolist(),  # Convert ndarray to list
        'pos': state[2],
        'has_gauss': state[3],
        'cached_gauss': state[4]
    }

try:
    seed = int(sys.argv[1])

    # 1. Seed both generators
    random.seed(seed)
    np.random.seed(seed)

    # 2. Get the *full* state objects
    std_state_obj = random.getstate()
    np_state_obj = np.random.get_state()

    # 3. Get the simplified components for TypeScript initialization
    std_state_tuple_for_ts = std_state_obj[1]
    std_state_array_for_ts = np.array(std_state_tuple_for_ts[:-1], dtype=np.uint32)
    std_state_index_for_ts = std_state_tuple_for_ts[-1]

    np_state_array_for_ts = np_state_obj[1]
    np_state_index_for_ts = np_state_obj[2]


    # 4. Serialize the full objects for Python verification
    # For std_random, pickle is safest to preserve the tuple structure
    std_state_b64 = base64.b64encode(pickle.dumps(std_state_obj)).decode('utf-8')

    # For np_random, convert to a JSON-safe dictionary first
    np_state_serializable = get_serializable_np_state(np_state_obj)

    output = {
        # Full state for Python verifier
        "std_random_state_b64": std_state_b64,
        "np_random_state": np_state_serializable,

        # Simplified state for TS initialization
        "ts_std_random_state": {
            "state_b64": base64.b64encode(std_state_array_for_ts.tobytes()).decode('utf-8'),
            "index": std_state_index_for_ts
        },
        "ts_np_random_state": {
            "state_b64": base64.b64encode(np_state_array_for_ts.tobytes()).decode('utf-8'),
            "index": np_state_index_for_ts
        }
    }

    print(json.dumps(output))

except Exception as e:
    print(f"Error in Python state extraction: {e}", file=sys.stderr)
    sys.exit(1)
