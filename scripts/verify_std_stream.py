#!/usr/bin/env python3
import sys
import json
import random

def main():
    if len(sys.argv) != 3:
        print("Usage: verify_std_stream.py <seed> <count>", file=sys.stderr)
        sys.exit(2)

    seed = int(sys.argv[1])
    count = int(sys.argv[2])

    random.seed(seed)

    values = [random.random() for _ in range(count)]

    print(json.dumps(values))

if __name__ == "__main__":
    main()
