// src/examples/ExampleLoader.ts
// Utility for loading example program files

/**
 * Base path for example programs in the public folder.
 */
const PROGRAMS_PATH = '/programs/';

/**
 * Load an example program's source code.
 * @param filename - The filename (e.g., "add.asm")
 * @returns Promise resolving to the program source code
 * @throws Error if the program cannot be loaded
 */
export async function loadExampleProgram(filename: string): Promise<string> {
  const url = `${PROGRAMS_PATH}${filename}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load example program: ${filename} (${response.status})`);
  }

  return response.text();
}

/**
 * Check if an example program exists.
 * @param filename - The filename to check
 * @returns Promise resolving to true if the file exists
 */
export async function checkProgramExists(filename: string): Promise<boolean> {
  try {
    const url = `${PROGRAMS_PATH}${filename}`;
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
