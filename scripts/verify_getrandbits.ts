import { PythonRandomProvider } from '../src/utils/PythonRandomProvider.ts';

function main() {
    const seed = 12345;
    // We access the private generator for direct testing if possible,
    // or just assume provider exposes it or we can add a test method.
    // For now, let's use the internal logic directly if possible or cast.

    // Actually, PythonRandomProvider doesn't expose getrandbits directly publicly.
    // But we can check via _std_randint if needed, or better, instantiate MersenneTwister directly.
    // However, PythonRandomProvider initializes it.

    // Let's modify PythonRandomProvider to expose a helper or just rely on our knowledge that
    // provider.stdGenerator is the MT instance.

    const provider = new PythonRandomProvider(seed);
    const generator = (provider as any).stdGenerator;

    const test_bits = [1, 2, 3, 4, 16, 31, 32, 33, 63, 64];

    console.log(`Seed: ${seed}`);
    for (const k of test_bits) {
        const val = generator.getrandbits(k);
        console.log(`k=${k}: ${val}`);
    }
}

main();
