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

    public random(): number {
        const a = this.extract_number() >>> 5;
        const b = this.extract_number() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }

    public random_int_float(): number {
        return this.extract_number() / 4294967296.0; // 2**32
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
}
