import { PythonRandomProvider } from '../src/utils/PythonRandomProvider.ts';

const rng = new PythonRandomProvider(123);
// Access internal generator to call getrandbits public method
const mt = (rng as any).stdGenerator;

console.log(`Bit 1: ${mt.getrandbits(1)}`);
console.log(`Bit 2: ${mt.getrandbits(1)}`);
console.log(`Next Random: ${rng.std_random().toFixed(17)}`);
