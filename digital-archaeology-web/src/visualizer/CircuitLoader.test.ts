// src/visualizer/CircuitLoader.test.ts
// Unit tests for CircuitLoader (Story 6.2)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitLoader, CircuitLoadError } from './CircuitLoader';
import type { CircuitData } from './types';

// Type declaration for global fetch mock in Node.js test environment
declare const global: { fetch: typeof fetch };

describe('CircuitLoader', () => {
  let loader: CircuitLoader;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    loader = new CircuitLoader();
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadCircuit()', () => {
    it('should parse valid circuit JSON', async () => {
      const mockData: CircuitData = {
        cycle: 0,
        stable: true,
        wires: [
          {
            id: 0,
            name: 'test_wire',
            width: 1,
            is_input: false,
            is_output: false,
            state: [0],
          },
        ],
        gates: [
          {
            id: 0,
            name: 'TEST_GATE',
            type: 'AND',
            inputs: [
              { wire: 0, bit: 0 },
              { wire: 0, bit: 0 },
            ],
            outputs: [{ wire: 0, bit: 0 }],
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await loader.loadCircuit('/circuits/test.json');

      expect(result.cycle).toBe(0);
      expect(result.stable).toBe(true);
      expect(result.wires).toHaveLength(1);
      expect(result.wires[0].name).toBe('test_wire');
      expect(result.gates).toHaveLength(1);
      expect(result.gates[0].name).toBe('TEST_GATE');
    });

    it('should parse circuit with DFF gates including stored value', async () => {
      const mockData: CircuitData = {
        cycle: 5,
        stable: false,
        wires: [
          {
            id: 0,
            name: 'clk',
            width: 1,
            is_input: true,
            is_output: false,
            state: [1],
          },
          {
            id: 1,
            name: 'q',
            width: 1,
            is_input: false,
            is_output: true,
            state: [0],
          },
        ],
        gates: [
          {
            id: 0,
            name: 'DFF0',
            type: 'DFF',
            inputs: [
              { wire: 0, bit: 0 },
              { wire: 1, bit: 0 },
            ],
            outputs: [{ wire: 1, bit: 0 }],
            stored: 1,
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await loader.loadCircuit('/circuits/test.json');

      expect(result.gates[0].stored).toBe(1);
      expect(result.gates[0].type).toBe('DFF');
    });

    it('should throw CircuitLoadError on 404', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(loader.loadCircuit('/circuits/missing.json')).rejects.toThrow(
        CircuitLoadError
      );

      try {
        await loader.loadCircuit('/circuits/missing.json');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitLoadError);
        expect((error as CircuitLoadError).message).toContain('404');
        expect((error as CircuitLoadError).path).toBe('/circuits/missing.json');
      }
    });

    it('should throw CircuitLoadError on 500', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(loader.loadCircuit('/circuits/error.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError on invalid JSON', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );

      try {
        await loader.loadCircuit('/circuits/invalid.json');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitLoadError);
        expect((error as CircuitLoadError).message).toContain('parse');
        expect((error as CircuitLoadError).cause).toBeInstanceOf(SyntaxError);
      }
    });

    it('should throw CircuitLoadError on invalid circuit structure - missing wires', async () => {
      const invalidData = {
        cycle: 0,
        stable: true,
        gates: [],
        // missing wires
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError on invalid circuit structure - missing gates', async () => {
      const invalidData = {
        cycle: 0,
        stable: true,
        wires: [],
        // missing gates
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError on invalid wire structure', async () => {
      const invalidData = {
        cycle: 0,
        stable: true,
        wires: [
          {
            id: 0,
            // missing name, width, etc.
          },
        ],
        gates: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError when wire state length does not match width', async () => {
      const invalidData = {
        cycle: 0,
        stable: true,
        wires: [
          {
            id: 0,
            name: 'bad_wire',
            width: 4, // Claims 4 bits
            is_input: false,
            is_output: false,
            state: [0], // But only has 1 element
          },
        ],
        gates: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError on invalid gate type', async () => {
      const invalidData = {
        cycle: 0,
        stable: true,
        wires: [],
        gates: [
          {
            id: 0,
            name: 'BAD_GATE',
            type: 'INVALID_TYPE', // Not a valid gate type
            inputs: [],
            outputs: [],
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError on invalid gate structure', async () => {
      const invalidData = {
        cycle: 0,
        stable: true,
        wires: [],
        gates: [
          {
            id: 0,
            // missing name, type, inputs, outputs
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(loader.loadCircuit('/circuits/invalid.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should throw CircuitLoadError on network error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new TypeError('Network request failed')
      );

      await expect(loader.loadCircuit('/circuits/network.json')).rejects.toThrow(
        CircuitLoadError
      );

      try {
        await loader.loadCircuit('/circuits/network.json');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitLoadError);
        expect((error as CircuitLoadError).message).toContain('fetch');
        expect((error as CircuitLoadError).cause).toBeInstanceOf(TypeError);
      }
    });

    it('should include path in error for all error types', async () => {
      const testPath = '/circuits/test-path.json';

      // Test 404 error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      try {
        await loader.loadCircuit(testPath);
      } catch (error) {
        expect((error as CircuitLoadError).path).toBe(testPath);
      }
    });
  });
});

describe('CircuitLoadError', () => {
  it('should have correct name property', () => {
    const error = new CircuitLoadError('test message', '/test/path');
    expect(error.name).toBe('CircuitLoadError');
  });

  it('should include path property', () => {
    const error = new CircuitLoadError('test message', '/test/path');
    expect(error.path).toBe('/test/path');
  });

  it('should include optional cause', () => {
    const cause = new Error('original error');
    const error = new CircuitLoadError('test message', '/test/path', cause);
    expect(error.cause).toBe(cause);
  });

  it('should work without cause', () => {
    const error = new CircuitLoadError('test message', '/test/path');
    expect(error.cause).toBeUndefined();
  });
});
