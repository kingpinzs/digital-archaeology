/**
 * Test Utilities
 *
 * Shared testing utilities for Digital Archaeology.
 *
 * MONACO MOCK NOTE (Action Item #4):
 * The Monaco mock is consolidated in monaco-mock.ts, but due to Vitest's
 * vi.hoisted() requirement, the implementation cannot be directly imported.
 * See monaco-mock.ts for the reference implementation to copy into test files.
 *
 * What you CAN import:
 * - Type definitions (MockMonacoEditor, CursorPositionListener, etc.)
 *
 * What you CANNOT import (must copy):
 * - The actual mock implementation (must be in vi.hoisted() block)
 */

// Monaco mock types (implementation must be copied due to vi.hoisted requirements)
export type {
  MockMonacoModel,
  MockMonacoEditor,
  MockMonaco,
  MockRange,
  CursorPosition,
  CursorPositionListener,
  ContentChangeListener,
} from './monaco-mock';
