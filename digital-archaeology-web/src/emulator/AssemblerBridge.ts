/**
 * AssemblerBridge
 *
 * Promise-based API for interacting with the Assembler Web Worker.
 * Handles worker lifecycle, message passing, and result transformation.
 */

import type {
  AssembleResult,
  AssemblerEvent,
  AssembleCommand,
  AssemblerError,
  AssemblerErrorType,
  CodeSnippet,
  InitAssemblerWasmCommand,
} from './types';
import { getStageConfig, getStageMemorySize, getNextStage, getStageInstructions, findEarliestStageForInstruction, getStageEducationalContent, LAB_STAGES } from '../config/stageConfig';
import type { LabStage } from '../config/stageConfig';

/**
 * Default timeout for assembly operations in milliseconds.
 * 10 seconds allows for complex programs while preventing indefinite hangs.
 * Can be overridden per-call via the timeoutMs parameter.
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Detect error type from error message patterns.
 * Based on C assembler error message formats.
 */
function detectErrorType(message: string): AssemblerErrorType {
  const lowerMessage = message.toLowerCase();

  // SYNTAX_ERROR patterns: unknown instruction, undefined label, invalid syntax
  if (
    lowerMessage.includes('unknown instruction') ||
    lowerMessage.includes('undefined label') ||
    lowerMessage.includes('invalid instruction') ||
    lowerMessage.includes('syntax error') ||
    lowerMessage.includes('unexpected')
  ) {
    return 'SYNTAX_ERROR';
  }

  // CONSTRAINT_ERROR patterns: range exceeded, overflow
  if (
    lowerMessage.includes('exceeds') ||
    lowerMessage.includes('range') ||
    lowerMessage.includes('overflow') ||
    lowerMessage.includes('too large') ||
    lowerMessage.includes('too small')
  ) {
    return 'CONSTRAINT_ERROR';
  }

  // VALUE_ERROR patterns: invalid address, invalid value, invalid operand
  if (
    lowerMessage.includes('invalid address') ||
    lowerMessage.includes('invalid value') ||
    lowerMessage.includes('invalid operand') ||
    lowerMessage.includes('invalid number')
  ) {
    return 'VALUE_ERROR';
  }

  // Default to SYNTAX_ERROR for unrecognized patterns
  return 'SYNTAX_ERROR';
}

/**
 * Generate code snippet from source code around the error line.
 * @param source - The full source code
 * @param lineNumber - 1-based line number where the error occurred
 * @returns CodeSnippet with context
 */
function generateCodeSnippet(source: string, lineNumber: number): CodeSnippet {
  const lines = source.split('\n');
  const lineIndex = lineNumber - 1; // Convert to 0-based

  // Get the error line (or empty string if out of range)
  const errorLine = lines[lineIndex] ?? '';

  // Get context before (up to 1 line)
  const contextBefore: string[] = [];
  if (lineIndex > 0) {
    contextBefore.push(lines[lineIndex - 1]);
  }

  // Get context after (up to 1 line)
  const contextAfter: string[] = [];
  if (lineIndex < lines.length - 1) {
    contextAfter.push(lines[lineIndex + 1]);
  }

  return {
    line: errorLine,
    lineNumber,
    contextBefore,
    contextAfter,
  };
}

/**
 * Determine if an error is auto-fixable.
 * Only SYNTAX_ERROR with suggestions are auto-fixable.
 * VALUE_ERROR and CONSTRAINT_ERROR require user judgment.
 */
function isFixable(
  type: AssemblerErrorType,
  suggestion: string | undefined
): boolean {
  // Must have a suggestion to be fixable
  if (!suggestion) {
    return false;
  }

  // Only SYNTAX_ERROR is auto-fixable (e.g., typos in instruction names)
  // VALUE_ERROR and CONSTRAINT_ERROR require user judgment about correct values
  return type === 'SYNTAX_ERROR';
}

/**
 * Extract the unknown instruction mnemonic from a C assembler error message (Story 18.3).
 * Handles both "Unknown instruction: MNEMONIC" and
 * "Unknown instruction after REP/REPZ/REPNZ: MNEMONIC" variants from Micro16.
 * Returns uppercase mnemonic or null if message doesn't match the pattern.
 */
export function extractUnknownInstruction(message: string): string | null {
  const match = message.match(/Unknown instruction(?:\s+after\s+\w+)?:\s*(\S+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Build a CONSTRAINT_ERROR result when binary exceeds stage memory limit (Story 18.2).
 * Returns a failed AssembleResult with descriptive message and next-stage suggestion.
 */
function buildMemoryConstraintError(
  binarySize: number,
  memoryLimit: number,
  stage: LabStage,
): AssembleResult {
  const config = getStageConfig(stage);
  const nextStage = getNextStage(stage);
  const nextConfig = nextStage ? getStageConfig(nextStage) : null;

  let suggestion = `Reduce program size to fit in ${memoryLimit} bytes`;
  if (nextConfig) {
    suggestion += `, or advance to ${nextConfig.meta.label} (${nextConfig.meta.addressSpace} memory)`;
  }

  const edu = getStageEducationalContent(stage);
  const educationalContext = `${edu.memoryContext} ${edu.journeyTeaser}`;

  return {
    success: false,
    binary: null,
    error: {
      line: 0,
      message: `Program size (${binarySize} bytes) exceeds ${config.meta.label} memory limit (${memoryLimit} bytes)`,
      type: 'CONSTRAINT_ERROR',
      suggestion,
      fixable: false,
      educationalContext,
    },
  };
}

/**
 * Build a CONSTRAINT_ERROR result when an instruction is not available in the current stage (Story 18.3).
 * Returns a failed AssembleResult with educational message about which stage introduces the instruction.
 *
 * @param mnemonic - The uppercase instruction mnemonic that was rejected
 * @param line - The source line number where the instruction was used
 * @param stage - The current CPU stage
 * @param source - The full source code (for code snippet generation)
 */
function buildInstructionSetError(
  mnemonic: string,
  line: number,
  stage: LabStage,
  source: string,
  earliestStage: LabStage,
): AssembleResult {
  const config = getStageConfig(stage);
  const earliestConfig = getStageConfig(earliestStage);
  const mnemonicCount = getStageInstructions(stage).size;

  const suggestion = `The ${mnemonic} instruction is not available in ${config.meta.label}. It becomes available in ${earliestConfig.meta.label}`;

  const edu = getStageEducationalContent(stage);
  const educationalContext = `${edu.instructionContext} The ${mnemonic} instruction requires capabilities introduced in ${earliestConfig.meta.label}. ${edu.journeyTeaser}`;

  return {
    success: false,
    binary: null,
    error: {
      line,
      message: `Instruction "${mnemonic}" does not exist in ${config.meta.label} (${mnemonicCount} instructions available)`,
      type: 'CONSTRAINT_ERROR',
      suggestion,
      fixable: false,
      codeSnippet: generateCodeSnippet(source, line),
      educationalContext,
    },
  };
}

/**
 * Timeout for worker initialization in milliseconds.
 * 30 seconds accounts for WASM module download and compilation on slow networks.
 * This is longer than assembly timeout because WASM loading is a one-time cost.
 */
const INIT_TIMEOUT_MS = 30000;

/**
 * Bridge between main thread and Assembler Web Worker.
 *
 * @example
 * ```typescript
 * const bridge = new AssemblerBridge();
 * await bridge.init();
 *
 * const result = await bridge.assemble('LDA 5\nHLT');
 * if (result.success) {
 *   console.log('Binary:', result.binary);
 * } else {
 *   console.error('Error:', result.error?.message);
 * }
 *
 * bridge.terminate();
 * ```
 */
export class AssemblerBridge {
  private worker: Worker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private stage: LabStage = 'micro4';

  /**
   * Whether the bridge is initialized and ready for use.
   */
  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  /**
   * Initialize the bridge by creating the worker and waiting for WORKER_READY.
   * Sends INIT_WASM with the stage's assembler WASM path (Story 11.2).
   *
   * @param stage - The CPU stage to initialize the assembler for (default: 'micro4')
   * @throws Error if worker creation fails or initialization times out
   */
  init(stage: LabStage = 'micro4'): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }

    // Reuse existing init promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.stage = stage;
    this.initPromise = this.doInit().catch((error) => {
      // Clear initPromise on failure so subsequent init() calls can retry
      this.initPromise = null;
      throw error;
    });
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Create worker using Vite's URL syntax
      this.worker = new Worker(
        new URL('./assembler.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        this.worker?.terminate();
        this.worker = null;
        reject(new Error('Worker initialization timed out'));
      }, INIT_TIMEOUT_MS);

      const handleMessage = (event: MessageEvent<AssemblerEvent>) => {
        const data = event.data;

        if (data.type === 'WORKER_READY') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          this.worker?.removeEventListener('error', handleError);
          this.initialized = true;
          resolve();
        } else if (data.type === 'ASSEMBLE_ERROR' && !this.initialized) {
          // Error during initialization
          clearTimeout(timeout);
          this.worker?.terminate();
          this.worker = null;
          reject(new Error(data.payload.message));
        }
      };

      const handleError = (event: ErrorEvent) => {
        clearTimeout(timeout);
        this.worker?.removeEventListener('message', handleMessage);
        this.worker?.removeEventListener('error', handleError);
        this.worker?.terminate();
        this.worker = null;
        reject(new Error(`Worker error: ${event.message}`));
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      // Send INIT_WASM with config-derived path (Story 11.2)
      const config = getStageConfig(this.stage);
      const wasmJsPath = config.wasm.assemblerJs;
      if (!wasmJsPath) {
        clearTimeout(timeout);
        this.worker.terminate();
        this.worker = null;
        reject(new Error(`No assembler WASM available for stage: ${this.stage}`));
        return;
      }
      this.worker.postMessage({
        type: 'INIT_WASM',
        payload: { wasmJsPath },
      } satisfies InitAssemblerWasmCommand);
    });
  }

  /**
   * Assemble source code.
   *
   * @param source - Assembly source code to compile
   * @param timeoutMs - Timeout in milliseconds (default: 10000)
   * @returns Promise resolving to assembly result
   * @throws Error if bridge is not initialized or operation times out
   */
  async assemble(
    source: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<AssembleResult> {
    if (!this.worker || !this.initialized) {
      throw new Error('AssemblerBridge not initialized. Call init() first.');
    }

    // Capture worker reference for use in closures (TypeScript narrowing)
    const worker = this.worker;

    return new Promise<AssembleResult>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Assembly operation timed out'));
      }, timeoutMs);

      const handleMessage = (event: MessageEvent<AssemblerEvent>) => {
        const data = event.data;

        if (data.type === 'ASSEMBLE_SUCCESS') {
          cleanup();
          const binary = new Uint8Array(data.payload.binary);

          // Story 18.2: Enforce memory limit
          const memoryLimit = getStageMemorySize(this.stage);
          if (binary.length > memoryLimit) {
            resolve(buildMemoryConstraintError(binary.length, memoryLimit, this.stage));
            return;
          }

          resolve({
            success: true,
            binary,
            error: null,
          });
        } else if (data.type === 'ASSEMBLE_ERROR') {
          cleanup();

          // Story 18.3: Check if "unknown instruction" is actually a stage constraint.
          // If the instruction exists in a later stage, return CONSTRAINT_ERROR with
          // educational guidance instead of a generic SYNTAX_ERROR.
          const unknownMnemonic = extractUnknownInstruction(data.payload.message);
          if (unknownMnemonic) {
            const earliestStage = findEarliestStageForInstruction(unknownMnemonic);
            if (earliestStage !== null && LAB_STAGES.indexOf(earliestStage) > LAB_STAGES.indexOf(this.stage)) {
              resolve(buildInstructionSetError(unknownMnemonic, data.payload.line, this.stage, source, earliestStage));
              return;
            }
          }

          // Detect error type from message patterns
          const errorType = detectErrorType(data.payload.message);

          // Generate code snippet from source
          const codeSnippet = generateCodeSnippet(source, data.payload.line);

          // Determine if error is auto-fixable
          const fixable = isFixable(errorType, data.payload.suggestion);

          const error: AssemblerError = {
            line: data.payload.line,
            message: data.payload.message,
            type: errorType,
            codeSnippet,
            fixable,
          };
          if (data.payload.column !== undefined) {
            error.column = data.payload.column;
          }
          if (data.payload.suggestion !== undefined) {
            error.suggestion = data.payload.suggestion;
          }
          resolve({
            success: false,
            binary: null,
            error,
          });
        }
        // Ignore other message types (e.g., WORKER_READY after init)
      };

      const handleError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(`Worker error during assembly: ${event.message}`));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      // Send assemble command
      const command: AssembleCommand = {
        type: 'ASSEMBLE',
        payload: { source },
      };
      worker.postMessage(command);
    });
  }

  /**
   * Reinitialize the bridge with a new stage (Story 11.3).
   * Terminates the existing worker and creates a new one with the new stage's WASM module.
   *
   * @param stage - The new CPU stage to switch to
   * @throws Error if new WASM initialization fails
   */
  async reinit(stage: LabStage): Promise<void> {
    // 1. Terminate existing worker (if any)
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // 2. Reset flags
    this.initialized = false;
    this.initPromise = null;
    // 3. Init with new stage
    await this.init(stage);
  }

  /**
   * Terminate the worker and clean up resources.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }
}
