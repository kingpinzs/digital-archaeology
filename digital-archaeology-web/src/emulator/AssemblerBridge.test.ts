/**
 * Tests for AssemblerBridge
 *
 * Tests the bridge API using mock workers.
 * Integration tests with real WASM are conditional on WASM availability.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssemblerBridge } from './AssemblerBridge';
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
});
