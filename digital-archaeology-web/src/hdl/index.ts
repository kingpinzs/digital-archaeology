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
 * @see HdlViewerPanelOptions - Configuration options (hdlPath, onClose, onLoad, onError)
 */
export type { HdlViewerPanelOptions } from './HdlViewerPanel';
