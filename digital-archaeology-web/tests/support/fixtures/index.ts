import { test as base } from '@playwright/test';

/**
 * Extended test fixtures for Digital Archaeology E2E tests.
 *
 * Usage:
 *   import { test, expect } from '../support/fixtures';
 *
 * Fixtures automatically clean up after each test.
 */

type TestFixtures = {
  // Add custom fixtures here as the application grows
  // Example: authenticatedPage, testProgram, etc.
};

export const test = base.extend<TestFixtures>({
  // Fixtures will be added as features are implemented
  // Example:
  // testProgram: async ({}, use) => {
  //   const program = loadTestProgram('hello-world.asm');
  //   await use(program);
  //   // Auto-cleanup if needed
  // },
});

export { expect } from '@playwright/test';
