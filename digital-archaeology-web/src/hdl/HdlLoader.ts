// src/hdl/HdlLoader.ts
// HDL file loader utility for fetching HDL content
// Story 7.1: Create HDL Viewer Panel - Task 2

/**
 * Load state for HDL content.
 */
export type HdlLoadState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Result of loading an HDL file.
 */
export interface HdlLoadResult {
  /** Current loading state */
  state: HdlLoadState;
  /** HDL file content (when state is 'success') */
  content: string | null;
  /** Error message (when state is 'error') */
  error: string | null;
}

/**
 * Default HDL file path (Micro4 CPU definition).
 */
export const DEFAULT_HDL_PATH = 'hdl/04_micro4_cpu.m4hdl';

/**
 * Load an HDL file from the server.
 * @param path - Path to the HDL file relative to BASE_URL (defaults to Micro4 CPU)
 * @returns Promise resolving to the load result
 */
export async function loadHdlFile(path: string = DEFAULT_HDL_PATH): Promise<HdlLoadResult> {
  try {
    const url = `${import.meta.env.BASE_URL}${path}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        state: 'error',
        content: null,
        error: `Failed to load HDL file: ${response.status} ${response.statusText}`,
      };
    }

    const content = await response.text();
    return {
      state: 'success',
      content,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      state: 'error',
      content: null,
      error: `Failed to load HDL file: ${errorMessage}`,
    };
  }
}

/**
 * HdlLoader class for managing HDL file loading with state tracking.
 */
export class HdlLoader {
  private state: HdlLoadState = 'idle';
  private content: string | null = null;
  private error: string | null = null;
  private path: string;

  constructor(path: string = DEFAULT_HDL_PATH) {
    this.path = path;
  }

  /**
   * Get the current load state.
   */
  getState(): HdlLoadState {
    return this.state;
  }

  /**
   * Get the loaded content (null if not loaded or error).
   */
  getContent(): string | null {
    return this.content;
  }

  /**
   * Get the error message (null if no error).
   */
  getError(): string | null {
    return this.error;
  }

  /**
   * Get the current path.
   */
  getPath(): string {
    return this.path;
  }

  /**
   * Set a new path for loading.
   */
  setPath(path: string): void {
    this.path = path;
  }

  /**
   * Load the HDL file.
   * @returns Promise resolving to the load result
   */
  async load(): Promise<HdlLoadResult> {
    this.state = 'loading';
    this.content = null;
    this.error = null;

    const result = await loadHdlFile(this.path);
    this.state = result.state;
    this.content = result.content;
    this.error = result.error;

    return result;
  }

  /**
   * Reset the loader to idle state.
   */
  reset(): void {
    this.state = 'idle';
    this.content = null;
    this.error = null;
  }
}
