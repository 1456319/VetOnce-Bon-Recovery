#!/bin/bash

# /app/scripts/run_master_trace.sh

# --- 1. Configuration ---
SEED=123
TEXT="Hello world, this is a test."
SIGMA=0.4
SCRAMBLING=true
CAPITALIZATION=true
NOISING=true

PY_VERIFIER_SCRIPT="scripts/run_py_verifier.py"
TS_LOG="scripts/trace_ts.log"
PY_LOG="scripts/trace_py.log"
TS_TEMP_SCRIPT="scripts/temp_trace_runner.ts"

# --- 2. Create Temporary TypeScript Runner ---
cat > "$TS_TEMP_SCRIPT" << EOL
import * as fs from 'fs';
import { PythonRandomProvider } from '../src/utils/PythonRandomProvider';
import { processTextAugmentation } from '../app/lib/bon';

const tsLogger = (message: string) => fs.appendFileSync('$TS_LOG', message + '\\n');

try {
    const rngProvider = new PythonRandomProvider($SEED);
    processTextAugmentation(
        '$TEXT',
        $SIGMA,
        $SEED,
        $SCRAMBLING,
        $CAPITALIZATION,
        $NOISING,
        0,
        0,
        tsLogger
    );
    console.log('--- TypeScript Trace finished successfully ---');
} catch (error) {
    console.error('--- TypeScript Trace FAILED ---', error);
    tsLogger('--- TypeScript Trace FAILED ---\\n' + (error as Error).stack);
    process.exit(1);
}
EOL

# --- 3. Run TypeScript Trace ---
echo "--- Running TypeScript Trace ---"
pnpm ts-node "$TS_TEMP_SCRIPT"
if [ $? -ne 0 ]; then
    echo "--- TypeScript Trace FAILED ---"
    rm "$TS_TEMP_SCRIPT"
    exit 1
fi
echo "--- TypeScript Trace finished successfully ---"
rm "$TS_TEMP_SCRIPT"


# --- 4. Run Python Verifier ---
echo "--- Running Python Verifier ---"
# Get the state objects from the PythonRandomProvider
STATES=$(pnpm ts-node -e "import { PythonRandomProvider } from './src/utils/PythonRandomProvider'; const rng = new PythonRandomProvider($SEED); console.log(JSON.stringify({std_b64: rng.std_state_b64, np_json: rng.np_state_json}))")
STD_STATE_B64=$(echo "$STATES" | node -pe 'JSON.parse(process.argv[1]).std_b64' -)
NP_STATE_JSON=$(echo "$STATES" | node -pe 'JSON.stringify(JSON.parse(process.argv[1]).np_json)' -)

python3 "$PY_VERIFIER_SCRIPT" "$STD_STATE_B64" "$NP_STATE_JSON" "$SEED" "$TEXT" "$SIGMA" "$SCRAMBLING" "$CAPITALIZATION" "$NOISING"
if [ $? -ne 0 ]; then
    echo "--- Python Verifier FAILED ---"
    exit 1
fi
echo "--- Python Verifier finished successfully ---"


# --- 5. Compare Traces ---
echo "--- Comparing Trace Files ---"
diff --unified "$PY_LOG" "$TS_LOG"
if [ $? -eq 0 ]; then
    echo "🎉🎉🎉 SUCCESS: Traces are 1:1 identical! 🎉🎉🎉"
else
    echo "\n*** DIVERGENCE FOUND ***"
fi
