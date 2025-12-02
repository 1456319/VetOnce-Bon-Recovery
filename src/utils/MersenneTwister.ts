/*
    A direct, line-by-line port of the Mersenne Twister implementation from:
    https://github.com/yinengy/Mersenne-Twister-in-Python/blob/master/MT19937.py
    with fixes for JavaScript's signed 32-bit integers.
*/

export class MersenneTwister {
    private w: number;
    private n: number;
    private m: number;
    private r: number;
    private a: number;
    private u: number;
    private d: number;
    private s: number;
    private b: number;
    private t: number;
    private c: number;
    private l: number;
    private f: number;
    private lower_mask: number;
    private upper_mask: number;

    public MT: number[];
    public index: number;

    constructor() {
        this.w = 32;
        this.n = 624;
        this.m = 397;
        this.r = 31;
        this.a = 0x9908B0DF;
        this.u = 11;
        this.d = 0xFFFFFFFF;
        this.s = 7;
        this.b = 0x9D2C5680;
        this.t = 15;
        this.c = 0xEFC60000;
        this.l = 18;
        this.f = 1812433253;

        this.MT = new Array(this.n);
        this.index = this.n + 1;
        this.lower_mask = ((1 << this.r) - 1) >>> 0;
        this.upper_mask = (~this.lower_mask) >>> 0;
    }

    public initState(state: number[], index: number): void {
        this.MT = state;
        this.index = index;
    }

    /**
     * Generates a random float in [0,1) with 32-bit resolution.
     */
    public random(): number {
        return this.extract_number() * (1.0 / 4294967296.0); // 2**32
    }

    /**
     * Generates a random float in [0,1) with 53-bit resolution,
     * exactly like Python's random.random()
     */
    public random_res53(): number {
        const a = this.extract_number() >>> 5;
        const b = this.extract_number() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }

    private twist(): void {
        for (let i = 0; i < this.n; i++) {
            const x = ((this.MT[i] & this.upper_mask) + (this.MT[(i + 1) % this.n] & this.lower_mask)) >>> 0;
            let xA = x >>> 1;
            if ((x % 2) !== 0) {
                xA = (xA ^ this.a) >>> 0;
            }
            this.MT[i] = (this.MT[(i + this.m) % this.n] ^ xA) >>> 0;
        }
        this.index = 0;
    }

    public extract_number(): number {
        if (this.index >= this.n) {
            this.twist();
        }

        let y = this.MT[this.index];
        y = (y ^ ((y >>> this.u) & this.d)) >>> 0;
        y = (y ^ ((y << this.s) & this.b)) >>> 0;
        y = (y ^ ((y << this.t) & this.c)) >>> 0;
        y = (y ^ (y >>> this.l)) >>> 0;

        this.index += 1;
        return y >>> 0;
    }

    /**
     * Replicates Python's random.getrandbits(k).
     * Python does NOT buffer bits between calls.
     * It generates 32-bit words.
     * If k < 32, it takes the MSBs of one word.
     * If k > 32, it concatenates words (Little Endian for value construction).
     */
    public getrandbits(k: number): bigint {
        if (k <= 0) {
            throw new Error("Number of bits must be greater than zero");
        }

        if (k <= 32) {
            // Python behavior: genrand_int32() >> (32 - k)
            // Consumes 1 full word, returns top k bits.
            const word = this.extract_number();
            return BigInt(word >>> (32 - k));
        }

        // For k > 32
        // Python generates words and assembles them.
        // It seems to be Little Endian: result = word0 | (word1 << 32) | ...
        let result = 0n;
        let bits_collected = 0;

        while (bits_collected < k) {
            let r = BigInt(this.extract_number());

            if (k - bits_collected < 32) {
                // Last partial word
                // Python: r >>= (32 - (k - bits_collected))
                const bits_needed = k - bits_collected;
                r = r >> BigInt(32 - bits_needed);
            }

            result = result | (r << BigInt(bits_collected));
            bits_collected += 32;
        }

        return result;
    }
}
