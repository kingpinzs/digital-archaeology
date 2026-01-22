/**
 * Test Utilities
 *
 * Shared testing utilities for Digital Archaeology.
 */

// Monaco mock types (implementation must be copied due to vi.hoisted requirements)
export type {
  MockMonacoModel,
  MockMonacoEditor,
  MockMonaco,
  CursorPosition,
  CursorPositionListener,
} from './monaco-mock';
