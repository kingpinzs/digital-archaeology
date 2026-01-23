/**
 * Monaco Editor Mock for Tests
 *
 * Action Item #4 from Epic 3 Retrospective: Consolidate Monaco mock into shared utility
 *
 * STATUS: CONSOLIDATED (with Vitest limitation)
 *
 * The Monaco mock is consolidated in this file, but due to Vitest's vi.hoisted()
 * requirements, it CANNOT be directly imported. The mock code must be copied
 * into each test file's vi.hoisted() block.
 *
 * WHY THIS LIMITATION EXISTS:
 * - vi.hoisted() runs BEFORE any imports
 * - Mocks must be defined in hoisted block to work with vi.mock()
 * - Code in hoisted blocks cannot reference external imports
 * - This is a Vitest architectural constraint, not a code organization issue
 *
 * WHAT WE PROVIDE:
 * 1. Type definitions for type-safe tests (CAN be imported)
 * 2. Reference implementation (COPY into your test file)
 * 3. Documentation on proper usage
 *
 * USAGE:
 * ```typescript
 * // 1. Import types (these work)
 * import type { MockMonacoEditor, CursorPositionListener } from '@/test-utils';
 *
 * // 2. Copy the mock implementation into vi.hoisted()
 * const { mockEditorInstance, mockMonaco } = vi.hoisted(() => {
 *   // Copy REFERENCE_IMPLEMENTATION below
 *   return { mockEditorInstance, mockMonaco };
 * });
 *
 * // 3. Apply the mock
 * vi.mock('monaco-editor', () => mockMonaco);
 * ```
 */

import type { Mock } from 'vitest';

// =============================================================================
// TYPE DEFINITIONS - These CAN be imported for type safety
// =============================================================================

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
  onDidChangeModelContent: Mock;
  addAction: Mock;
  deltaDecorations: Mock;
  setPosition: Mock;
  revealLineInCenter: Mock;
  trigger: Mock;
  getContribution: Mock;
  /** Test helper: directly set editor content without triggering listeners */
  _setContent: (content: string) => void;
  /** Test helper: reset editor content to empty string */
  _resetContent: () => void;
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
  Range: new (
    startLine: number,
    startCol: number,
    endLine: number,
    endCol: number
  ) => MockRange;
  KeyMod: { CtrlCmd: number; Shift: number; Alt: number };
  KeyCode: Record<string, number>;
  MarkerSeverity: { Error: number; Warning: number; Info: number; Hint: number };
}

export interface MockRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export type CursorPositionListener = (e: { position: CursorPosition }) => void;
export type ContentChangeListener = () => void;

// =============================================================================
// REFERENCE IMPLEMENTATION - Copy this into vi.hoisted() in your test file
// =============================================================================

/**
 * DO NOT CALL THIS FUNCTION - it exists only for documentation.
 * Copy the code below into your test file's vi.hoisted() block.
 */
export function _referenceImplementation_DO_NOT_IMPORT(): never {
  throw new Error(
    'Do not import _referenceImplementation_DO_NOT_IMPORT. ' +
      'Copy the code from monaco-mock.ts into vi.hoisted() in your test file.'
  );
}

/*
 * ============================================================================
 * COPY THE CODE BELOW INTO vi.hoisted() IN YOUR TEST FILE
 * ============================================================================
 *
 * const {
 *   mockEditorInstance,
 *   mockMonaco,
 *   mockModel,
 *   MockRange,
 *   cursorPositionListeners,
 *   contentChangeListeners,
 *   addedActions,
 *   mockCursorDisposable,
 * } = vi.hoisted(() => {
 *   // Mock Range class for Monaco decorations
 *   class MockRange {
 *     startLineNumber: number;
 *     startColumn: number;
 *     endLineNumber: number;
 *     endColumn: number;
 *     constructor(startLine: number, startCol: number, endLine: number, endCol: number) {
 *       this.startLineNumber = startLine;
 *       this.startColumn = startCol;
 *       this.endLineNumber = endLine;
 *       this.endColumn = endCol;
 *     }
 *   }
 *
 *   const mockModel = {
 *     uri: 'test-uri',
 *     undo: vi.fn(),
 *     redo: vi.fn(),
 *   };
 *
 *   // Track listeners for testing
 *   const cursorPositionListeners: Array<(e: { position: { lineNumber: number; column: number } }) => void> = [];
 *   const contentChangeListeners: Array<() => void> = [];
 *   const addedActions: Array<{ id: string; label: string; keybindings: number[]; run: () => void }> = [];
 *   const mockCursorDisposable = { dispose: vi.fn() };
 *
 *   // Track editor content
 *   let editorContent = '';
 *
 *   const mockEditorInstance = {
 *     dispose: vi.fn(),
 *     getValue: vi.fn(() => editorContent),
 *     setValue: vi.fn((value: string) => {
 *       editorContent = value;
 *       contentChangeListeners.forEach(cb => cb());
 *     }),
 *     getModel: vi.fn(() => mockModel),
 *     focus: vi.fn(),
 *     layout: vi.fn(),
 *     onDidChangeCursorPosition: vi.fn((callback) => {
 *       cursorPositionListeners.push(callback);
 *       return mockCursorDisposable;
 *     }),
 *     onDidChangeModelContent: vi.fn((callback) => {
 *       contentChangeListeners.push(callback);
 *       return { dispose: vi.fn() };
 *     }),
 *     addAction: vi.fn((action) => {
 *       addedActions.push(action);
 *       return { dispose: vi.fn() };
 *     }),
 *     deltaDecorations: vi.fn(() => ['decoration-id']),
 *     setPosition: vi.fn(),
 *     revealLineInCenter: vi.fn(),
 *     trigger: vi.fn(),
 *     getContribution: vi.fn(() => ({ start: vi.fn() })),
 *     _setContent: (content: string) => { editorContent = content; },
 *     _resetContent: () => { editorContent = ''; },
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
 *     Range: MockRange,
 *     KeyMod: { CtrlCmd: 2048, Shift: 1024, Alt: 512 },
 *     KeyCode: {
 *       KeyZ: 56, KeyY: 55, Enter: 3, KeyS: 49, KeyO: 45, Escape: 9,
 *     },
 *     MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
 *   };
 *
 *   return {
 *     mockEditorInstance,
 *     mockMonaco,
 *     mockModel,
 *     MockRange,
 *     cursorPositionListeners,
 *     contentChangeListeners,
 *     addedActions,
 *     mockCursorDisposable,
 *   };
 * });
 *
 * vi.mock('monaco-editor', () => mockMonaco);
 *
 * ============================================================================
 */

// =============================================================================
// USAGE EXAMPLE - For reference only
// =============================================================================

/*
 * // In your test file (e.g., Editor.test.ts):
 *
 * import { describe, it, expect, beforeEach, vi } from 'vitest';
 * import type { MockMonacoEditor } from '@/test-utils';
 *
 * // Step 1: Define mock in hoisted block (copy from above)
 * const { mockEditorInstance, mockMonaco } = vi.hoisted(() => {
 *   // ... copy implementation ...
 *   return { mockEditorInstance, mockMonaco };
 * });
 *
 * // Step 2: Apply mock
 * vi.mock('monaco-editor', () => mockMonaco);
 *
 * // Step 3: Import module under test AFTER mock setup
 * import { Editor } from './Editor';
 *
 * describe('Editor', () => {
 *   beforeEach(() => {
 *     vi.clearAllMocks();
 *     (mockEditorInstance as MockMonacoEditor)._resetContent();
 *   });
 *
 *   it('should create editor', () => {
 *     const editor = new Editor();
 *     editor.mount(document.createElement('div'));
 *     expect(mockMonaco.editor.create).toHaveBeenCalled();
 *   });
 * });
 */
