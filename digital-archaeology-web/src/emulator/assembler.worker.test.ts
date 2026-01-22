/**
 * Tests for Assembler Worker
 *
 * Tests the worker message handling logic using mock modules.
 * Actual WASM integration is tested via AssemblerBridge tests.
 */

import { describe, it, expect, vi } from 'vitest';
import type { AssemblerModule } from './types';
import { isAssemblerCommand, handleAssemble } from './assembler.worker';

/**
 * Create a mock AssemblerModule for testing.
 */
function createMockModule(options: {
  assembleSuccess: boolean;
  outputBytes?: number[];
  errorMessage?: string;
  errorLine?: number;
}): AssemblerModule {
  const output = options.outputBytes ?? [0x1, 0x2, 0x3, 0x4];

  return {
    ccall: vi.fn((name: string) => {
      switch (name) {
        case 'assemble_source':
          return options.assembleSuccess ? 1 : 0;
        case 'get_output':
          return 0; // Pointer to start of HEAPU8
        case 'get_output_size':
          return output.length;
        case 'get_error':
          return options.errorMessage ?? 'Unknown error';
        case 'get_error_line':
          return options.errorLine ?? 1;
        default:
          return 0;
      }
    }),
    cwrap: vi.fn(),
    HEAPU8: new Uint8Array(output),
    UTF8ToString: vi.fn((ptr: number) => `string at ${ptr}`),
    stringToUTF8: vi.fn(),
    lengthBytesUTF8: vi.fn((str: string) => str.length),
    _malloc: vi.fn((size: number) => size),
    _free: vi.fn(),
    _assemble_source: vi.fn(),
    _get_output: vi.fn(),
    _get_output_size: vi.fn(),
    _get_error: vi.fn(),
    _get_error_line: vi.fn(),
  };
}

describe('isAssemblerCommand', () => {
  it('returns true for valid ASSEMBLE command', () => {
    const command = {
      type: 'ASSEMBLE',
      payload: { source: 'LDA 5' },
    };
    expect(isAssemblerCommand(command)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isAssemblerCommand(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAssemblerCommand(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isAssemblerCommand('string')).toBe(false);
    expect(isAssemblerCommand(123)).toBe(false);
  });

  it('returns false for wrong type value', () => {
    const command = {
      type: 'UNKNOWN',
      payload: { source: 'LDA 5' },
    };
    expect(isAssemblerCommand(command)).toBe(false);
  });

  it('returns false for missing payload', () => {
    const command = {
      type: 'ASSEMBLE',
    };
    expect(isAssemblerCommand(command)).toBe(false);
  });

  it('returns false for non-object payload', () => {
    const command = {
      type: 'ASSEMBLE',
      payload: 'invalid',
    };
    expect(isAssemblerCommand(command)).toBe(false);
  });

  it('returns false for null payload', () => {
    const command = {
      type: 'ASSEMBLE',
      payload: null,
    };
    expect(isAssemblerCommand(command)).toBe(false);
  });

  it('returns false for empty object payload (missing source)', () => {
    const command = {
      type: 'ASSEMBLE',
      payload: {},
    };
    expect(isAssemblerCommand(command)).toBe(false);
  });

  it('returns false for non-string source', () => {
    const command = {
      type: 'ASSEMBLE',
      payload: { source: 123 },
    };
    expect(isAssemblerCommand(command)).toBe(false);
  });

  it('returns true for valid command with empty string source', () => {
    const command = {
      type: 'ASSEMBLE',
      payload: { source: '' },
    };
    expect(isAssemblerCommand(command)).toBe(true);
  });
});

describe('handleAssemble', () => {
  describe('successful assembly', () => {
    it('returns ASSEMBLE_SUCCESS with binary output', () => {
      const mockModule = createMockModule({
        assembleSuccess: true,
        outputBytes: [0x12, 0x34, 0x56],
      });

      const result = handleAssemble(mockModule, 'LDA 5\nHLT');

      expect(result.type).toBe('ASSEMBLE_SUCCESS');
      if (result.type === 'ASSEMBLE_SUCCESS') {
        expect(result.payload.binary).toEqual([0x12, 0x34, 0x56]);
        expect(result.payload.size).toBe(3);
      }
    });

    it('calls ccall with correct arguments', () => {
      const mockModule = createMockModule({ assembleSuccess: true });

      handleAssemble(mockModule, 'LDA 5');

      expect(mockModule.ccall).toHaveBeenCalledWith(
        'assemble_source',
        'number',
        ['string'],
        ['LDA 5']
      );
    });

    it('retrieves output pointer and size', () => {
      const mockModule = createMockModule({ assembleSuccess: true });

      handleAssemble(mockModule, 'LDA 5');

      expect(mockModule.ccall).toHaveBeenCalledWith(
        'get_output',
        'number',
        [],
        []
      );
      expect(mockModule.ccall).toHaveBeenCalledWith(
        'get_output_size',
        'number',
        [],
        []
      );
    });

    it('handles empty output', () => {
      const mockModule = createMockModule({
        assembleSuccess: true,
        outputBytes: [],
      });

      const result = handleAssemble(mockModule, '');

      expect(result.type).toBe('ASSEMBLE_SUCCESS');
      if (result.type === 'ASSEMBLE_SUCCESS') {
        expect(result.payload.binary).toEqual([]);
        expect(result.payload.size).toBe(0);
      }
    });
  });

  describe('failed assembly', () => {
    it('returns ASSEMBLE_ERROR with error details', () => {
      const mockModule = createMockModule({
        assembleSuccess: false,
        errorMessage: 'Unknown instruction',
        errorLine: 3,
      });

      const result = handleAssemble(mockModule, 'INVALID');

      expect(result.type).toBe('ASSEMBLE_ERROR');
      if (result.type === 'ASSEMBLE_ERROR') {
        expect(result.payload.line).toBe(3);
        expect(result.payload.message).toBe('Unknown instruction');
      }
    });

    it('retrieves error message and line number', () => {
      const mockModule = createMockModule({
        assembleSuccess: false,
        errorMessage: 'Syntax error',
        errorLine: 5,
      });

      handleAssemble(mockModule, 'BAD CODE');

      expect(mockModule.ccall).toHaveBeenCalledWith(
        'get_error',
        'string',
        [],
        []
      );
      expect(mockModule.ccall).toHaveBeenCalledWith(
        'get_error_line',
        'number',
        [],
        []
      );
    });
  });
});

describe('Worker message types', () => {
  it('ASSEMBLE_SUCCESS has correct structure', () => {
    const mockModule = createMockModule({
      assembleSuccess: true,
      outputBytes: [0x01, 0x02],
    });

    const result = handleAssemble(mockModule, 'LDA 1');

    expect(result).toHaveProperty('type', 'ASSEMBLE_SUCCESS');
    expect(result).toHaveProperty('payload');
    expect(result).toHaveProperty('payload.binary');
    expect(result).toHaveProperty('payload.size');
  });

  it('ASSEMBLE_ERROR has correct structure', () => {
    const mockModule = createMockModule({
      assembleSuccess: false,
      errorMessage: 'Error',
      errorLine: 1,
    });

    const result = handleAssemble(mockModule, 'BAD');

    expect(result).toHaveProperty('type', 'ASSEMBLE_ERROR');
    expect(result).toHaveProperty('payload');
    expect(result).toHaveProperty('payload.line');
    expect(result).toHaveProperty('payload.message');
  });
});
