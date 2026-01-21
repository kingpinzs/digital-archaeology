import { describe, it, expect } from 'vitest';
import { createCPUState, createBreakpoint } from '../support/factories/test-data.factory';

describe('Test Infrastructure Validation', () => {
  it('should create mock CPU state with default values', () => {
    // GIVEN: A factory for CPU state
    // WHEN: Creating a CPU state
    const state = createCPUState();

    // THEN: It should have valid default values
    expect(state.pc).toBeGreaterThanOrEqual(0);
    expect(state.pc).toBeLessThanOrEqual(255);
    expect(state.accumulator).toBeGreaterThanOrEqual(0);
    expect(state.accumulator).toBeLessThanOrEqual(15);
    expect(state.flags).toBeDefined();
    expect(state.memory).toBeInstanceOf(Uint8Array);
    expect(state.isRunning).toBe(false);
  });

  it('should allow CPU state overrides', () => {
    // GIVEN: Custom values for CPU state
    const overrides = {
      pc: 42,
      accumulator: 7,
      isRunning: true,
    };

    // WHEN: Creating a CPU state with overrides
    const state = createCPUState(overrides);

    // THEN: Overrides should be applied
    expect(state.pc).toBe(42);
    expect(state.accumulator).toBe(7);
    expect(state.isRunning).toBe(true);
  });

  it('should create mock breakpoint', () => {
    // GIVEN: A factory for breakpoints
    // WHEN: Creating a breakpoint
    const breakpoint = createBreakpoint({ address: 100 });

    // THEN: It should have the specified address
    expect(breakpoint.address).toBe(100);
    expect(breakpoint.enabled).toBe(true);
    expect(breakpoint.condition).toBeNull();
  });
});
