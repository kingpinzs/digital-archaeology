// src/hdl/index.ts
// Barrel export for HDL module
// Story 7.1: Create HDL Viewer Panel

/**
 * HDL Loader - Utility for fetching HDL files from the server
 * @see HdlLoader - Class for managing loading state
 * @see loadHdlFile - Function for one-shot loading
 * @see DEFAULT_HDL_PATH - Default path to Micro4 CPU HDL file
 */
export { HdlLoader, loadHdlFile, DEFAULT_HDL_PATH } from './HdlLoader';

/**
 * HDL Loader Types
 * @see HdlLoadState - Loading state: 'idle' | 'loading' | 'success' | 'error'
 * @see HdlLoadResult - Result object containing state, content, and error
 */
export type { HdlLoadState, HdlLoadResult } from './HdlLoader';

/**
 * HDL Viewer Panel - Monaco-based read-only viewer for HDL files
 * @see HdlViewerPanel - Main panel component with mount/destroy lifecycle
 * @see resetHdlThemeRegistration - Testing utility to reset theme state
 */
export { HdlViewerPanel, resetHdlThemeRegistration } from './HdlViewerPanel';

/**
 * HDL Viewer Panel Types
 * @see HdlViewerPanelOptions - Configuration options (hdlPath, onClose, onLoad, onError, onSave, onEditModeChange)
 * Story 7.3: Added onSave and onEditModeChange callbacks for edit mode
 */
export type { HdlViewerPanelOptions } from './HdlViewerPanel';

/**
 * M4HDL Language Definition - Monaco syntax highlighting for HDL files
 * Story 7.2: Implement HDL Syntax Highlighting
 * @see registerM4hdlLanguage - Function to register language with Monaco
 * @see resetM4hdlLanguageRegistration - Testing utility to reset registration state
 * @see m4hdlLanguageId - Language identifier ('m4hdl')
 * @see m4hdlMonarchLanguage - Monarch tokenizer definition
 */
export {
  registerM4hdlLanguage,
  resetM4hdlLanguageRegistration,
  m4hdlLanguageId,
  m4hdlLanguageConfiguration,
  m4hdlMonarchLanguage,
} from './m4hdl-language';

/**
 * HDL Validator - Validates M4HDL syntax and semantics
 * Story 7.4: Implement HDL Validation
 * @see HdlValidator - Class for validating HDL content
 * @see HdlValidationResult - Result with valid flag, errors, and warnings
 * @see HdlValidationError - Error with line, column, message, severity
 * @see HdlValidationSeverity - 'error' | 'warning'
 */
export { HdlValidator } from './HdlValidator';
export type {
  HdlValidationResult,
  HdlValidationError,
  HdlValidationSeverity,
} from './HdlValidator';

/**
 * HDL Parser - Parses M4HDL content into an Abstract Syntax Tree
 * Story 7.6: Implement HDL-to-Circuit Regeneration
 * @see HdlParser - Class for parsing HDL content to AST
 * @see HdlAst - AST with wires, gates, and errors arrays
 * @see HdlWireNode - Wire declaration (name, width, isInput, isOutput)
 * @see HdlGateNode - Gate instantiation (type, name, inputs, outputs)
 * @see HdlWireRef - Wire reference with optional bit index
 * @see HdlParseError - Parse error with line and message
 */
export { HdlParser } from './HdlParser';
export type {
  HdlAst,
  HdlWireNode,
  HdlGateNode,
  HdlWireRef,
  HdlParseError,
} from './HdlParser';

/**
 * HDL to Circuit Generator - Converts AST to CircuitData for visualization
 * Story 7.6: Implement HDL-to-Circuit Regeneration
 * @see HdlToCircuitGenerator - Class for generating CircuitData from AST
 */
export { HdlToCircuitGenerator } from './HdlToCircuitGenerator';
