import * as path from 'path';

/**
 * Validates that the provided path resolves to a location within the
 * 'prompts/msj_prompts' directory relative to the current working directory.
 *
 * @param msj_path The path to validate.
 * @throws Error If the path is outside the allowed directory.
 * @returns The absolute resolved path.
 */
export function validateMsjPath(msj_path: string): string {
  const jsonPath = path.resolve(process.cwd(), msj_path);
  const allowedDir = path.resolve(process.cwd(), 'prompts/msj_prompts');
  const relative = path.relative(allowedDir, jsonPath);

  // Use path.isAbsolute(relative) to catch paths that aren't inside the
  // base directory even if they don't start with '..' (e.g., cross-drive paths on Windows)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Access denied: msj_path must be within prompts/msj_prompts');
  }

  return jsonPath;
}
