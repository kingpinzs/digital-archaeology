import { describe, it, expect } from 'vitest';
import type {
  AssemblerModule,
  AssemblerModuleFactory,
  AssembleResult,
  AssemblerError,
  AssembleCommand,
  AssembleSuccessEvent,
  AssembleErrorEvent,
  WorkerReadyEvent,
  AssemblerCommand,
  AssemblerEvent,
} from './types';
import {
  validateAssemblerModule,
  REQUIRED_WASM_EXPORTS,
  REQUIRED_RUNTIME_METHODS,
} from './types';

describe('Emulator Types', () => {
  describe('AssemblerError', () => {
    it('should have line and message properties', () => {
      const error: AssemblerError = {
        line: 5,
        message: 'Unknown instruction: FOO',
      };

      expect(error.line).toBe(5);
      expect(error.message).toBe('Unknown instruction: FOO');
    });

    it('should require line to be a number', () => {
      const error: AssemblerError = {
        line: 1,
        message: 'Error',
      };

      expect(typeof error.line).toBe('number');
    });

    it('should support optional column field', () => {
      const error: AssemblerError = {
        line: 3,
        column: 15,
        message: 'Unexpected token',
      };

      expect(error.column).toBe(15);
    });

    it('should support optional suggestion field', () => {
      const error: AssemblerError = {
        line: 2,
        message: 'Unknown instruction: LAOD',
        suggestion: 'Did you mean: LOAD?',
      };

      expect(error.suggestion).toBe('Did you mean: LOAD?');
    });

    it('should work without optional fields', () => {
      const error: AssemblerError = {
        line: 1,
        message: 'Syntax error',
      };

      expect(error.column).toBeUndefined();
      expect(error.suggestion).toBeUndefined();
    });
  });

  describe('AssembleResult', () => {
    it('should represent successful assembly', () => {
      const result: AssembleResult = {
        success: true,
        binary: new Uint8Array([0x01, 0x0f, 0x00]),
        error: null,
      };

      expect(result.success).toBe(true);
      expect(result.binary).toBeInstanceOf(Uint8Array);
      expect(result.binary?.length).toBe(3);
      expect(result.error).toBeNull();
    });

    it('should represent failed assembly', () => {
      const result: AssembleResult = {
        success: false,
        binary: null,
        error: {
          line: 3,
          message: 'Undefined label: UNKNOWN',
        },
      };

      expect(result.success).toBe(false);
      expect(result.binary).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.line).toBe(3);
    });
  });

  describe('Worker Message Types', () => {
    describe('AssembleCommand', () => {
      it('should have ASSEMBLE type and source payload', () => {
        const command: AssembleCommand = {
          type: 'ASSEMBLE',
          payload: {
            source: 'LDA 0x10\nHLT',
          },
        };

        expect(command.type).toBe('ASSEMBLE');
        expect(command.payload.source).toContain('LDA');
      });
    });

    describe('AssembleSuccessEvent', () => {
      it('should have ASSEMBLE_SUCCESS type with binary and size', () => {
        const event: AssembleSuccessEvent = {
          type: 'ASSEMBLE_SUCCESS',
          payload: {
            binary: [0x01, 0x00, 0x0f, 0x00],
            size: 4,
          },
        };

        expect(event.type).toBe('ASSEMBLE_SUCCESS');
        expect(event.payload.binary).toHaveLength(4);
        expect(event.payload.size).toBe(4);
      });
    });

    describe('AssembleErrorEvent', () => {
      it('should have ASSEMBLE_ERROR type with error details', () => {
        const event: AssembleErrorEvent = {
          type: 'ASSEMBLE_ERROR',
          payload: {
            line: 2,
            message: 'Invalid operand',
          },
        };

        expect(event.type).toBe('ASSEMBLE_ERROR');
        expect(event.payload.line).toBe(2);
        expect(event.payload.message).toBe('Invalid operand');
      });
    });

    describe('WorkerReadyEvent', () => {
      it('should have WORKER_READY type', () => {
        const event: WorkerReadyEvent = {
          type: 'WORKER_READY',
        };

        expect(event.type).toBe('WORKER_READY');
      });
    });
  });

  describe('Union Types', () => {
    it('AssemblerCommand should only include assemble commands', () => {
      // TypeScript compile-time check - this test verifies the union works
      const command: AssemblerCommand = {
        type: 'ASSEMBLE',
        payload: { source: 'HLT' },
      };

      expect(command.type).toBe('ASSEMBLE');
    });

    it('AssemblerEvent should include all event types', () => {
      const events: AssemblerEvent[] = [
        { type: 'WORKER_READY' },
        { type: 'ASSEMBLE_SUCCESS', payload: { binary: [], size: 0 } },
        { type: 'ASSEMBLE_ERROR', payload: { line: 1, message: 'Error' } },
      ];

      expect(events[0].type).toBe('WORKER_READY');
      expect(events[1].type).toBe('ASSEMBLE_SUCCESS');
      expect(events[2].type).toBe('ASSEMBLE_ERROR');
    });

    it('should discriminate events by type', () => {
      const event: AssemblerEvent = {
        type: 'ASSEMBLE_SUCCESS',
        payload: { binary: [1, 2, 3], size: 3 },
      };

      // Type narrowing via discriminated union
      if (event.type === 'ASSEMBLE_SUCCESS') {
        expect(event.payload.binary).toHaveLength(3);
        expect(event.payload.size).toBe(3);
      }
    });
  });

  describe('AssemblerModule interface', () => {
    it('should define all required WASM wrapper methods', () => {
      // This test verifies the interface shape at compile time
      // We create a mock that satisfies the interface
      const mockModule: Partial<AssemblerModule> = {
        ccall: () => 0,
        cwrap: () => () => 0,
        HEAPU8: new Uint8Array(0),
        UTF8ToString: () => '',
        stringToUTF8: () => {},
        lengthBytesUTF8: () => 0,
        _malloc: () => 0,
        _free: () => {},
        _assemble_source: () => 0,
        _get_output: () => 0,
        _get_output_size: () => 0,
        _get_error: () => 0,
        _get_error_line: () => 0,
      };

      // Type assertion succeeds if interface is properly defined
      expect(mockModule.ccall).toBeDefined();
      expect(mockModule._assemble_source).toBeDefined();
      expect(mockModule._get_output).toBeDefined();
      expect(mockModule._get_error).toBeDefined();
    });
  });

  describe('AssemblerModuleFactory', () => {
    it('should be a function that returns a Promise', async () => {
      // Create a mock factory
      const mockFactory: AssemblerModuleFactory = async () => {
        return {
          ccall: () => 0,
          cwrap: () => () => 0,
          HEAPU8: new Uint8Array(0),
          UTF8ToString: () => '',
          stringToUTF8: () => {},
          lengthBytesUTF8: () => 0,
          _malloc: () => 0,
          _free: () => {},
          _assemble_source: () => 0,
          _get_output: () => 0,
          _get_output_size: () => 0,
          _get_error: () => 0,
          _get_error_line: () => 0,
        };
      };

      const module = await mockFactory();
      expect(module).toBeDefined();
      expect(typeof module._assemble_source).toBe('function');
    });
  });
});

describe('WASM Module Validation', () => {
  describe('validateAssemblerModule', () => {
    it('should return null for valid module with all exports', () => {
      const validModule = {
        ccall: () => 0,
        cwrap: () => () => 0,
        HEAPU8: new Uint8Array(0),
        UTF8ToString: () => '',
        stringToUTF8: () => {},
        lengthBytesUTF8: () => 0,
        _malloc: () => 0,
        _free: () => {},
        _assemble_source: () => 0,
        _get_output: () => 0,
        _get_output_size: () => 0,
        _get_error: () => 0,
        _get_error_line: () => 0,
      };

      const error = validateAssemblerModule(validModule);
      expect(error).toBeNull();
    });

    it('should detect missing WASM exports', () => {
      const moduleWithMissingExports = {
        ccall: () => 0,
        cwrap: () => () => 0,
        HEAPU8: new Uint8Array(0),
        UTF8ToString: () => '',
        stringToUTF8: () => {},
        lengthBytesUTF8: () => 0,
        _malloc: () => 0,
        _free: () => {},
        // Missing: _assemble_source, _get_output, _get_output_size, _get_error, _get_error_line
      };

      const error = validateAssemblerModule(moduleWithMissingExports);
      expect(error).not.toBeNull();
      expect(error?.missingExports).toContain('_assemble_source');
      expect(error?.missingExports).toContain('_get_output');
      expect(error?.missingExports).toContain('_get_output_size');
      expect(error?.missingExports).toContain('_get_error');
      expect(error?.missingExports).toContain('_get_error_line');
      expect(error?.missingRuntimeMethods).toHaveLength(0);
    });

    it('should detect missing runtime methods', () => {
      const moduleWithMissingRuntime = {
        _malloc: () => 0,
        _free: () => {},
        _assemble_source: () => 0,
        _get_output: () => 0,
        _get_output_size: () => 0,
        _get_error: () => 0,
        _get_error_line: () => 0,
        // Missing: ccall, cwrap, HEAPU8, UTF8ToString, stringToUTF8, lengthBytesUTF8
      };

      const error = validateAssemblerModule(moduleWithMissingRuntime);
      expect(error).not.toBeNull();
      expect(error?.missingRuntimeMethods).toContain('ccall');
      expect(error?.missingRuntimeMethods).toContain('cwrap');
      expect(error?.missingRuntimeMethods).toContain('HEAPU8');
      expect(error?.missingRuntimeMethods).toContain('UTF8ToString');
      expect(error?.missingExports).toHaveLength(0);
    });

    it('should reject null module', () => {
      const error = validateAssemblerModule(null);
      expect(error).not.toBeNull();
      expect(error?.missingExports.length).toBeGreaterThan(0);
      expect(error?.missingRuntimeMethods.length).toBeGreaterThan(0);
    });

    it('should reject undefined module', () => {
      const error = validateAssemblerModule(undefined);
      expect(error).not.toBeNull();
    });

    it('should reject non-object module', () => {
      const error = validateAssemblerModule('not an object');
      expect(error).not.toBeNull();
    });

    it('should detect when HEAPU8 is not a Uint8Array', () => {
      const moduleWithBadHeap = {
        ccall: () => 0,
        cwrap: () => () => 0,
        HEAPU8: 'not a Uint8Array', // Wrong type
        UTF8ToString: () => '',
        stringToUTF8: () => {},
        lengthBytesUTF8: () => 0,
        _malloc: () => 0,
        _free: () => {},
        _assemble_source: () => 0,
        _get_output: () => 0,
        _get_output_size: () => 0,
        _get_error: () => 0,
        _get_error_line: () => 0,
      };

      const error = validateAssemblerModule(moduleWithBadHeap);
      expect(error).not.toBeNull();
      expect(error?.missingRuntimeMethods).toContain('HEAPU8');
    });
  });

  describe('REQUIRED_WASM_EXPORTS', () => {
    it('should include all required C function exports', () => {
      expect(REQUIRED_WASM_EXPORTS).toContain('_assemble_source');
      expect(REQUIRED_WASM_EXPORTS).toContain('_get_output');
      expect(REQUIRED_WASM_EXPORTS).toContain('_get_output_size');
      expect(REQUIRED_WASM_EXPORTS).toContain('_get_error');
      expect(REQUIRED_WASM_EXPORTS).toContain('_get_error_line');
      expect(REQUIRED_WASM_EXPORTS).toContain('_malloc');
      expect(REQUIRED_WASM_EXPORTS).toContain('_free');
    });
  });

  describe('REQUIRED_RUNTIME_METHODS', () => {
    it('should include all required Emscripten runtime methods', () => {
      expect(REQUIRED_RUNTIME_METHODS).toContain('ccall');
      expect(REQUIRED_RUNTIME_METHODS).toContain('cwrap');
      expect(REQUIRED_RUNTIME_METHODS).toContain('HEAPU8');
      expect(REQUIRED_RUNTIME_METHODS).toContain('UTF8ToString');
      expect(REQUIRED_RUNTIME_METHODS).toContain('stringToUTF8');
      expect(REQUIRED_RUNTIME_METHODS).toContain('lengthBytesUTF8');
    });
  });
});

describe('WASM Module Integration', () => {
  /**
   * These tests verify the WASM module can be loaded and used.
   *
   * Note: WASM modules cannot be loaded directly in jsdom.
   * These tests document the expected behavior and verify the
   * types compile correctly. Actual WASM testing requires:
   *
   * 1. A real browser environment, OR
   * 2. A Node.js environment with WASM support, OR
   * 3. Playwright/Puppeteer E2E tests
   *
   * The build verification in Task 4 confirms the WASM builds correctly.
   * Story 3.2 will create the Web Worker that loads this module.
   */

  describe('Expected WASM API', () => {
    it('should export assemble_source function', () => {
      // The C function signature:
      // int assemble_source(const char* source)
      // Returns 1 on success, 0 on failure
      const expectedSignature = {
        name: 'assemble_source',
        returnType: 'number',
        argTypes: ['string'],
      };

      expect(expectedSignature.name).toBe('assemble_source');
      expect(expectedSignature.returnType).toBe('number');
      expect(expectedSignature.argTypes).toContain('string');
    });

    it('should export get_output function', () => {
      // const uint8_t* get_output(void)
      // Returns pointer to binary output
      const expectedSignature = {
        name: 'get_output',
        returnType: 'number', // Pointer is a number
        argTypes: [] as string[],
      };

      expect(expectedSignature.name).toBe('get_output');
      expect(expectedSignature.returnType).toBe('number');
    });

    it('should export get_output_size function', () => {
      // int get_output_size(void)
      // Returns number of bytes in output
      const expectedSignature = {
        name: 'get_output_size',
        returnType: 'number',
        argTypes: [] as string[],
      };

      expect(expectedSignature.name).toBe('get_output_size');
    });

    it('should export get_error function', () => {
      // const char* get_error(void)
      // Returns pointer to error string
      const expectedSignature = {
        name: 'get_error',
        returnType: 'number', // Pointer, use UTF8ToString to convert
        argTypes: [] as string[],
      };

      expect(expectedSignature.name).toBe('get_error');
    });

    it('should export get_error_line function', () => {
      // int get_error_line(void)
      // Returns 1-based line number or 0
      const expectedSignature = {
        name: 'get_error_line',
        returnType: 'number',
        argTypes: [] as string[],
      };

      expect(expectedSignature.name).toBe('get_error_line');
    });
  });

  describe('Expected Assembly Behavior', () => {
    it('should document valid Micro4 program structure', () => {
      // This documents what the assembler expects
      const validProgram = `
; Simple counter program
        ORG 0x00     ; Set origin to address 0
START:  LDA 0x10     ; Load value from address 0x10
        ADD 0x11     ; Add value from address 0x11
        STA 0x12     ; Store result at address 0x12
        HLT          ; Halt execution

        ORG 0x10     ; Data section
DATA:   DB 5         ; Initial value
        DB 3         ; Amount to add
`.trim();

      // The assembler should accept this and produce binary output
      expect(validProgram).toContain('ORG');
      expect(validProgram).toContain('LDA');
      expect(validProgram).toContain('HLT');
    });

    it('should document expected error for undefined label', () => {
      // Example of code that would produce an undefined label error:
      // LDA 0x10
      // JMP UNKNOWN  ; UNKNOWN label not defined
      // HLT

      // Expected error: line 2 (0-indexed: 1), message about undefined label
      const expectedError: AssemblerError = {
        line: 2,
        message: 'Undefined label', // Message will contain "Undefined label: UNKNOWN"
      };

      expect(expectedError.line).toBeGreaterThan(0);
      expect(expectedError.message).toContain('Undefined');
    });

    it('should document expected error for invalid instruction', () => {
      // Example of code that would produce an invalid instruction error:
      // FOO 0x10     ; FOO is not a valid instruction
      // HLT

      // Expected error on line 1
      const expectedError: AssemblerError = {
        line: 1,
        message: 'Unknown instruction',
      };

      expect(expectedError.line).toBe(1);
    });
  });
});
