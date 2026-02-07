// src/examples/ExampleLoader.ts
// Utility for loading example program files

/**
 * Default base path for example programs (Micro4, in public root).
 */
const DEFAULT_PROGRAMS_PATH = '/programs/';

/**
 * Load an example program's source code.
 * @param filename - The filename (e.g., "add.asm")
 * @param programsPath - Base path for programs directory (Story 11.2: config-driven)
 * @returns Promise resolving to the program source code
 * @throws Error if the program cannot be loaded
 */
export async function loadExampleProgram(
  filename: string,
  programsPath: string = DEFAULT_PROGRAMS_PATH,
): Promise<string> {
  const basePath = programsPath.startsWith('/') ? programsPath : `/${programsPath}`;
  const url = `${basePath}${filename}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load example program: ${filename} (${response.status})`);
  }

  return response.text();
}

/**
 * Check if an example program exists.
 * @param filename - The filename to check
 * @param programsPath - Base path for programs directory (Story 11.2: config-driven)
 * @returns Promise resolving to true if the file exists
 */
export async function checkProgramExists(
  filename: string,
  programsPath: string = DEFAULT_PROGRAMS_PATH,
): Promise<boolean> {
  try {
    const basePath = programsPath.startsWith('/') ? programsPath : `/${programsPath}`;
    const url = `${basePath}${filename}`;
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
