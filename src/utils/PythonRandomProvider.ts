import { execSync } from 'child_process';
import { MersenneTwister } from './MersenneTwister';

// Define an interface for the state we expect from Python
interface IMersenneState {
    state_b64: string;
    index: number;
}

interface IAllPythonStates {
    std_random: IMersenneState;
    np_random: IMersenneState;
}

export class PythonRandomProvider {
    private stdGenerator: MersenneTwister;
    private npGenerator: MersenneTwister;

    constructor(seed: number) {
        if (!Number.isInteger(seed)) {
            throw new Error('Seed must be an integer.');
        }

        // 1. Call the new Python script to get both states
        const command = `python scripts/get_all_seed_states.py ${seed}`;
        let statesJson: string;

        try {
            statesJson = execSync(command, { encoding: 'utf-8' });
        } catch (error) {
            console.error(`Failed to get seed states from Python for seed: ${seed}`);
            throw error;
        }

        // 2. Parse the JSON output
        const allStates: IAllPythonStates = JSON.parse(statesJson.trim());

        // 3. Decode the Base64 state for the *standard* generator
        const stdStateBytes = Buffer.from(allStates.std_random.state_b64, 'base64');
        const stdState = new Uint32Array(stdStateBytes.buffer, stdStateBytes.byteOffset, stdStateBytes.byteLength / 4);

        // 4. Decode the Base64 state for the *NumPy* generator
        const npStateBytes = Buffer.from(allStates.np_random.state_b64, 'base64');
        const npState = new Uint32Array(npStateBytes.buffer, npStateBytes.byteOffset, npStateBytes.byteLength / 4);

        // 5. Initialize and inject the state for the *standard* generator
        this.stdGenerator = new MersenneTwister();
        this.stdGenerator.initState(Array.from(stdState), allStates.std_random.index);

        // 6. Initialize and inject the state for the *NumPy* generator
        this.npGenerator = new MersenneTwister();
        this.npGenerator.initState(Array.from(npState), allStates.np_random.index);
    }

    // --- Methods for the 'random' library stream ---

    /**
     * Gets a random float [0, 1) from the standard 'random' stream.
     */
    public std_random(): number {
        return this.stdGenerator.random();
    }

    // --- Methods for the 'numpy.random' library stream ---

    /**
     * Gets a random float [0, 1) from the 'numpy.random' stream.
     * (Equivalent to np.random.random() or np.random.rand())
     */
    public np_random(): number {
        return this.npGenerator.random();
    }

    /**
     * Generates a random integer in the range [low, high) using the
     * NumPy legacy C implementation (rk_interval).
     * This uses rejection sampling with bitmasking.
     */
    private _np_randint(low: number, high: number): number {
      const range = high - low;

      if (range <= 0) {
        throw new Error('Range must be positive');
      }

      if ((range & (range - 1)) === 0) {
          const rand_int32 = this.npGenerator.extract_number();
          return ((rand_int32 >>> 0) & (range - 1)) + low;
      }

      let mask = range - 1;
      mask |= mask >>> 1;
      mask |= mask >>> 2;
      mask |= mask >>> 4;
      mask |= mask >>> 8;
      mask |= mask >>> 16;

      let random_val: number;
      while (true) {
        const rand_int32 = this.npGenerator.extract_number();
        random_val = (rand_int32 >>> 0) & mask;

        if (random_val < range) {
          return random_val + low;
        }
      }
    }

    /**
     * Gets a random int from [low, high) from the 'numpy.random' stream.
     * (Equivalent to np.random.randint(low, high))
     */
    public np_randint(low: number, high: number): number {
        return this._np_randint(low, high);
    }

    /**
     * Shuffles an array in place.
     * (Equivalent to np.random.shuffle(arr))
     */
    public np_shuffle<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this._np_randint(0, i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
