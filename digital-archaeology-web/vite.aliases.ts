// Shared path aliases for Vite and Vitest configurations
// This file is imported by both vite.config.ts and vitest.config.ts
// to ensure path aliases stay in sync.

import { resolve } from 'path';

/**
 * Create path aliases for the project.
 * @param dirname - The directory name (__dirname from the importing config)
 * @returns Record of path aliases
 */
export function createAliases(dirname: string): Record<string, string> {
  return {
    '@editor': resolve(dirname, './src/editor'),
    '@emulator': resolve(dirname, './src/emulator'),
    '@visualizer': resolve(dirname, './src/visualizer'),
    '@debugger': resolve(dirname, './src/debugger'),
    '@state': resolve(dirname, './src/state'),
    '@story': resolve(dirname, './src/story'),
    '@ui': resolve(dirname, './src/ui'),
    '@types': resolve(dirname, './src/types'),
    '@utils': resolve(dirname, './src/utils'),
  };
}
