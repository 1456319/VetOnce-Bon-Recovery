import { PythonRandomProvider } from '../src/utils/PythonRandomProvider.ts';

const seed = 123;
const rng = new PythonRandomProvider(seed);

const chars = ['e', 'l', 'l'];
console.log(`Before shuffle: [${chars.map(c => `'${c}'`).join(', ')}]`);
rng.std_shuffle(chars);
console.log(`After shuffle: [${chars.map(c => `'${c}'`).join(', ')}]`);

const rand = rng.std_random();
console.log(`Next random: ${rand.toFixed(17)}`);
