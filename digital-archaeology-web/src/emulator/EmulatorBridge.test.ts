/**
 * EmulatorBridge Tests
 *
 * Tests for the Promise-based Emulator Web Worker bridge.
 * Uses mocked Worker to test message passing and event handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmulatorBridge } from './EmulatorBridge';
import type { CPUState, EmulatorEvent } from './types';

// Mock Worker class
class MockWorker {
  private messageListeners: Array<(e: MessageEvent) => void> = [];
  private errorListeners: Array<(e: ErrorEvent) => void> = [];

  postMessage = vi.fn();
  terminate = vi.fn();

  addEventListener(
    type: string,
    listener: ((e: MessageEvent) => void) | ((e: ErrorEvent) => void)
  ): void {
    if (type === 'message') {
      this.messageListeners.push(listener as (e: MessageEvent) => void);
    } else if (type === 'error') {
      this.errorListeners.push(listener as (e: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: string,
    listener: ((e: MessageEvent) => void) | ((e: ErrorEvent) => void)
  ): void {
    if (type === 'message') {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    } else if (type === 'error') {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
    }
  }

  // Helper to simulate messages from worker
  simulateMessage(data: EmulatorEvent): void {
    const event = { data } as MessageEvent;
    this.messageListeners.forEach((listener) => listener(event));
  }

  // Helper to simulate worker errors
  simulateError(message: string): void {
    const event = { message } as ErrorEvent;
    this.errorListeners.forEach((listener) => listener(event));
  }

  // Helper to get message listener count
  getMessageListenerCount(): number {
    return this.messageListeners.length;
  }
}

// Create a sample CPU state for testing
function createMockCPUState(overrides: Partial<CPUState> = {}): CPUState {
  return {
    pc: 0,
    accumulator: 0,
    zeroFlag: true,
    halted: false,
    error: false,
    errorMessage: null,
    memory: new Uint8Array(256),
    ir: 0,
    mar: 0,
    mdr: 0,
    cycles: 0,
    instructions: 0,
    ...overrides,
  };
}

// Track Worker constructor calls
let workerCallCount = 0;

describe('EmulatorBridge', () => {
  let mockWorker: MockWorker;
  let bridge: EmulatorBridge;
  let originalWorker: typeof Worker;

  beforeEach(() => {
    mockWorker = new MockWorker();
    workerCallCount = 0;

    // Store original Worker
    originalWorker = globalThis.Worker;

    // Mock Worker constructor as a class that returns mockWorker
    class MockWorkerConstructor {
      constructor() {
        workerCallCount++;
        return mockWorker;
      }
    }

    vi.stubGlobal('Worker', MockWorkerConstructor);

    bridge = new EmulatorBridge();
  });

  afterEach(() => {
    bridge.terminate();
    vi.unstubAllGlobals();
    globalThis.Worker = originalWorker;
  });

  // Helper to check Worker constructor call count
  function expectWorkerCallCount(count: number): void {
    expect(workerCallCount).toBe(count);
  }

  describe('init()', () => {
    it('should create worker and wait for EMULATOR_READY', async () => {
      const initPromise = bridge.init();

      // Simulate EMULATOR_READY
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });

      await initPromise;

      expect(bridge.isReady).toBe(true);
      expectWorkerCallCount(1);
    });

    it('should return same promise if called multiple times during init', async () => {
      const promise1 = bridge.init();
      const promise2 = bridge.init();

      expect(promise1).toBe(promise2);

      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });

      await promise1;
      await promise2;

      expectWorkerCallCount(1);
    });

    it('should return immediately if already initialized', async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;

      // Create new mock to ensure no new worker is created
      const initPromise2 = bridge.init();
      await initPromise2;

      expectWorkerCallCount(1);
    });

    it('should reject on ERROR during initialization', async () => {
      const initPromise = bridge.init();

      mockWorker.simulateMessage({
        type: 'ERROR',
        payload: { message: 'WASM load failed' },
      });

      await expect(initPromise).rejects.toThrow('WASM load failed');
      expect(bridge.isReady).toBe(false);
    });

    it('should reject on worker error during initialization', async () => {
      const initPromise = bridge.init();

      mockWorker.simulateError('Worker script error');

      await expect(initPromise).rejects.toThrow('Worker error: Worker script error');
      expect(bridge.isReady).toBe(false);
    });

    it('should reject on timeout', async () => {
      vi.useFakeTimers();

      const initPromise = bridge.init();

      // Fast-forward past timeout
      vi.advanceTimersByTime(31000);

      await expect(initPromise).rejects.toThrow('Emulator initialization timed out');

      vi.useRealTimers();
    });
  });

  describe('loadProgram()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send LOAD_PROGRAM command with binary', async () => {
      const binary = new Uint8Array([0x1a, 0x0f, 0x00]); // LDA 0F, HLT
      const loadPromise = bridge.loadProgram(binary);

      const expectedState = createMockCPUState({ pc: 0 });
      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: expectedState,
      });

      await loadPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'LOAD_PROGRAM',
        payload: { binary, startAddr: 0 },
      });
    });

    it('should accept optional startAddr parameter', async () => {
      const binary = new Uint8Array([0x00]);
      const loadPromise = bridge.loadProgram(binary, 0x10);

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState(),
      });

      await loadPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'LOAD_PROGRAM',
        payload: { binary, startAddr: 0x10 },
      });
    });

    it('should return CPUState from STATE_UPDATE', async () => {
      const binary = new Uint8Array([0x00]);
      const loadPromise = bridge.loadProgram(binary);

      const expectedState = createMockCPUState({
        pc: 0,
        accumulator: 0,
        memory: new Uint8Array(256).fill(0),
      });
      // Set first byte to match binary
      expectedState.memory[0] = 0x00;

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: expectedState,
      });

      const result = await loadPromise;

      expect(result.pc).toBe(0);
      expect(result.accumulator).toBe(0);
    });

    it('should throw if not initialized', async () => {
      const uninitializedBridge = new EmulatorBridge();
      const binary = new Uint8Array([0x00]);

      await expect(uninitializedBridge.loadProgram(binary)).rejects.toThrow(
        'EmulatorBridge not initialized. Call init() first.'
      );

      uninitializedBridge.terminate();
    });
  });

  describe('step()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send STEP command', async () => {
      const stepPromise = bridge.step();

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState({ pc: 2, instructions: 1 }),
      });

      await stepPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'STEP' });
    });

    it('should return new CPUState after step', async () => {
      const stepPromise = bridge.step();

      const expectedState = createMockCPUState({
        pc: 2,
        accumulator: 5,
        instructions: 1,
        cycles: 3,
      });

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: expectedState,
      });

      const result = await stepPromise;

      expect(result.pc).toBe(2);
      expect(result.accumulator).toBe(5);
      expect(result.instructions).toBe(1);
    });

    it('should handle HALTED event', async () => {
      const stepPromise = bridge.step();

      // Worker sends HALTED - bridge internally calls getState()
      mockWorker.simulateMessage({ type: 'HALTED' });

      // Wait for getState command to be sent, then respond
      await vi.waitFor(() => {
        const calls = mockWorker.postMessage.mock.calls;
        const hasGetState = calls.some((call) => call[0]?.type === 'GET_STATE');
        expect(hasGetState).toBe(true);
      });

      // Respond to getState with halted state
      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState({ halted: true }),
      });

      const result = await stepPromise;

      expect(result.halted).toBe(true);
    });

    it('should reject on ERROR event', async () => {
      const stepPromise = bridge.step();

      mockWorker.simulateMessage({
        type: 'ERROR',
        payload: { message: 'Invalid instruction', address: 5 },
      });

      await expect(stepPromise).rejects.toThrow('Invalid instruction');
    });

    it('should reject on worker error during operation', async () => {
      const stepPromise = bridge.step();

      mockWorker.simulateError('Unexpected worker crash');

      await expect(stepPromise).rejects.toThrow('Worker error: Unexpected worker crash');
    });
  });

  describe('run()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send RUN command with speed', () => {
      bridge.run(60);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'RUN',
        payload: { speed: 60 },
      });
    });

    it('should send RUN command with max speed (0)', () => {
      bridge.run(0);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'RUN',
        payload: { speed: 0 },
      });
    });

    it('should ignore subsequent run() calls while running', () => {
      bridge.run(60);
      bridge.run(100);
      bridge.run(200);

      // Only one RUN command should be sent
      const runCalls = mockWorker.postMessage.mock.calls.filter(
        (call) => call[0]?.type === 'RUN'
      );
      expect(runCalls.length).toBe(1);
      expect(runCalls[0][0].payload.speed).toBe(60);
    });

    it('should throw if not initialized', async () => {
      const uninitializedBridge = new EmulatorBridge();

      expect(() => uninitializedBridge.run(60)).toThrow(
        'EmulatorBridge not initialized. Call init() first.'
      );

      uninitializedBridge.terminate();
    });
  });

  describe('setSpeed() (Story 4.8)', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send SET_SPEED command when running', () => {
      bridge.run(60);
      bridge.setSpeed(100);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'SET_SPEED',
        payload: { speed: 100 },
      });
    });

    it('should not send SET_SPEED command when not running', () => {
      bridge.setSpeed(100);

      const setSpeedCalls = mockWorker.postMessage.mock.calls.filter(
        (call) => call[0]?.type === 'SET_SPEED'
      );
      expect(setSpeedCalls.length).toBe(0);
    });

    it('should send SET_SPEED with max speed (0)', () => {
      bridge.run(60);
      bridge.setSpeed(0);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'SET_SPEED',
        payload: { speed: 0 },
      });
    });

    it('should throw if not initialized', async () => {
      const uninitializedBridge = new EmulatorBridge();

      expect(() => uninitializedBridge.setSpeed(100)).toThrow(
        'EmulatorBridge not initialized. Call init() first.'
      );

      uninitializedBridge.terminate();
    });
  });

  describe('stop()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send STOP command', async () => {
      bridge.run(60);
      const stopPromise = bridge.stop();

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState({ pc: 10 }),
      });

      await stopPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'STOP' });
    });

    it('should return current CPUState', async () => {
      bridge.run(60);
      const stopPromise = bridge.stop();

      const expectedState = createMockCPUState({
        pc: 42,
        accumulator: 7,
        instructions: 21,
      });

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: expectedState,
      });

      const result = await stopPromise;

      expect(result.pc).toBe(42);
      expect(result.accumulator).toBe(7);
      expect(result.instructions).toBe(21);
    });

    it('should clear isRunning flag', async () => {
      bridge.run(60);

      const stopPromise = bridge.stop();
      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState(),
      });
      await stopPromise;

      // Should be able to run again
      bridge.run(100);

      const runCalls = mockWorker.postMessage.mock.calls.filter(
        (call) => call[0]?.type === 'RUN'
      );
      expect(runCalls.length).toBe(2);
    });
  });

  describe('reset()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send RESET command', async () => {
      const resetPromise = bridge.reset();

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState(),
      });

      await resetPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'RESET' });
    });

    it('should return initial CPUState', async () => {
      const resetPromise = bridge.reset();

      const expectedState = createMockCPUState({
        pc: 0,
        accumulator: 0,
        zeroFlag: true,
        halted: false,
        cycles: 0,
        instructions: 0,
      });

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: expectedState,
      });

      const result = await resetPromise;

      expect(result.pc).toBe(0);
      expect(result.accumulator).toBe(0);
      expect(result.halted).toBe(false);
      expect(result.cycles).toBe(0);
    });

    it('should stop running execution first and wait for completion', async () => {
      bridge.run(60);

      const resetPromise = bridge.reset();

      // First, STOP is sent and needs STATE_UPDATE response
      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState({ pc: 10 }),
      });

      // Then RESET is sent after STOP completes, needs its own STATE_UPDATE
      // Use setTimeout to ensure RESET message is sent before we respond
      await new Promise((resolve) => setTimeout(resolve, 0));

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState({ pc: 0 }),
      });

      const result = await resetPromise;

      // Verify STOP was sent before RESET
      const calls = mockWorker.postMessage.mock.calls.map((call) => call[0]?.type);
      const stopIndex = calls.indexOf('STOP');
      const resetIndex = calls.indexOf('RESET');

      expect(stopIndex).toBeLessThan(resetIndex);
      expect(result.pc).toBe(0); // Reset state
    });
  });

  describe('getState()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should send GET_STATE command', async () => {
      const getStatePromise = bridge.getState();

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState(),
      });

      await getStatePromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'GET_STATE' });
    });

    it('should return current CPUState', async () => {
      const getStatePromise = bridge.getState();

      const expectedState = createMockCPUState({
        pc: 100,
        accumulator: 15,
        zeroFlag: false,
        cycles: 500,
      });

      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: expectedState,
      });

      const result = await getStatePromise;

      expect(result.pc).toBe(100);
      expect(result.accumulator).toBe(15);
      expect(result.zeroFlag).toBe(false);
      expect(result.cycles).toBe(500);
    });
  });

  describe('event subscriptions', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    describe('onStateUpdate', () => {
      it('should fire callback on STATE_UPDATE events', () => {
        const callback = vi.fn();
        bridge.onStateUpdate(callback);

        const state = createMockCPUState({ pc: 10 });
        mockWorker.simulateMessage({
          type: 'STATE_UPDATE',
          payload: state,
        });

        expect(callback).toHaveBeenCalledWith(state);
      });

      it('should fire multiple callbacks', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        bridge.onStateUpdate(callback1);
        bridge.onStateUpdate(callback2);

        const state = createMockCPUState();
        mockWorker.simulateMessage({
          type: 'STATE_UPDATE',
          payload: state,
        });

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = bridge.onStateUpdate(callback);

        unsubscribe();

        mockWorker.simulateMessage({
          type: 'STATE_UPDATE',
          payload: createMockCPUState(),
        });

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('onHalted', () => {
      it('should fire callback on HALTED events', () => {
        const callback = vi.fn();
        bridge.onHalted(callback);

        mockWorker.simulateMessage({ type: 'HALTED' });

        expect(callback).toHaveBeenCalled();
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = bridge.onHalted(callback);

        unsubscribe();

        mockWorker.simulateMessage({ type: 'HALTED' });

        expect(callback).not.toHaveBeenCalled();
      });

      it('should clear isRunning flag on HALTED', () => {
        bridge.run(60);

        mockWorker.simulateMessage({ type: 'HALTED' });

        // Should be able to run again
        bridge.run(100);

        const runCalls = mockWorker.postMessage.mock.calls.filter(
          (call) => call[0]?.type === 'RUN'
        );
        expect(runCalls.length).toBe(2);
      });
    });

    describe('onError', () => {
      it('should fire callback on ERROR events', () => {
        const callback = vi.fn();
        bridge.onError(callback);

        const errorPayload = { message: 'Runtime error', address: 42 };
        mockWorker.simulateMessage({
          type: 'ERROR',
          payload: errorPayload,
        });

        expect(callback).toHaveBeenCalledWith(errorPayload);
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = bridge.onError(callback);

        unsubscribe();

        mockWorker.simulateMessage({
          type: 'ERROR',
          payload: { message: 'Error' },
        });

        expect(callback).not.toHaveBeenCalled();
      });

      it('should clear isRunning flag on ERROR', () => {
        bridge.run(60);

        mockWorker.simulateMessage({
          type: 'ERROR',
          payload: { message: 'Error' },
        });

        // Should be able to run again
        bridge.run(100);

        const runCalls = mockWorker.postMessage.mock.calls.filter(
          (call) => call[0]?.type === 'RUN'
        );
        expect(runCalls.length).toBe(2);
      });

      it('should pass rich error context to callback (Story 5.10)', () => {
        const callback = vi.fn();
        bridge.onError(callback);

        const errorPayload = {
          message: 'Invalid memory address',
          address: 0x05,
          context: {
            errorType: 'MEMORY_ERROR' as const,
            pc: 0x05,
            instruction: 'STO',
            opcode: 0x6,
            componentName: 'Memory Controller',
          },
        };
        mockWorker.simulateMessage({
          type: 'ERROR',
          payload: errorPayload,
        });

        expect(callback).toHaveBeenCalledWith(errorPayload);
        expect(callback.mock.calls[0][0].context).toEqual({
          errorType: 'MEMORY_ERROR',
          pc: 0x05,
          instruction: 'STO',
          opcode: 0x6,
          componentName: 'Memory Controller',
        });
      });
    });
  });

  describe('terminate()', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should terminate worker', () => {
      bridge.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should clear all subscriptions', () => {
      const stateCallback = vi.fn();
      const haltedCallback = vi.fn();
      const errorCallback = vi.fn();

      bridge.onStateUpdate(stateCallback);
      bridge.onHalted(haltedCallback);
      bridge.onError(errorCallback);

      bridge.terminate();

      // After terminate, bridge is not ready
      expect(bridge.isReady).toBe(false);

      // Simulate messages on the old worker - callbacks should NOT fire
      // because terminate() clears all subscriptions
      mockWorker.simulateMessage({
        type: 'STATE_UPDATE',
        payload: createMockCPUState(),
      });
      mockWorker.simulateMessage({ type: 'HALTED' });
      mockWorker.simulateMessage({
        type: 'ERROR',
        payload: { message: 'Error' },
      });

      // Callbacks should not be called because subscriptions were cleared
      expect(stateCallback).not.toHaveBeenCalled();
      expect(haltedCallback).not.toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should remove permanent message listener', () => {
      // Get initial listener count
      const listenerCountBefore = mockWorker.getMessageListenerCount();
      expect(listenerCountBefore).toBeGreaterThan(0);

      bridge.terminate();

      // Listener should be removed
      const listenerCountAfter = mockWorker.getMessageListenerCount();
      expect(listenerCountAfter).toBe(0);
    });

    it('should reset initialized flag', () => {
      expect(bridge.isReady).toBe(true);

      bridge.terminate();

      expect(bridge.isReady).toBe(false);
    });

    it('should clear isRunning flag', async () => {
      bridge.run(60);
      bridge.terminate();

      // Create a fresh mock and bridge
      const freshMockWorker = new MockWorker();

      // Re-stub Worker to return freshMockWorker
      class FreshMockWorkerConstructor {
        constructor() {
          return freshMockWorker;
        }
      }
      vi.stubGlobal('Worker', FreshMockWorkerConstructor);

      const newBridge = new EmulatorBridge();
      const initPromise = newBridge.init();
      freshMockWorker.simulateMessage({ type: 'EMULATOR_READY' });

      await initPromise;

      // Should be able to run immediately (not blocked by old isRunning)
      newBridge.run(100);
      expect(freshMockWorker.postMessage).toHaveBeenCalledWith({
        type: 'RUN',
        payload: { speed: 100 },
      });
      newBridge.terminate();
    });

    it('should handle multiple terminate calls gracefully', () => {
      bridge.terminate();
      bridge.terminate();
      bridge.terminate();

      // Should not throw
      expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
    });
  });

  describe('isReady', () => {
    it('should be false before init', () => {
      const newBridge = new EmulatorBridge();
      expect(newBridge.isReady).toBe(false);
      newBridge.terminate();
    });

    it('should be true after successful init', async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;

      expect(bridge.isReady).toBe(true);
    });

    it('should be false after terminate', async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;

      bridge.terminate();

      expect(bridge.isReady).toBe(false);
    });
  });

  describe('timeout handling', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    it('should reject loadProgram on timeout', async () => {
      vi.useFakeTimers();

      const loadPromise = bridge.loadProgram(new Uint8Array([0x00]));

      vi.advanceTimersByTime(11000);

      await expect(loadPromise).rejects.toThrow('LOAD_PROGRAM operation timed out');

      vi.useRealTimers();
    });

    it('should reject step on timeout', async () => {
      vi.useFakeTimers();

      const stepPromise = bridge.step();

      vi.advanceTimersByTime(11000);

      await expect(stepPromise).rejects.toThrow('STEP operation timed out');

      vi.useRealTimers();
    });

    it('should reject stop on timeout', async () => {
      vi.useFakeTimers();

      const stopPromise = bridge.stop();

      vi.advanceTimersByTime(11000);

      await expect(stopPromise).rejects.toThrow('STOP operation timed out');

      vi.useRealTimers();
    });

    it('should reject reset on timeout', async () => {
      vi.useFakeTimers();

      const resetPromise = bridge.reset();

      vi.advanceTimersByTime(11000);

      await expect(resetPromise).rejects.toThrow('RESET operation timed out');

      vi.useRealTimers();
    });

    it('should reject getState on timeout', async () => {
      vi.useFakeTimers();

      const getStatePromise = bridge.getState();

      vi.advanceTimersByTime(11000);

      await expect(getStatePromise).rejects.toThrow('GET_STATE operation timed out');

      vi.useRealTimers();
    });
  });

  describe('breakpoint methods (Story 5.8)', () => {
    beforeEach(async () => {
      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'EMULATOR_READY' });
      await initPromise;
    });

    describe('setBreakpoint()', () => {
      it('should send SET_BREAKPOINT command with address', async () => {
        const setPromise = bridge.setBreakpoint(0x10);

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x10] },
        });

        await setPromise;

        expect(mockWorker.postMessage).toHaveBeenCalledWith({
          type: 'SET_BREAKPOINT',
          payload: { address: 0x10 },
        });
      });

      it('should resolve when BREAKPOINTS_LIST received', async () => {
        const setPromise = bridge.setBreakpoint(0x20);

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x20] },
        });

        await expect(setPromise).resolves.toBeUndefined();
      });

      it('should throw if not initialized', async () => {
        const uninitializedBridge = new EmulatorBridge();

        await expect(uninitializedBridge.setBreakpoint(0x10)).rejects.toThrow(
          'EmulatorBridge not initialized. Call init() first.'
        );

        uninitializedBridge.terminate();
      });

      it('should reject on timeout', async () => {
        vi.useFakeTimers();

        const setPromise = bridge.setBreakpoint(0x10);

        vi.advanceTimersByTime(11000);

        await expect(setPromise).rejects.toThrow('SET_BREAKPOINT operation timed out');

        vi.useRealTimers();
      });
    });

    describe('clearBreakpoint()', () => {
      it('should send CLEAR_BREAKPOINT command with address', async () => {
        const clearPromise = bridge.clearBreakpoint(0x10);

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [] },
        });

        await clearPromise;

        expect(mockWorker.postMessage).toHaveBeenCalledWith({
          type: 'CLEAR_BREAKPOINT',
          payload: { address: 0x10 },
        });
      });

      it('should resolve when BREAKPOINTS_LIST received', async () => {
        const clearPromise = bridge.clearBreakpoint(0x20);

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [] },
        });

        await expect(clearPromise).resolves.toBeUndefined();
      });

      it('should throw if not initialized', async () => {
        const uninitializedBridge = new EmulatorBridge();

        await expect(uninitializedBridge.clearBreakpoint(0x10)).rejects.toThrow(
          'EmulatorBridge not initialized. Call init() first.'
        );

        uninitializedBridge.terminate();
      });
    });

    describe('getBreakpoints()', () => {
      it('should send GET_BREAKPOINTS command', async () => {
        const getPromise = bridge.getBreakpoints();

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x10, 0x20] },
        });

        await getPromise;

        expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'GET_BREAKPOINTS' });
      });

      it('should return breakpoint addresses array', async () => {
        const getPromise = bridge.getBreakpoints();

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x05, 0x10, 0xff] },
        });

        const result = await getPromise;

        expect(result).toEqual([0x05, 0x10, 0xff]);
      });

      it('should return empty array when no breakpoints', async () => {
        const getPromise = bridge.getBreakpoints();

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [] },
        });

        const result = await getPromise;

        expect(result).toEqual([]);
      });

      it('should throw if not initialized', async () => {
        const uninitializedBridge = new EmulatorBridge();

        await expect(uninitializedBridge.getBreakpoints()).rejects.toThrow(
          'EmulatorBridge not initialized. Call init() first.'
        );

        uninitializedBridge.terminate();
      });
    });

    describe('onBreakpointHit()', () => {
      it('should fire callback on BREAKPOINT_HIT events', () => {
        const callback = vi.fn();
        bridge.onBreakpointHit(callback);

        mockWorker.simulateMessage({
          type: 'BREAKPOINT_HIT',
          payload: { address: 0x42 },
        });

        expect(callback).toHaveBeenCalledWith(0x42);
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = bridge.onBreakpointHit(callback);

        unsubscribe();

        mockWorker.simulateMessage({
          type: 'BREAKPOINT_HIT',
          payload: { address: 0x10 },
        });

        expect(callback).not.toHaveBeenCalled();
      });

      it('should clear isRunning flag on BREAKPOINT_HIT', () => {
        bridge.run(60);

        mockWorker.simulateMessage({
          type: 'BREAKPOINT_HIT',
          payload: { address: 0x10 },
        });

        // Should be able to run again
        bridge.run(100);

        const runCalls = mockWorker.postMessage.mock.calls.filter(
          (call) => call[0]?.type === 'RUN'
        );
        expect(runCalls.length).toBe(2);
      });
    });

    describe('onBreakpointsChange()', () => {
      it('should fire callback on BREAKPOINTS_LIST events', () => {
        const callback = vi.fn();
        bridge.onBreakpointsChange(callback);

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x10, 0x20] },
        });

        expect(callback).toHaveBeenCalledWith([0x10, 0x20]);
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = bridge.onBreakpointsChange(callback);

        unsubscribe();

        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x10] },
        });

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('terminate() cleans up breakpoint subscriptions', () => {
      it('should clear breakpoint subscriptions on terminate', () => {
        const breakpointHitCallback = vi.fn();
        const breakpointsChangeCallback = vi.fn();

        bridge.onBreakpointHit(breakpointHitCallback);
        bridge.onBreakpointsChange(breakpointsChangeCallback);

        bridge.terminate();

        // Simulate messages on the old worker - callbacks should NOT fire
        mockWorker.simulateMessage({
          type: 'BREAKPOINT_HIT',
          payload: { address: 0x10 },
        });
        mockWorker.simulateMessage({
          type: 'BREAKPOINTS_LIST',
          payload: { addresses: [0x10] },
        });

        expect(breakpointHitCallback).not.toHaveBeenCalled();
        expect(breakpointsChangeCallback).not.toHaveBeenCalled();
      });
    });
  });
});
