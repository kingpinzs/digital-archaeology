/**
 * Tests for AssemblerBridge
 *
 * Tests the bridge API using mock workers.
 * Integration tests with real WASM are conditional on WASM availability.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssemblerBridge, extractUnknownInstruction } from './AssemblerBridge';
import type { LabStage } from '../config/stageConfig';
import type {
  AssemblerEvent,
  WorkerReadyEvent,
  AssembleSuccessEvent,
  AssembleErrorEvent,
} from './types';

/**
 * Mock Worker class for testing.
 */
class MockWorker {
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  public postMessageCalls: unknown[] = [];
  public terminated = false;

  addEventListener(
    type: string,
    handler: EventListener | EventListenerObject
  ): void {
    const fn = typeof handler === 'function' ? handler : handler.handleEvent;
    if (type === 'message') {
      this.messageHandler = fn as (event: MessageEvent) => void;
    } else if (type === 'error') {
      this.errorHandler = fn as (event: ErrorEvent) => void;
    }
  }

  removeEventListener(
    type: string,
    _handler: EventListener | EventListenerObject
  ): void {
    if (type === 'message') {
      this.messageHandler = null;
    } else if (type === 'error') {
      this.errorHandler = null;
    }
  }

  postMessage(data: unknown): void {
    this.postMessageCalls.push(data);
  }

  terminate(): void {
    this.terminated = true;
  }

  // Test helpers
  simulateMessage(data: AssemblerEvent): void {
    if (this.messageHandler) {
      this.messageHandler({ data } as MessageEvent);
    }
  }

  simulateError(message: string): void {
    if (this.errorHandler) {
      this.errorHandler({ message } as ErrorEvent);
    }
  }
}

// Store the original Worker constructor
const OriginalWorker = globalThis.Worker;

describe('AssemblerBridge', () => {
  let mockWorker: MockWorker;

  beforeEach(() => {
    mockWorker = new MockWorker();
    // Mock the Worker constructor using a class that returns our mock
    class MockWorkerConstructor {
      constructor() {
        return mockWorker;
      }
    }
    globalThis.Worker = MockWorkerConstructor as unknown as typeof Worker;
  });

  afterEach(() => {
    globalThis.Worker = OriginalWorker;
  });

  /** Shared helper: init bridge with given stage and WORKER_READY */
  async function initBridge(bridge: AssemblerBridge, stage: LabStage = 'micro4') {
    const initPromise = bridge.init(stage);
    mockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
    await initPromise;
  }

  /** Shared helper: simulate ASSEMBLE_SUCCESS with binary of given size */
  function simulateSuccessWithSize(size: number) {
    const binary = new Array(size).fill(0);
    mockWorker.simulateMessage({
      type: 'ASSEMBLE_SUCCESS',
      payload: { binary, size },
    } satisfies AssembleSuccessEvent);
  }

  /** Shared helper: simulate ASSEMBLE_ERROR with "Unknown instruction" message */
  function simulateUnknownInstruction(mnemonic: string, line: number = 1) {
    mockWorker.simulateMessage({
      type: 'ASSEMBLE_ERROR',
      payload: {
        line,
        message: `Unknown instruction: ${mnemonic}`,
      },
    } satisfies AssembleErrorEvent);
  }

  describe('constructor and initialization', () => {
    it('isReady returns false before init', () => {
      const bridge = new AssemblerBridge();
      expect(bridge.isReady).toBe(false);
    });

    it('init() creates a worker', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();

      // Simulate WORKER_READY
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);

      await initPromise;

      // Worker was created if we got here without error
      expect(bridge.isReady).toBe(true);
    });

    it('init() resolves when WORKER_READY received', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);

      await expect(initPromise).resolves.toBeUndefined();
      expect(bridge.isReady).toBe(true);
    });

    it('init() rejects on worker error during initialization', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateError('Worker failed to load');

      await expect(initPromise).rejects.toThrow('Worker error');
    });

    it('init() rejects on ASSEMBLE_ERROR during initialization', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 0,
          message: 'WASM module failed to load',
        },
      } satisfies AssembleErrorEvent);

      await expect(initPromise).rejects.toThrow('WASM module failed to load');
    });

    it('multiple init() calls return the same promise', async () => {
      const bridge = new AssemblerBridge();

      const promise1 = bridge.init();
      const promise2 = bridge.init();

      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);

      expect(promise1).toBe(promise2);
      await Promise.all([promise1, promise2]);
    });

    it('init() after successful init resolves immediately', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      // Second init should return immediately
      await expect(bridge.init()).resolves.toBeUndefined();
    });

    it('init() rejects on timeout when worker never responds', async () => {
      vi.useFakeTimers();
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();

      // Fast-forward past the 30-second timeout
      vi.advanceTimersByTime(30001);

      await expect(initPromise).rejects.toThrow('Worker initialization timed out');
      expect(mockWorker.terminated).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('assemble()', () => {
    it('throws if not initialized', async () => {
      const bridge = new AssemblerBridge();

      await expect(bridge.assemble('LDA 5')).rejects.toThrow(
        'AssemblerBridge not initialized'
      );
    });

    it('sends ASSEMBLE command to worker', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 5\nHLT');

      // Check command was sent
      expect(mockWorker.postMessageCalls).toContainEqual({
        type: 'ASSEMBLE',
        payload: { source: 'LDA 5\nHLT' },
      });

      // Complete the assembly
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_SUCCESS',
        payload: { binary: [1, 2, 3], size: 3 },
      } satisfies AssembleSuccessEvent);

      await assemblePromise;
    });

    it('returns AssembleResult on success', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 5');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_SUCCESS',
        payload: { binary: [0x15, 0xf0], size: 2 },
      } satisfies AssembleSuccessEvent);

      const result = await assemblePromise;

      expect(result.success).toBe(true);
      expect(result.binary).toBeInstanceOf(Uint8Array);
      expect(Array.from(result.binary!)).toEqual([0x15, 0xf0]);
      expect(result.error).toBeNull();
    });

    it('returns AssembleResult on error', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('INVALID');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: 'Unknown instruction: INVALID',
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.success).toBe(false);
      expect(result.binary).toBeNull();
      expect(result.error?.line).toBe(1);
      expect(result.error?.message).toBe('Unknown instruction: INVALID');
      // Rich error fields are now always present
      expect(result.error?.type).toBe('SYNTAX_ERROR');
      expect(result.error?.codeSnippet).toBeDefined();
      expect(result.error?.fixable).toBe(false);
    });

    it('includes optional error fields when present', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          column: 4,
          message: 'Expected operand',
          suggestion: 'Add an operand after LDA',
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.column).toBe(4);
      expect(result.error?.suggestion).toBe('Add an operand after LDA');
    });

    it('rejects on timeout when worker never responds', async () => {
      vi.useFakeTimers();
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 5', 5000);

      // Fast-forward past the 5-second custom timeout
      vi.advanceTimersByTime(5001);

      await expect(assemblePromise).rejects.toThrow('Assembly operation timed out');

      vi.useRealTimers();
    });

    it('uses default timeout of 10 seconds', async () => {
      vi.useFakeTimers();
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 5');

      // 9 seconds should not timeout
      vi.advanceTimersByTime(9000);
      // Promise should still be pending (not rejected yet)

      // Fast-forward past 10 seconds total
      vi.advanceTimersByTime(1001);

      await expect(assemblePromise).rejects.toThrow('Assembly operation timed out');

      vi.useRealTimers();
    });

    it('rejects on worker error during assembly', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 5');
      mockWorker.simulateError('Worker crashed');

      await expect(assemblePromise).rejects.toThrow('Worker error during assembly');
    });
  });

  describe('rich error parsing', () => {
    it('detects SYNTAX_ERROR from unknown instruction message', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('INVALID 0x10');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: "Unknown instruction 'INVALID'",
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.type).toBe('SYNTAX_ERROR');
    });

    it('detects VALUE_ERROR from invalid address message', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 999');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: 'Invalid address 999',
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.type).toBe('VALUE_ERROR');
    });

    it('detects CONSTRAINT_ERROR from value range message', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('DB 256');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: 'Value 256 exceeds nibble range',
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.type).toBe('CONSTRAINT_ERROR');
    });

    it('generates code snippet with context from source', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const source = 'LDA 0x05\nADD 0x06\nINVALID 0x10\nHLT';
      const assemblePromise = bridge.assemble(source);
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 3,
          message: "Unknown instruction 'INVALID'",
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.codeSnippet).toBeDefined();
      expect(result.error?.codeSnippet?.line).toBe('INVALID 0x10');
      expect(result.error?.codeSnippet?.lineNumber).toBe(3);
      expect(result.error?.codeSnippet?.contextBefore).toContain('ADD 0x06');
      expect(result.error?.codeSnippet?.contextAfter).toContain('HLT');
    });

    it('generates code snippet for first line without contextBefore', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const source = 'INVALID 0x10\nLDA 0x05';
      const assemblePromise = bridge.assemble(source);
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: "Unknown instruction 'INVALID'",
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.codeSnippet?.contextBefore).toHaveLength(0);
      expect(result.error?.codeSnippet?.contextAfter).toContain('LDA 0x05');
    });

    it('detects fixable errors when suggestion is present', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDAA 0x10');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: "Unknown instruction 'LDAA'",
          suggestion: 'LDA',
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.suggestion).toBe('LDA');
      expect(result.error?.fixable).toBe(true);
    });

    it('marks error as non-fixable when no suggestion', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('INVALID 0x10');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: "Unknown instruction 'INVALID'",
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      expect(result.error?.suggestion).toBeUndefined();
      expect(result.error?.fixable).toBe(false);
    });

    it('marks VALUE_ERROR as non-fixable even with suggestion', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      const assemblePromise = bridge.assemble('LDA 999');
      mockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: {
          line: 1,
          message: 'Invalid address 999',
          suggestion: 'Use a value between 0 and 255',
        },
      } satisfies AssembleErrorEvent);

      const result = await assemblePromise;

      // VALUE_ERROR is not auto-fixable because the fix requires user judgment
      expect(result.error?.fixable).toBe(false);
    });
  });

  describe('reinit() (Story 11.3)', () => {
    it('should terminate old worker and create new one', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await initPromise;

      expect(bridge.isReady).toBe(true);

      // Create fresh mock for reinit
      const secondMockWorker = new MockWorker();
      class SecondMockWorkerConstructor {
        constructor() {
          return secondMockWorker;
        }
      }
      globalThis.Worker = SecondMockWorkerConstructor as unknown as typeof Worker;

      const reinitPromise = bridge.reinit('micro4');
      secondMockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await reinitPromise;

      // Old worker terminated
      expect(mockWorker.terminated).toBe(true);
      expect(bridge.isReady).toBe(true);
    });

    it('should send INIT_WASM with new stage config', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await initPromise;

      // Create fresh mock for reinit
      const secondMockWorker = new MockWorker();
      class SecondMockWorkerConstructor {
        constructor() {
          return secondMockWorker;
        }
      }
      globalThis.Worker = SecondMockWorkerConstructor as unknown as typeof Worker;

      const reinitPromise = bridge.reinit('micro4');
      secondMockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await reinitPromise;

      // New worker should have received INIT_WASM
      const initWasmCalls = secondMockWorker.postMessageCalls.filter(
        (call: unknown) => (call as { type: string }).type === 'INIT_WASM'
      );
      expect(initWasmCalls.length).toBe(1);
      expect((initWasmCalls[0] as { payload: { wasmJsPath: string } }).payload.wasmJsPath).toBe('wasm/micro4-asm.js');
    });

    it('should reject if new stage WASM load fails', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await initPromise;

      // Create fresh mock for reinit
      const secondMockWorker = new MockWorker();
      class SecondMockWorkerConstructor {
        constructor() {
          return secondMockWorker;
        }
      }
      globalThis.Worker = SecondMockWorkerConstructor as unknown as typeof Worker;

      const reinitPromise = bridge.reinit('micro4');
      secondMockWorker.simulateMessage({
        type: 'ASSEMBLE_ERROR',
        payload: { line: 0, message: 'WASM load failed for new stage' },
      } satisfies AssembleErrorEvent);

      await expect(reinitPromise).rejects.toThrow('WASM load failed for new stage');
      expect(bridge.isReady).toBe(false);
    });

    it('should work on uninitialized bridge', async () => {
      const bridge = new AssemblerBridge();

      const reinitPromise = bridge.reinit('micro4');
      mockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await reinitPromise;

      expect(bridge.isReady).toBe(true);
      bridge.terminate();
    });

    it('should allow assembly after reinit', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await initPromise;

      // Reinit with fresh mock
      const secondMockWorker = new MockWorker();
      class SecondMockWorkerConstructor {
        constructor() {
          return secondMockWorker;
        }
      }
      globalThis.Worker = SecondMockWorkerConstructor as unknown as typeof Worker;

      const reinitPromise = bridge.reinit('micro4');
      secondMockWorker.simulateMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      await reinitPromise;

      // Now assemble should work
      const assemblePromise = bridge.assemble('LDA 5\nHLT');
      secondMockWorker.simulateMessage({
        type: 'ASSEMBLE_SUCCESS',
        payload: { binary: [0x15, 0xf0], size: 2 },
      } satisfies AssembleSuccessEvent);

      const result = await assemblePromise;
      expect(result.success).toBe(true);

      bridge.terminate();
    });
  });

  describe('terminate()', () => {
    it('terminates the worker', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      bridge.terminate();

      expect(mockWorker.terminated).toBe(true);
    });

    it('sets isReady to false', async () => {
      const bridge = new AssemblerBridge();

      const initPromise = bridge.init();
      mockWorker.simulateMessage({
        type: 'WORKER_READY',
      } satisfies WorkerReadyEvent);
      await initPromise;

      expect(bridge.isReady).toBe(true);
      bridge.terminate();
      expect(bridge.isReady).toBe(false);
    });

    it('can be called multiple times safely', () => {
      const bridge = new AssemblerBridge();

      // Should not throw even without init
      expect(() => bridge.terminate()).not.toThrow();
      expect(() => bridge.terminate()).not.toThrow();
    });
  });

  // Story 18.2: Memory limit enforcement
  describe('memory limit enforcement (Story 18.2)', () => {
    it('rejects binary that exceeds micro4 memory limit (256 bytes)', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257); // 1 byte over 256
      const result = await assemblePromise;

      expect(result.success).toBe(false);
      expect(result.binary).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('accepts binary that fits within micro4 memory limit', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(100); // Well under 256
      const result = await assemblePromise;

      expect(result.success).toBe(true);
      expect(result.binary).not.toBeNull();
      expect(result.binary!.length).toBe(100);
      expect(result.error).toBeNull();
    });

    it('accepts binary at exact micro4 memory limit boundary (256 bytes)', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(256); // Exactly at limit
      const result = await assemblePromise;

      expect(result.success).toBe(true);
      expect(result.binary).not.toBeNull();
      expect(result.binary!.length).toBe(256);
      expect(result.error).toBeNull();
    });

    it('error message contains program size and memory limit', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(300);
      const result = await assemblePromise;

      expect(result.error!.message).toContain('300 bytes');
      expect(result.error!.message).toContain('256 bytes');
      expect(result.error!.message).toContain('Micro4');
    });

    it('error suggestion mentions next stage name and memory size', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(300);
      const result = await assemblePromise;

      expect(result.error!.suggestion).toContain('Micro8');
      expect(result.error!.suggestion).toContain('64 KB');
      expect(result.error!.suggestion).toContain('Reduce program size');
    });

    it('error type is CONSTRAINT_ERROR', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257);
      const result = await assemblePromise;

      expect(result.error!.type).toBe('CONSTRAINT_ERROR');
    });

    it('error.fixable is false', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257);
      const result = await assemblePromise;

      expect(result.error!.fixable).toBe(false);
    });

    it('error.line is 0 (program-level error)', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257);
      const result = await assemblePromise;

      expect(result.error!.line).toBe(0);
    });

    it('enforces micro8 memory limit (65536 bytes)', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro8');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(65537); // 1 byte over 65536
      const result = await assemblePromise;

      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('CONSTRAINT_ERROR');
      expect(result.error!.message).toContain('65537 bytes');
      expect(result.error!.message).toContain('65536 bytes');
      expect(result.error!.message).toContain('Micro8');
    });

    it('micro8 error suggestion mentions Micro16', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro8');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(65537);
      const result = await assemblePromise;

      expect(result.error!.suggestion).toContain('Micro16');
      expect(result.error!.suggestion).toContain('1 MB');
    });

    it('accepts empty binary (0 bytes)', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('');
      simulateSuccessWithSize(0);
      const result = await assemblePromise;

      expect(result.success).toBe(true);
      expect(result.binary!.length).toBe(0);
    });
  });

  // Story 18.3: Instruction set enforcement
  describe('extractUnknownInstruction (Story 18.3)', () => {
    it('should extract mnemonic from standard "Unknown instruction: PUSH" format', () => {
      expect(extractUnknownInstruction('Unknown instruction: PUSH')).toBe('PUSH');
    });

    it('should extract mnemonic from REP variant "Unknown instruction after REP: MOVSB"', () => {
      expect(extractUnknownInstruction('Unknown instruction after REP: MOVSB')).toBe('MOVSB');
    });

    it('should return null for unrelated error messages', () => {
      expect(extractUnknownInstruction('Undefined label: foo')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractUnknownInstruction('')).toBeNull();
    });

    it('should normalize to uppercase', () => {
      expect(extractUnknownInstruction('Unknown instruction: push')).toBe('PUSH');
    });

    it('should handle REPZ/REPNZ variants', () => {
      expect(extractUnknownInstruction('Unknown instruction after REPZ: CMPSB')).toBe('CMPSB');
      expect(extractUnknownInstruction('Unknown instruction after REPNZ: CMPSB')).toBe('CMPSB');
    });
  });

  describe('instruction set enforcement (Story 18.3)', () => {
    it('returns CONSTRAINT_ERROR when instruction exists in a later stage', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('CONSTRAINT_ERROR');
    });

    it('returns SYNTAX_ERROR when instruction does not exist in any stage', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('XYZZY 42');
      simulateUnknownInstruction('XYZZY');
      const result = await assemblePromise;

      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('SYNTAX_ERROR');
    });

    it('returns SYNTAX_ERROR when instruction exists in an earlier stage (non-cumulative ISA)', async () => {
      // LDA exists in micro4 but NOT in micro8 — should be SYNTAX_ERROR, not CONSTRAINT_ERROR
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro8');

      const assemblePromise = bridge.assemble('LDA 0x05');
      simulateUnknownInstruction('LDA');
      const result = await assemblePromise;

      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('SYNTAX_ERROR');
    });

    it('CONSTRAINT_ERROR message explains instruction not available in current stage', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      expect(result.error!.message).toContain('PUSH');
      expect(result.error!.message).toContain('Micro4');
      expect(result.error!.message).toContain('does not exist');
      // Verify mnemonic count (not opcodeCount) — fix from code review 2M
      expect(result.error!.message).toContain('16 instructions available');
    });

    it('CONSTRAINT_ERROR suggestion mentions the stage where instruction becomes available', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      expect(result.error!.suggestion).toContain('PUSH');
      expect(result.error!.suggestion).toContain('Micro8');
      expect(result.error!.suggestion).toContain('becomes available');
    });

    it('preserves line number from original C assembler error', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('HLT\nLDA 5\nPUSH R0\nHLT');
      simulateUnknownInstruction('PUSH', 3);
      const result = await assemblePromise;

      expect(result.error!.line).toBe(3);
    });

    it('generates code snippet for the error line', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const source = 'LDA 0x05\nPUSH R0\nHLT';
      const assemblePromise = bridge.assemble(source);
      simulateUnknownInstruction('PUSH', 2);
      const result = await assemblePromise;

      expect(result.error!.codeSnippet).toBeDefined();
      expect(result.error!.codeSnippet!.line).toBe('PUSH R0');
      expect(result.error!.codeSnippet!.lineNumber).toBe(2);
    });

    it('error.fixable is false for instruction constraint errors', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      expect(result.error!.fixable).toBe(false);
    });

    it('handles MUL instruction on micro8 (exists in micro16)', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro8');

      const assemblePromise = bridge.assemble('MUL R0, R1');
      simulateUnknownInstruction('MUL');
      const result = await assemblePromise;

      expect(result.error!.type).toBe('CONSTRAINT_ERROR');
      expect(result.error!.suggestion).toContain('Micro16');
    });
  });

  // Story 18.4: Educational context in constraint errors
  describe('educational context in constraint errors (Story 18.4)', () => {
    it('memory constraint error includes educationalContext field', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257);
      const result = await assemblePromise;

      expect(result.error!.educationalContext).toBeDefined();
      expect(typeof result.error!.educationalContext).toBe('string');
      expect(result.error!.educationalContext!.length).toBeGreaterThan(0);
    });

    it('memory constraint educationalContext contains stage memoryContext content', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257);
      const result = await assemblePromise;

      // Should contain reference to Intel 4004 (from micro4 memoryContext)
      expect(result.error!.educationalContext).toContain('4004');
    });

    it('memory constraint educationalContext contains journeyTeaser content', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('NOP');
      simulateSuccessWithSize(257);
      const result = await assemblePromise;

      // Should contain reference to Micro8 (from micro4 journeyTeaser)
      expect(result.error!.educationalContext).toContain('Micro8');
    });

    it('instruction set constraint error includes educationalContext field', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      expect(result.error!.educationalContext).toBeDefined();
      expect(typeof result.error!.educationalContext).toBe('string');
      expect(result.error!.educationalContext!.length).toBeGreaterThan(0);
    });

    it('instruction set constraint educationalContext contains stage instructionContext content', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      // Should contain reference to 16 instructions (from micro4 instructionContext)
      expect(result.error!.educationalContext).toContain('16 instructions');
    });

    it('instruction set constraint educationalContext mentions the specific mnemonic', async () => {
      const bridge = new AssemblerBridge();
      await initBridge(bridge, 'micro4');

      const assemblePromise = bridge.assemble('PUSH R0');
      simulateUnknownInstruction('PUSH');
      const result = await assemblePromise;

      // Should contain the specific instruction name (fix from code review 1M)
      expect(result.error!.educationalContext).toContain('PUSH');
    });
  });
});
