// src/utils/PythonRandomProvider.ts

import { execSync } from 'child_process';
import { MersenneTwister } from './MersenneTwister.ts';
import { buildPythonCommand } from './platform-config.ts';

// --- Interfaces for the new JSON structure from Python ---

interface ISimplifiedState {
    state_b64: string;
    index: number;
}

interface INpStateJson {
  mt19937: string;
  keys: number[];
  pos: number;
  has_gauss: number;
  cached_gauss: number;
}

interface IAllPythonStates {
  std_random_state_b64: string;
  np_random_state: INpStateJson;
  ts_std_random_state: ISimplifiedState;
  ts_np_random_state: ISimplifiedState;
}

export class PythonRandomProvider {
    private stdGenerator: MersenneTwister;
    private npGenerator: MersenneTwister;

    // Public members to store the full, opaque states for the verifier script
    public readonly std_state_b64: string;
    public readonly np_state_json: INpStateJson;

    constructor(seed: number) {
        if (!Number.isInteger(seed)) {
            throw new Error('Seed must be an integer.');
        }

        // 1. Call the refactored Python script to get all states
        // Use the platform-aware command builder
        const command = buildPythonCommand('scripts/get_all_seed_states.py', [seed]);

        let statesJson: string;
        try {
            statesJson = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        } catch (error: any) {
            // Rethrow with stderr for better debugging
            throw new Error(`Failed to execute python script. Command: ${command}. Error: ${error.message} Stderr: ${error.stderr}`);
        }

        const allStates: IAllPythonStates = JSON.parse(statesJson.trim());

        // 2. Store the full Python states for the verifier
        this.std_state_b64 = allStates.std_random_state_b64;
        this.np_state_json = allStates.np_random_state;

        // 3. Initialize the TypeScript MersenneTwister generators using the simplified states

        // Standard 'random' generator
        const stdStateBytes = Buffer.from(allStates.ts_std_random_state.state_b64, 'base64');
        const stdStateArray = new Uint32Array(stdStateBytes.buffer, stdStateBytes.byteOffset, stdStateBytes.byteLength / 4);
        this.stdGenerator = new MersenneTwister();
        this.stdGenerator.initState(Array.from(stdStateArray), allStates.ts_std_random_state.index);

        // NumPy 'numpy.random' generator
        const npStateBytes = Buffer.from(allStates.ts_np_random_state.state_b64, 'base64');
        const npStateArray = new Uint32Array(npStateBytes.buffer, npStateBytes.byteOffset, npStateBytes.byteLength / 4);
        this.npGenerator = new MersenneTwister();
        this.npGenerator.initState(Array.from(npStateArray), allStates.ts_np_random_state.index);
    }

    // --- Methods for the 'random' library stream ---

    public std_random(): number {
        return this.stdGenerator.random_res53();
    }

    public std_shuffle<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this._std_randint(0, i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    private _std_randint(low: number, high: number): number {
        const n = high - low;

        if (n <= 0) {
            throw new Error("Range must be positive");
        }

        if (n === 1) {
            return low;
        }

        // Python's random._randbelow uses n.bit_length() which is suboptimal for powers of 2
        // but must be matched for reproduction.
        const k = n.toString(2).length;

        let r = this.stdGenerator.getrandbits(k);
        while (r >= n) {
            r = this.stdGenerator.getrandbits(k);
        }

        return Number(r) + low;
    }

    public std_randint(low: number, high: number): number {
        return this._std_randint(low, high);
    }

    public getState(): [number[], number] {
        return [this.stdGenerator.MT, this.stdGenerator.index];
    }


    // --- Methods for the 'numpy.random' library stream ---

    public np_random(): number {
        return this.npGenerator.random();
    }

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

    public np_randint(low: number, high: number): number {
        return this._np_randint(low, high);
    }

    public np_shuffle<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this._np_randint(0, i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
