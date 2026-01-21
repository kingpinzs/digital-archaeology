import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns - co-located with source files
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'tests/e2e'],

    // Environment
    environment: 'jsdom',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/vite-env.d.ts'],
    },

    // Global test settings
    globals: true,

    // TypeScript support via esbuild (fast)
    typecheck: {
      enabled: false, // Use tsc separately for type checking
    },
  },
});
