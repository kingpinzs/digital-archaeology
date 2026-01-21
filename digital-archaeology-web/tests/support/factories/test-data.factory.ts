import { faker } from '@faker-js/faker';

/**
 * Test data factories for Digital Archaeology.
 *
 * Uses @faker-js/faker to generate realistic test data.
 * All factories support overrides for specific test scenarios.
 *
 * Usage:
 *   import { createAssemblyProgram } from '../support/factories/test-data.factory';
 *   const program = createAssemblyProgram({ name: 'custom-test' });
 */

/**
 * Create a mock assembly program for testing.
 */
export const createAssemblyProgram = (overrides: Partial<AssemblyProgram> = {}): AssemblyProgram => ({
  name: faker.system.fileName({ extensionCount: 0 }) + '.asm',
  source: `; ${faker.lorem.sentence()}\nMOV A, ${faker.number.int({ min: 0, max: 15 })}\nHLT`,
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Create multiple assembly programs.
 */
export const createAssemblyPrograms = (count: number): AssemblyProgram[] =>
  Array.from({ length: count }, () => createAssemblyProgram());

/**
 * Create a mock CPU state for testing.
 */
export const createCPUState = (overrides: Partial<CPUState> = {}): CPUState => ({
  pc: faker.number.int({ min: 0, max: 255 }),
  accumulator: faker.number.int({ min: 0, max: 15 }),
  flags: {
    zero: faker.datatype.boolean(),
    carry: faker.datatype.boolean(),
    halt: false,
  },
  memory: new Uint8Array(256).fill(0),
  isRunning: false,
  ...overrides,
});

/**
 * Create a mock breakpoint for testing.
 */
export const createBreakpoint = (overrides: Partial<Breakpoint> = {}): Breakpoint => ({
  address: faker.number.int({ min: 0, max: 255 }),
  enabled: true,
  condition: null,
  ...overrides,
});

// Type definitions for test data
interface AssemblyProgram {
  name: string;
  source: string;
  createdAt: string;
}

interface CPUState {
  pc: number;
  accumulator: number;
  flags: {
    zero: boolean;
    carry: boolean;
    halt: boolean;
  };
  memory: Uint8Array;
  isRunning: boolean;
}

interface Breakpoint {
  address: number;
  enabled: boolean;
  condition: string | null;
}
