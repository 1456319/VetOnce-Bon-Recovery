import * as path from 'path';

export const IS_WINDOWS = process.platform === 'win32';

/**
 * Returns the path to the Python executable in the virtual environment.
 * On Windows: .venv\Scripts\python.exe
 * On Posix: ./.venv/bin/python
 */
export function getPythonCommand(): string {
  if (IS_WINDOWS) {
    return path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  }
  // Use absolute path for consistency
  return path.join(process.cwd(), '.venv', 'bin', 'python');
}

/**
 * Helper to get the absolute path of a script.
 */
export function getScriptPath(scriptRelativePath: string): string {
  return path.join(process.cwd(), scriptRelativePath);
}

/**
 * Constructs a shell command string to execute a Python script.
 * Note: Use this for execSync(string).
 */
export function buildPythonCommand(scriptRelativePath: string, args: (string | number)[]): string {
  const pythonExe = getPythonCommand();
  const scriptPath = getScriptPath(scriptRelativePath);
  const argsStr = args.join(' ');

  // Wrap paths in quotes to handle spaces (common on Windows)
  return `"${pythonExe}" "${scriptPath}" ${argsStr}`;
}
