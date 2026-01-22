/**
 * Monaco Editor Mock Factory
 *
 * Due to Vitest's vi.hoisted() requirements, Monaco mocks cannot be directly imported.
 * This file provides the REFERENCE IMPLEMENTATION that should be copied into test files.
 *
 * USAGE PATTERN:
 * 1. Copy the createMonacoMock() contents into vi.hoisted() in your test file
 * 2. Call vi.mock('monaco-editor', () => mockMonaco) after the hoisted block
 * 3. Import your module under test AFTER the mock setup
 *
 * @example
 * ```typescript
 * // In your test file:
 * const { mockEditorInstance, mockMonaco, resetMock } = vi.hoisted(() => {
 *   // Copy contents of createMonacoMock() here
 *   return { mockEditorInstance, mockMonaco, resetMock };
 * });
 *
 * vi.mock('monaco-editor', () => mockMonaco);
 *
 * import { Editor } from './Editor';
 * ```
 */

import type { Mock } from 'vitest';

/**
 * Type definitions for Monaco mock - use these for type safety in tests.
 */
export interface MockMonacoModel {
  uri: string;
  undo: Mock;
  redo: Mock;
}

export interface MockMonacoEditor {
  dispose: Mock;
  getValue: Mock;
  setValue: Mock;
  getModel: Mock;
  focus: Mock;
  layout: Mock;
  onDidChangeCursorPosition: Mock;
  trigger: Mock;
  getContribution: Mock;
}

export interface MockMonaco {
  editor: {
    create: Mock;
    defineTheme: Mock;
  };
  languages: {
    register: Mock;
    setLanguageConfiguration: Mock;
    setMonarchTokensProvider: Mock;
  };
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export type CursorPositionListener = (e: { position: CursorPosition }) => void;

/**
 * REFERENCE IMPLEMENTATION - Copy this into vi.hoisted() in your test file.
 *
 * This cannot be imported due to Vitest hoisting requirements.
 * The code below is the canonical mock implementation.
 */
export function createMonacoMockReference(): {
  mockEditorInstance: MockMonacoEditor;
  mockMonaco: MockMonaco;
  mockModel: MockMonacoModel;
  cursorPositionListeners: CursorPositionListener[];
  mockCursorDisposable: { dispose: Mock };
  resetHistory: () => void;
} {
  // This function exists for documentation purposes only.
  // Copy the contents of this function into vi.hoisted() in your test file.
  throw new Error(
    'Do not call createMonacoMockReference() directly. ' +
      'Copy its contents into vi.hoisted() in your test file.'
  );
}

/*
 * ============================================================================
 * COPY THE CODE BELOW INTO vi.hoisted() IN YOUR TEST FILE
 * ============================================================================
 *
 * const { mockEditorInstance, mockMonaco, mockModel, resetHistory, cursorPositionListeners, mockCursorDisposable } = vi.hoisted(() => {
 *   // Undo/redo history simulation
 *   let history: string[] = [''];
 *   let pointer = 0;
 *
 *   // Store cursor position change listeners
 *   const cursorPositionListeners: Array<(e: { position: { lineNumber: number; column: number } }) => void> = [];
 *
 *   const resetHistory = () => {
 *     history = [''];
 *     pointer = 0;
 *     cursorPositionListeners.length = 0;
 *   };
 *
 *   const mockCursorDisposable = {
 *     dispose: vi.fn(),
 *   };
 *
 *   const mockModel = {
 *     uri: 'test-uri',
 *     undo: vi.fn(() => {
 *       if (pointer > 0) pointer -= 1;
 *     }),
 *     redo: vi.fn(() => {
 *       if (pointer < history.length - 1) pointer += 1;
 *     }),
 *   };
 *
 *   const mockEditorInstance = {
 *     dispose: vi.fn(),
 *     getValue: vi.fn(() => history[pointer]),
 *     setValue: vi.fn((value: string) => {
 *       history = history.slice(0, pointer + 1);
 *       history.push(value);
 *       pointer = history.length - 1;
 *     }),
 *     getModel: vi.fn(() => mockModel),
 *     focus: vi.fn(),
 *     layout: vi.fn(),
 *     onDidChangeCursorPosition: vi.fn((callback) => {
 *       cursorPositionListeners.push(callback);
 *       return mockCursorDisposable;
 *     }),
 *     trigger: vi.fn(),
 *     getContribution: vi.fn(() => ({ start: vi.fn() })),
 *   };
 *
 *   const mockMonaco = {
 *     editor: {
 *       create: vi.fn(() => mockEditorInstance),
 *       defineTheme: vi.fn(),
 *     },
 *     languages: {
 *       register: vi.fn(),
 *       setLanguageConfiguration: vi.fn(),
 *       setMonarchTokensProvider: vi.fn(),
 *     },
 *   };
 *
 *   return { mockEditorInstance, mockMonaco, mockModel, resetHistory, cursorPositionListeners, mockCursorDisposable };
 * });
 *
 * vi.mock('monaco-editor', () => mockMonaco);
 *
 * ============================================================================
 */
