// /app/scripts/run_ts_trace.ts

import * as fs from 'fs';
import * as path from 'path';
// Import the main logic from the app using a relative path.
import { processTextAugmentation } from '../app/lib/bon';

// --- 1. Define Trace File Path ---
// This is the "ground truth" log file for the TypeScript run.
const logPath = path.resolve(process.cwd(), 'scripts/trace_ts.log');

// --- 2. Create the Logger ---
// Clear the log file at the start of each run.
try {
  fs.writeFileSync(logPath, '');
} catch (e) {
  console.error(`[TS_TRACE] FATAL: Failed to clear log file: ${logPath}`, e);
  process.exit(1);
}

/**
 * The global log function that will be passed into the library.
 * It appends every trace message to the log file.
 */
const log = (message: string) => {
  try {
    // We must add a newline to match Python's print()
    fs.appendFileSync(logPath, message + '\\n');
  } catch (e) {
    // Log to stderr if file writing fails
    console.error(`[TS_TRACE] ERROR: Failed to write to log: ${message}`, e);
  }
};

// --- 3. Argument Parsing ---
// process.argv = [ 'node', 'esbuild-register', 'scripts/run_ts_trace.ts', ...args ]
const args = process.argv.slice(2);

if (args.length < 6) {
  const errorMsg = `[TS_TRACE] FATAL: Not enough arguments.
    Expected: <seed> <text> <sigma> <apply_scrambling> <apply_capitalization> <apply_noising>
    Received: ${args.length} arguments`;
  console.error(errorMsg);
  log(errorMsg); // Write error to the log for the diff
  process.exit(1);
}

const seed = parseInt(args[0], 10);
const text = args[1];
const sigma = parseFloat(args[2]);
const apply_scrambling = args[3] === 'true';
const apply_capitalization = args[4] === 'true';
const apply_noising = args[5] === 'true';

// --- 4. Run the Instrumented Logic ---
try {
  // This is the most important part. We call the *exact same function*
  // as the real app, but we pass in our new `log` function.
  processTextAugmentation(
    text,
    sigma,
    seed,
    apply_scrambling,
    apply_capitalization,
    apply_noising,
    0, // random_prefix_length
    0, // random_suffix_length
    log
  );

  // Let the master script know it finished.
  console.log(`[TS_TRACE] TypeScript trace complete. Log saved to ${logPath}`);

} catch (error) {
  // If the logic crashes, log the error to the trace file
  // so the diff tool can see *why* it diverged.
  const err = error as Error;
  const errorMessage = `--- TypeScript Trace FAILED ---\\n${err.stack || err.message}`;

  console.error(errorMessage); // To master's stderr
  log(errorMessage);          // To trace_ts.log
  process.exit(1);
}
