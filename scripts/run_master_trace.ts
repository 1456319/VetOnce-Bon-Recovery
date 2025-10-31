// /app/scripts/run_master_trace.ts

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { PythonRandomProvider } from '@/utils/PythonRandomProvider';
import { processTextAugmentation } from '@/app/lib/bon';

// --- 1. Configuration ---
const SEED = 123;
const TEXT = "Hello world, this is a test.";
const SIGMA = 0.4;
const SCRAMBLING = true;
const CAPITALIZATION = true;
const NOISING = true;

const PY_VERIFIER_SCRIPT = path.resolve(process.cwd(), 'scripts/run_py_verifier.py');
const TS_LOG = path.resolve(process.cwd(), 'scripts/trace_ts.log');
const PY_LOG = path.resolve(process.cwd(), 'scripts/trace_py.log');

// --- 2. Logger and Trace File Setup ---
try {
    fs.writeFileSync(TS_LOG, '');
    fs.writeFileSync(PY_LOG, '');
} catch (e) {
    console.error(chalk.red(`FATAL: Failed to clear log files.`), e);
    process.exit(1);
}

const tsLogger = (message: string) => fs.appendFileSync(TS_LOG, message + '\\n');

// --- 3. Helper Functions ---
function runPythonVerifier(rngProvider: PythonRandomProvider) {
    console.log(chalk.blue('--- Running Python Verifier ---'));

    // Escape special characters for shell command
    const npStateJsonString = JSON.stringify(rngProvider.np_state_json).replace(/"/g, '\\"');

    const command = [
        'python3',
        PY_VERIFIER_SCRIPT,
        `'${rngProvider.std_state_b64}'`,
        `"${npStateJsonString}"`,
        SEED,
        `"${TEXT}"`,
        SIGMA,
        SCRAMBLING,
        CAPITALIZATION,
        NOISING
    ].join(' ');

    try {
        execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
        console.log(chalk.green('--- Python Verifier finished successfully ---\n'));
        return true;
    } catch (error) {
        console.error(chalk.red('--- Python Verifier FAILED ---'));
        return false;
    }
}

function runTypeScriptTrace(rngProvider: PythonRandomProvider) {
    console.log(chalk.blue('--- Running TypeScript Trace ---'));
    try {
        processTextAugmentation(
            TEXT,
            SIGMA,
            SEED,
            SCRAMBLING,
            CAPITALIZATION,
            NOISING,
            0,
            0,
            tsLogger
        );
        console.log(chalk.green('--- TypeScript Trace finished successfully ---\n'));
        return true;
    } catch(error) {
        console.error(chalk.red('--- TypeScript Trace FAILED ---'));
        tsLogger(`--- TypeScript Trace FAILED ---\\n${(error as Error).stack}`);
        return false;
    }
}


function compareTraces() {
    // [Comparison logic remains the same as before]
    console.log(chalk.blue('--- Comparing Trace Files ---'));

    const pyLines = fs.readFileSync(PY_LOG, 'utf-8').trim().split('\\n');
    const tsLines = fs.readFileSync(TS_LOG, 'utf-8').trim().split('\\n');

    const numLines = Math.max(pyLines.length, tsLines.length);
    let divergenceFound = false;

    for (let i = 0; i < numLines; i++) {
        const pyLine = pyLines[i] || '<end_of_file>';
        const tsLine = tsLines[i] || '<end_of_file>';

        if (pyLine !== tsLine && !divergenceFound) {
            divergenceFound = true;
            console.log(chalk.red.bold(`\n*** DIVERGENCE FOUND AT LINE ${i + 1} ***`));
            console.log(chalk.yellow('============================================================'));
            console.log(chalk.cyan('CONTEXT (Previous 3 lines):'));
            for (let j = Math.max(0, i - 3); j < i; j++) {
                 console.log(chalk.gray(`${j + 1}: ${pyLines[j]}`));
            }
            console.log(chalk.yellow('------------------------------------------------------------'));
            console.log('PY:', chalk.red(pyLine));
            console.log('TS:', chalk.red(tsLine));
            console.log(chalk.yellow('============================================================\n'));
        }

        if (divergenceFound) {
             if(pyLine !== tsLine) {
                console.log(`L${i+1} PY: ${chalk.magenta(pyLine)}`);
                console.log(`L${i+1} TS: ${chalk.magenta(tsLine)}`);
             } else {
                console.log(`L${i+1} ${chalk.gray(pyLine)}`);
             }
        }
    }

    if (!divergenceFound) {
        console.log(chalk.green.bold('🎉🎉🎉 SUCCESS: Traces are 1:1 identical! 🎉🎉🎉'));
    } else {
        console.log(chalk.yellow('\nComparison finished. Please analyze the divergence above.'));
    }
}

// --- 4. Main Execution ---
function main() {
    console.log(chalk.bold.inverse('Starting Master Trace Comparison'));

    // 1. Get the synchronized RNG states
    console.log(chalk.blue('--- Initializing PythonRandomProvider to get states ---'));
    let rngProvider: PythonRandomProvider;
    try {
        rngProvider = new PythonRandomProvider(SEED);
        console.log(chalk.green('--- State initialization successful ---\n'));
    } catch (error) {
        console.error(chalk.red('--- FATAL: Could not initialize PythonRandomProvider ---'));
        process.exit(1);
    }

    // 2. Run both traces
    const tsSuccess = runTypeScriptTrace(rngProvider);
    const pySuccess = runPythonVerifier(rngProvider);

    // 3. Compare the results
    if (pySuccess && tsSuccess) {
        compareTraces();
    } else {
        console.error(chalk.red.bold('\nMaster trace aborted due to script execution failure.'));
    }
     console.log(chalk.bold.inverse('\nMaster Trace Finished'));
}

main();
