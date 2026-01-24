/**
 * Emulator Worker Tests
 *
 * Tests for emulator Web Worker message handling and CPU state management.
 * Uses mocked WASM module to test worker logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isEmulatorCommand,
  readCPUState,
  handleLoadProgram,
  handleStep,
  handleRun,
  handleStop,
  handleReset,
  handleGetState,
  handleSetSpeed,
  classifyError,
  buildErrorContext,
} from './emulator.worker';
import type { EmulatorModule, EmulatorCommand, CPUState } from './types';

/**
 * Create a mock EmulatorModule for testing.
 * All functions return sensible defaults that can be overridden per test.
 */
function createMockModule(overrides: Partial<EmulatorModule> = {}): EmulatorModule {
  // Create a mock HEAPU8 with 1024 bytes
  const heapBuffer = new ArrayBuffer(1024);
  const heapU8 = new Uint8Array(heapBuffer);

  return {
    ccall: vi.fn(),
    cwrap: vi.fn(),
    HEAPU8: heapU8,
    UTF8ToString: vi.fn((ptr: number) => `error at ${ptr}`),
    _malloc: vi.fn((_size: number) => 512), // Return middle of heap
    _free: vi.fn(),

    // CPU lifecycle
    _cpu_init_instance: vi.fn(),
    _cpu_reset_instance: vi.fn(),
    _cpu_step_instance: vi.fn(() => 2), // Returns cycles used
    _cpu_load_program_instance: vi.fn(),

    // State accessors
    _get_pc: vi.fn(() => 0),
    _get_accumulator: vi.fn(() => 0),
    _get_zero_flag: vi.fn(() => 0),
    _is_halted: vi.fn(() => 0),
    _has_error: vi.fn(() => 0),
    _get_error_message: vi.fn(() => 0),
    _get_memory_ptr: vi.fn(() => 0),

    // Internal registers
    _get_ir: vi.fn(() => 0),
    _get_mar: vi.fn(() => 0),
    _get_mdr: vi.fn(() => 0),

    // Statistics
    _get_cycles: vi.fn(() => 0),
    _get_instructions: vi.fn(() => 0),

    ...overrides,
  };
}

describe('Emulator Worker', () => {
  // Mock self.postMessage for worker tests
  const mockPostMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup global mocks - self is the worker global scope
    vi.stubGlobal('self', {
      postMessage: mockPostMessage,
      setInterval: vi.fn(() => 1),
      clearInterval: vi.fn(),
    });
  });

  describe('isEmulatorCommand', () => {
    it('should accept valid LOAD_PROGRAM command with Uint8Array', () => {
      const command: EmulatorCommand = {
        type: 'LOAD_PROGRAM',
        payload: { binary: new Uint8Array([0x10, 0x20]) },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept LOAD_PROGRAM with optional startAddr', () => {
      const command: EmulatorCommand = {
        type: 'LOAD_PROGRAM',
        payload: { binary: new Uint8Array([0x10]), startAddr: 0x10 },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept LOAD_PROGRAM with array-like binary (postMessage transfer)', () => {
      // After postMessage, Uint8Array may become array-like
      const command = {
        type: 'LOAD_PROGRAM',
        payload: { binary: { 0: 0x10, 1: 0x20, length: 2 } },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should reject LOAD_PROGRAM without binary', () => {
      const command = {
        type: 'LOAD_PROGRAM',
        payload: {},
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should accept valid STEP command', () => {
      const command: EmulatorCommand = { type: 'STEP' };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept valid RUN command with speed', () => {
      const command: EmulatorCommand = {
        type: 'RUN',
        payload: { speed: 100 },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept RUN with speed 0 (max speed)', () => {
      const command: EmulatorCommand = {
        type: 'RUN',
        payload: { speed: 0 },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should reject RUN without speed', () => {
      const command = {
        type: 'RUN',
        payload: {},
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject RUN with non-number speed', () => {
      const command = {
        type: 'RUN',
        payload: { speed: 'fast' },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject RUN with NaN speed', () => {
      const command = {
        type: 'RUN',
        payload: { speed: NaN },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject RUN with Infinity speed', () => {
      const command = {
        type: 'RUN',
        payload: { speed: Infinity },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject RUN with negative Infinity speed', () => {
      const command = {
        type: 'RUN',
        payload: { speed: -Infinity },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject RUN with negative speed', () => {
      const command = {
        type: 'RUN',
        payload: { speed: -100 },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should accept valid STOP command', () => {
      const command: EmulatorCommand = { type: 'STOP' };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept valid RESET command', () => {
      const command: EmulatorCommand = { type: 'RESET' };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept valid GET_STATE command', () => {
      const command: EmulatorCommand = { type: 'GET_STATE' };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should reject null', () => {
      expect(isEmulatorCommand(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isEmulatorCommand(undefined)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(isEmulatorCommand('STEP')).toBe(false);
    });

    it('should reject unknown type', () => {
      expect(isEmulatorCommand({ type: 'UNKNOWN' })).toBe(false);
    });

    it('should reject object without type', () => {
      expect(isEmulatorCommand({ payload: {} })).toBe(false);
    });

    it('should accept valid SET_SPEED command with speed', () => {
      const command = {
        type: 'SET_SPEED',
        payload: { speed: 100 },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should accept SET_SPEED with speed 0 (max speed)', () => {
      const command = {
        type: 'SET_SPEED',
        payload: { speed: 0 },
      };
      expect(isEmulatorCommand(command)).toBe(true);
    });

    it('should reject SET_SPEED without speed', () => {
      const command = {
        type: 'SET_SPEED',
        payload: {},
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject SET_SPEED with non-number speed', () => {
      const command = {
        type: 'SET_SPEED',
        payload: { speed: 'fast' },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject SET_SPEED with NaN speed', () => {
      const command = {
        type: 'SET_SPEED',
        payload: { speed: NaN },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject SET_SPEED with Infinity speed', () => {
      const command = {
        type: 'SET_SPEED',
        payload: { speed: Infinity },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });

    it('should reject SET_SPEED with negative speed', () => {
      const command = {
        type: 'SET_SPEED',
        payload: { speed: -100 },
      };
      expect(isEmulatorCommand(command)).toBe(false);
    });
  });

  describe('readCPUState', () => {
    it('should read all CPU state fields', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 10),
        _get_accumulator: vi.fn(() => 5),
        _get_zero_flag: vi.fn(() => 1),
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
        _get_ir: vi.fn(() => 0x12),
        _get_mar: vi.fn(() => 0x34),
        _get_mdr: vi.fn(() => 0x56),
        _get_cycles: vi.fn(() => 100),
        _get_instructions: vi.fn(() => 50),
      });

      const state = readCPUState(module);

      expect(state.pc).toBe(10);
      expect(state.accumulator).toBe(5);
      expect(state.zeroFlag).toBe(true);
      expect(state.halted).toBe(false);
      expect(state.error).toBe(false);
      expect(state.errorMessage).toBeNull();
      expect(state.ir).toBe(0x12);
      expect(state.mar).toBe(0x34);
      expect(state.mdr).toBe(0x56);
      expect(state.cycles).toBe(100);
      expect(state.instructions).toBe(50);
    });

    it('should read error message when error flag is set', () => {
      const module = createMockModule({
        _has_error: vi.fn(() => 1),
        _get_error_message: vi.fn(() => 100),
        UTF8ToString: vi.fn(() => 'PC out of bounds'),
      });

      const state = readCPUState(module);

      expect(state.error).toBe(true);
      expect(state.errorMessage).toBe('PC out of bounds');
      expect(module.UTF8ToString).toHaveBeenCalledWith(100);
    });

    it('should copy memory to avoid detached buffer issues', () => {
      const module = createMockModule();

      const state = readCPUState(module);

      // Memory should be a copy (Uint8Array with 256 elements)
      expect(state.memory).toBeInstanceOf(Uint8Array);
      expect(state.memory.length).toBe(256);
    });

    it('should read halted state correctly', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 1),
      });

      const state = readCPUState(module);

      expect(state.halted).toBe(true);
    });
  });

  describe('handleLoadProgram', () => {
    it('should reset CPU before loading', () => {
      const module = createMockModule();
      const binary = new Uint8Array([0x10, 0x20, 0x30]);

      handleLoadProgram(module, binary, 0);

      expect(module._cpu_reset_instance).toHaveBeenCalled();
    });

    it('should allocate memory for program', () => {
      const module = createMockModule();
      const binary = new Uint8Array([0x10, 0x20, 0x30]);

      handleLoadProgram(module, binary, 0);

      expect(module._malloc).toHaveBeenCalledWith(3);
    });

    it('should copy program to WASM memory', () => {
      const heapBuffer = new ArrayBuffer(1024);
      const heapU8 = new Uint8Array(heapBuffer);
      const setSpy = vi.spyOn(heapU8, 'set');

      const module = createMockModule({
        HEAPU8: heapU8,
        _malloc: vi.fn(() => 512),
      });
      const binary = new Uint8Array([0x10, 0x20, 0x30]);

      handleLoadProgram(module, binary, 0);

      expect(setSpy).toHaveBeenCalledWith(binary, 512);
    });

    it('should load program into CPU at start address', () => {
      const module = createMockModule({
        _malloc: vi.fn(() => 512),
      });
      const binary = new Uint8Array([0x10, 0x20]);

      handleLoadProgram(module, binary, 0x10);

      expect(module._cpu_load_program_instance).toHaveBeenCalledWith(512, 2, 0x10);
    });

    it('should free allocated memory', () => {
      const module = createMockModule({
        _malloc: vi.fn(() => 512),
      });
      const binary = new Uint8Array([0x10]);

      handleLoadProgram(module, binary, 0);

      expect(module._free).toHaveBeenCalledWith(512);
    });

    it('should send STATE_UPDATE after loading', () => {
      const module = createMockModule();
      const binary = new Uint8Array([0x10]);

      handleLoadProgram(module, binary, 0);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATE_UPDATE',
          payload: expect.any(Object),
        })
      );
    });

    it('should handle array-like binary from postMessage', () => {
      const module = createMockModule();
      // Simulate array-like object that postMessage might produce
      const arrayLike = { 0: 0x10, 1: 0x20, length: 2 } as unknown as ArrayLike<number>;

      handleLoadProgram(module, arrayLike, 0);

      expect(module._cpu_load_program_instance).toHaveBeenCalled();
    });

    it('should default to start address 0', () => {
      const module = createMockModule({
        _malloc: vi.fn(() => 512),
      });
      const binary = new Uint8Array([0x10]);

      handleLoadProgram(module, binary);

      expect(module._cpu_load_program_instance).toHaveBeenCalledWith(512, 1, 0);
    });
  });

  describe('handleStep', () => {
    it('should execute one instruction', () => {
      const module = createMockModule();

      handleStep(module);

      expect(module._cpu_step_instance).toHaveBeenCalled();
    });

    it('should send STATE_UPDATE after step', () => {
      const module = createMockModule();

      handleStep(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATE_UPDATE',
        })
      );
    });

    it('should not step if already halted', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 1),
      });

      handleStep(module);

      expect(module._cpu_step_instance).not.toHaveBeenCalled();
    });

    it('should send HALTED event when CPU halts', () => {
      // First call: not halted (to allow step), second call: halted (after step)
      let stepCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => {
          stepCount++;
          return stepCount > 1 ? 1 : 0;
        }),
      });

      handleStep(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'HALTED' })
      );
    });

    it('should send ERROR event when CPU has error after step', () => {
      // First call: no error (to allow step), second call: error (after step)
      let callCount = 0;
      const module = createMockModule({
        _has_error: vi.fn(() => {
          callCount++;
          return callCount > 1 ? 1 : 0;
        }),
        _get_error_message: vi.fn(() => 100),
        UTF8ToString: vi.fn(() => 'Test error'),
        _get_pc: vi.fn(() => 5),
      });

      handleStep(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          payload: expect.objectContaining({
            message: 'Test error',
            address: 5,
          }),
        })
      );
    });

    it('should not step if in error state', () => {
      const module = createMockModule({
        _has_error: vi.fn(() => 1),
      });

      handleStep(module);

      expect(module._cpu_step_instance).not.toHaveBeenCalled();
    });
  });

  describe('handleRun', () => {
    it('should start interval with configured speed', () => {
      const module = createMockModule();

      handleRun(module, 100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).toHaveBeenCalledWith(expect.any(Function), 16);
      handleStop(); // Clean up
    });

    it('should use 0ms interval for max speed (speed=0)', () => {
      const module = createMockModule();

      handleRun(module, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).toHaveBeenCalledWith(expect.any(Function), 0);
      handleStop(); // Clean up
    });

    it('should not start if already running', () => {
      const module = createMockModule();

      handleRun(module, 100);
      handleRun(module, 100); // Second call should be ignored
      handleStop(); // Clean up

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).toHaveBeenCalledTimes(1);
    });

    it('should not start if already halted', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 1),
      });

      handleRun(module, 100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).not.toHaveBeenCalled();
    });

    it('should not start if in error state', () => {
      const module = createMockModule({
        _has_error: vi.fn(() => 1),
      });

      handleRun(module, 100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).not.toHaveBeenCalled();
    });
  });

  describe('handleStop', () => {
    it('should clear interval when running', () => {
      const module = createMockModule();
      handleRun(module, 100);

      handleStop();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).clearInterval).toHaveBeenCalled();
    });

    it('should be safe to call when not running', () => {
      // Should not throw
      expect(() => handleStop()).not.toThrow();
    });
  });

  describe('run loop callback execution', () => {
    let intervalCallback: (() => void) | null = null;

    beforeEach(() => {
      intervalCallback = null;
      vi.stubGlobal('self', {
        postMessage: mockPostMessage,
        setInterval: vi.fn((cb: () => void) => {
          intervalCallback = cb;
          return 1;
        }),
        clearInterval: vi.fn(),
      });
    });

    it('should stop and emit HALTED when CPU halts during run loop', () => {
      let stepCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => {
          stepCount++;
          // Halt after first step in the run loop
          return stepCount > 1 ? 1 : 0;
        }),
      });

      handleRun(module, 100);
      expect(intervalCallback).not.toBeNull();

      // Execute the run loop callback
      intervalCallback!();

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'HALTED' })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).clearInterval).toHaveBeenCalled();
    });

    it('should stop and emit ERROR when CPU errors during run loop', () => {
      let stepCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => {
          stepCount++;
          // Error after first step
          return stepCount > 1 ? 1 : 0;
        }),
        _get_error_message: vi.fn(() => 100),
        UTF8ToString: vi.fn(() => 'Division by zero'),
        _get_pc: vi.fn(() => 42),
      });

      handleRun(module, 100);
      intervalCallback!();

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          payload: expect.objectContaining({
            message: 'Division by zero',
          }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).clearInterval).toHaveBeenCalled();
    });

    it('should send STATE_UPDATE after each tick during run loop', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
        _get_pc: vi.fn(() => 10),
      });

      handleRun(module, 5); // 5 instructions per tick
      mockPostMessage.mockClear();
      intervalCallback!();

      // Should send exactly one STATE_UPDATE per tick (throttled)
      const stateUpdates = mockPostMessage.mock.calls.filter(
        (call) => call[0].type === 'STATE_UPDATE'
      );
      expect(stateUpdates.length).toBe(1);
      handleStop(); // Clean up
    });

    it('should execute correct number of instructions per tick', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 5); // 5 instructions per tick
      intervalCallback!();

      expect(module._cpu_step_instance).toHaveBeenCalledTimes(5);
      handleStop(); // Clean up
    });

    it('should execute 1000 instructions per tick at max speed (speed=0)', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 0); // Max speed
      intervalCallback!();

      expect(module._cpu_step_instance).toHaveBeenCalledTimes(1000);
      handleStop(); // Clean up
    });

    it('should check halt before each instruction in run loop', () => {
      // handleRun() does an initial halt check before starting interval,
      // then the run loop checks before each step
      // haltCheckCount: 1 (handleRun), 2 (loop iter 1 -> step), 3 (loop iter 2 -> step), 4 (loop iter 3 -> halt)
      let haltCheckCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => {
          haltCheckCount++;
          return haltCheckCount >= 4 ? 1 : 0; // Halt on 4th check (3rd loop iteration)
        }),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 10); // Would do 10 instructions
      intervalCallback!();

      // Should have stopped early due to halt
      expect(module._cpu_step_instance).toHaveBeenCalledTimes(2); // Only 2 steps before halt detected
    });

    it('should check error before each instruction in run loop', () => {
      // handleRun() does an initial error check before starting interval,
      // then the run loop checks before each step
      // errorCheckCount: 1 (handleRun), 2 (loop iter 1 -> step), 3 (loop iter 2 -> step),
      //                  4 (loop iter 3 -> step), 5 (loop iter 4 -> error)
      let errorCheckCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => {
          errorCheckCount++;
          return errorCheckCount >= 5 ? 1 : 0; // Error on 5th check (4th loop iteration)
        }),
        _get_error_message: vi.fn(() => 100),
        UTF8ToString: vi.fn(() => 'Test error'),
      });

      handleRun(module, 10);
      intervalCallback!();

      // Should have stopped early due to error
      expect(module._cpu_step_instance).toHaveBeenCalledTimes(3);
    });
  });

  describe('handleReset', () => {
    it('should call cpu_reset_instance', () => {
      const module = createMockModule();

      handleReset(module);

      expect(module._cpu_reset_instance).toHaveBeenCalled();
    });

    it('should stop any running execution', () => {
      const module = createMockModule();
      handleRun(module, 100);

      handleReset(module);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).clearInterval).toHaveBeenCalled();
    });

    it('should send STATE_UPDATE after reset', () => {
      const module = createMockModule();

      handleReset(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATE_UPDATE',
        })
      );
    });

    it('should send BREAKPOINTS_LIST with empty addresses after reset (Story 5.8)', () => {
      const module = createMockModule();

      handleReset(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [] },
        })
      );
    });
  });

  describe('handleGetState', () => {
    it('should send STATE_UPDATE with current state', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 42),
        _get_accumulator: vi.fn(() => 7),
      });

      handleGetState(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STATE_UPDATE',
          payload: expect.objectContaining({
            pc: 42,
            accumulator: 7,
          }),
        })
      );
    });

    it('should not modify CPU state', () => {
      const module = createMockModule();

      handleGetState(module);

      expect(module._cpu_step_instance).not.toHaveBeenCalled();
      expect(module._cpu_reset_instance).not.toHaveBeenCalled();
    });
  });

  describe('handleSetSpeed (Story 4.8)', () => {
    let intervalCallback: (() => void) | null = null;

    beforeEach(() => {
      intervalCallback = null;
      vi.stubGlobal('self', {
        postMessage: mockPostMessage,
        setInterval: vi.fn((cb: () => void) => {
          intervalCallback = cb;
          return 1;
        }),
        clearInterval: vi.fn(),
      });
    });

    it('should do nothing if not currently running', () => {
      const module = createMockModule();
      // Don't call handleRun first - not running

      handleSetSpeed(module, 200);

      // Should not have cleared or set any intervals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).clearInterval).not.toHaveBeenCalled();
      // setInterval should not have been called for setSpeed (only for run)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).not.toHaveBeenCalled();
    });

    it('should update running interval with new speed', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      // Start running at speed 100
      handleRun(module, 100);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).toHaveBeenCalledTimes(1);

      // Change speed to 200
      handleSetSpeed(module, 200);

      // Should have cleared old interval and started new one
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).clearInterval).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((self as any).setInterval).toHaveBeenCalledTimes(2);

      handleStop(); // Clean up
    });

    it('should use 0ms interval for max speed (speed=0)', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 100);
      handleSetSpeed(module, 0);

      // Second setInterval call should use 0ms for max speed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setIntervalCalls = (self as any).setInterval.mock.calls;
      expect(setIntervalCalls[setIntervalCalls.length - 1][1]).toBe(0);

      handleStop(); // Clean up
    });

    it('should use 16ms interval for throttled speed', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 0); // Start at max speed (0ms interval)
      handleSetSpeed(module, 60); // Change to throttled speed

      // Second setInterval call should use 16ms for throttled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setIntervalCalls = (self as any).setInterval.mock.calls;
      expect(setIntervalCalls[setIntervalCalls.length - 1][1]).toBe(16);

      handleStop(); // Clean up
    });

    it('should execute correct number of instructions per tick after speed change', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 5); // 5 instructions per tick
      handleSetSpeed(module, 10); // Change to 10 instructions per tick

      // Execute the run loop callback (from the new setInterval)
      intervalCallback!();

      // Should execute 10 instructions (new speed)
      expect(module._cpu_step_instance).toHaveBeenCalledTimes(10);

      handleStop(); // Clean up
    });

    it('should execute 1000 instructions per tick at max speed after speed change', () => {
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => 0),
      });

      handleRun(module, 5); // Start at 5 instructions per tick
      handleSetSpeed(module, 0); // Change to max speed

      // Execute the run loop callback
      intervalCallback!();

      expect(module._cpu_step_instance).toHaveBeenCalledTimes(1000);

      handleStop(); // Clean up
    });
  });

  describe('CPUState structure', () => {
    it('should include all required fields', () => {
      const module = createMockModule();
      const state = readCPUState(module);

      // Type check - all fields should exist
      const requiredFields: (keyof CPUState)[] = [
        'pc',
        'accumulator',
        'zeroFlag',
        'halted',
        'error',
        'errorMessage',
        'memory',
        'ir',
        'mar',
        'mdr',
        'cycles',
        'instructions',
      ];

      for (const field of requiredFields) {
        expect(field in state).toBe(true);
      }
    });

    it('should have memory as Uint8Array with 256 elements', () => {
      const module = createMockModule();
      const state = readCPUState(module);

      expect(state.memory).toBeInstanceOf(Uint8Array);
      expect(state.memory.length).toBe(256);
    });
  });

  describe('Error handling', () => {
    it('should handle step when CPU transitions to error state', () => {
      let hasErrorCallCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => {
          hasErrorCallCount++;
          // No error initially, error after step
          return hasErrorCallCount > 1 ? 1 : 0;
        }),
        _get_error_message: vi.fn(() => 100),
        UTF8ToString: vi.fn(() => 'Runtime error'),
        _get_pc: vi.fn(() => 10),
      });

      handleStep(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          payload: expect.objectContaining({
            message: 'Runtime error',
            address: 10,
            context: expect.objectContaining({
              errorType: 'UNKNOWN_ERROR',
              pc: 10,
            }),
          }),
        })
      );
    });

    it('should include rich error context with instruction details (Story 5.10)', () => {
      let hasErrorCallCount = 0;
      const module = createMockModule({
        _is_halted: vi.fn(() => 0),
        _has_error: vi.fn(() => {
          hasErrorCallCount++;
          // No error initially, error after step
          return hasErrorCallCount > 1 ? 1 : 0;
        }),
        _get_error_message: vi.fn(() => 100),
        UTF8ToString: vi.fn(() => 'Invalid memory address'),
        _get_pc: vi.fn(() => 0x05),
        _get_ir: vi.fn(() => 0x6a), // STO instruction (opcode 0x6)
      });

      handleStep(module);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          payload: expect.objectContaining({
            message: 'Invalid memory address',
            address: 0x05,
            context: expect.objectContaining({
              errorType: 'MEMORY_ERROR',
              pc: 0x05,
              instruction: 'STO',
              opcode: 0x6,
              componentName: 'Memory Controller',
            }),
          }),
        })
      );
    });
  });

  describe('classifyError (Story 5.10)', () => {
    it('should classify memory-related errors as MEMORY_ERROR', () => {
      expect(classifyError('Invalid memory access')).toBe('MEMORY_ERROR');
      expect(classifyError('Bad address 0xFF')).toBe('MEMORY_ERROR');
      expect(classifyError('Memory out of bounds')).toBe('MEMORY_ERROR');
    });

    it('should classify arithmetic errors as ARITHMETIC_WARNING', () => {
      expect(classifyError('Arithmetic overflow')).toBe('ARITHMETIC_WARNING');
      expect(classifyError('Division by zero')).toBe('ARITHMETIC_WARNING');
      expect(classifyError('Overflow detected')).toBe('ARITHMETIC_WARNING');
    });

    it('should classify instruction errors as INVALID_OPCODE', () => {
      expect(classifyError('Unknown opcode 0xF')).toBe('INVALID_OPCODE');
      expect(classifyError('Invalid instruction')).toBe('INVALID_OPCODE');
      expect(classifyError('Unrecognized opcode')).toBe('INVALID_OPCODE');
    });

    // Code Review Fix #6: Test for standalone "unknown" keyword
    it('should classify errors containing "unknown" as INVALID_OPCODE', () => {
      expect(classifyError('Unknown error type')).toBe('INVALID_OPCODE');
      expect(classifyError('unknown')).toBe('INVALID_OPCODE');
    });

    it('should classify stack errors as STACK_OVERFLOW', () => {
      expect(classifyError('Stack overflow')).toBe('STACK_OVERFLOW');
      expect(classifyError('Stack underflow')).toBe('STACK_OVERFLOW');
    });

    it('should return UNKNOWN_ERROR for unclassified messages', () => {
      expect(classifyError('Something went wrong')).toBe('UNKNOWN_ERROR');
      expect(classifyError('')).toBe('UNKNOWN_ERROR');
      expect(classifyError('Runtime error')).toBe('UNKNOWN_ERROR');
    });

    it('should be case-insensitive', () => {
      expect(classifyError('MEMORY ERROR')).toBe('MEMORY_ERROR');
      expect(classifyError('Stack OVERFLOW')).toBe('STACK_OVERFLOW');
    });
  });

  describe('buildErrorContext (Story 5.10)', () => {
    it('should build context with all required fields', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 0x10),
        _get_ir: vi.fn(() => 0x4a), // LDA instruction (opcode 0x4)
      });

      const context = buildErrorContext(module, 'Memory error');

      expect(context.errorType).toBe('MEMORY_ERROR');
      expect(context.pc).toBe(0x10);
      expect(context.instruction).toBe('LDA');
      expect(context.opcode).toBe(0x4);
      expect(context.componentName).toBe('Memory Controller');
    });

    it('should map ALU opcodes to ALU component', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 0x00),
        _get_ir: vi.fn(() => 0x1a), // ADD instruction (opcode 0x1)
      });

      const context = buildErrorContext(module, 'Overflow');

      expect(context.instruction).toBe('ADD');
      expect(context.opcode).toBe(0x1);
      expect(context.componentName).toBe('ALU');
    });

    it('should map control flow opcodes to Control Unit', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 0x08),
        _get_ir: vi.fn(() => 0x70), // JMP instruction (opcode 0x7)
      });

      const context = buildErrorContext(module, 'Bad jump');

      expect(context.instruction).toBe('JMP');
      expect(context.opcode).toBe(0x7);
      expect(context.componentName).toBe('Control Unit');
    });

    it('should map I/O opcodes to I/O Controller', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 0x0c),
        _get_ir: vi.fn(() => 0xa0), // OUT instruction (opcode 0xa)
      });

      const context = buildErrorContext(module, 'I/O error');

      expect(context.instruction).toBe('OUT');
      expect(context.opcode).toBe(0xa);
      expect(context.componentName).toBe('I/O Controller');
    });

    it('should handle reserved opcodes gracefully', () => {
      const module = createMockModule({
        _get_pc: vi.fn(() => 0x00),
        _get_ir: vi.fn(() => 0xc0), // Reserved opcode 0xc
      });

      const context = buildErrorContext(module, 'Unknown error');

      // Code Review Fix #4: Reserved opcodes now show 'RES' instead of 'NOP'
      expect(context.instruction).toBe('RES');
      expect(context.opcode).toBe(0xc);
      expect(context.componentName).toBe('Control Unit');
    });
  });
});
