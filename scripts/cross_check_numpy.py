#!/usr/bin/env ../.venv/bin/python
"""
Self-contained Python helper for Step 1.
Usage (the test will call this):
    ../.venv/bin/python scripts/cross_check_numpy.py <seed> <count> <shuffle_n>
Outputs JSON with:
- state_b64: base64-encoded RandomState MT19937 state array bytes
- index: RandomState position/index
- raw_uint32s: list of the next 32-bit unsigned integers from RandomState.randint(0, 2**32)
- numpy_shuffled: the array 1..shuffle_n after RandomState.shuffle
"""
import sys
import json
import base64
import numpy as np

def main():
    if len(sys.argv) != 4:
        print("Usage: cross_check_numpy.py <seed> <count> <shuffle_n>", file=sys.stderr)
        sys.exit(2)

    seed = int(sys.argv[1])
    count = int(sys.argv[2])
    shuffle_n = int(sys.argv[3])

    rs = np.random.RandomState(seed)

    # Generate raw uint32s
    raw = rs.randint(0, 2**32, size=count, dtype=np.uint64).astype(np.uint64)
    raw_list = [int(x & 0xFFFFFFFF) for x in raw.tolist()]

    # Get state AFTER generating the numbers but BEFORE shuffling
    state_tuple = rs.get_state()
    keys = state_tuple[1]
    pos = int(state_tuple[2])
    state_b64 = base64.b64encode(keys.tobytes()).decode('ascii')

    # Shuffle the array
    arr = list(range(1, shuffle_n + 1))
    rs.shuffle(arr)

    out = {
        "state_b64": state_b64,
        "index": pos,
        "raw_uint32s": raw_list,
        "numpy_shuffled": arr
    }

    print(json.dumps(out))

if __name__ == "__main__":
    main()
