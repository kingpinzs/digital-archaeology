// src/state/AutoSaveManager.ts
// Debounced auto-save manager for project persistence
// Story 9.2: Implement IndexedDB for Projects

/** Callback invoked when debounce period elapses and save should execute */
export type SaveCallback = () => Promise<void>;

/**
 * Manages debounced auto-saving of project data.
 * Waits for a configurable quiet period after the last change
 * before triggering the save callback.
 */
export class AutoSaveManager {
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;
  private _isDirty: boolean = false;

  constructor(debounceMs: number = 2000) {
    this.debounceMs = debounceMs;
  }

  /**
   * Mark content as changed and schedule save after debounce period.
   * Resets the timer on each call (true debounce behavior).
   */
  markDirty(onSave: SaveCallback): void {
    this._isDirty = true;

    // Clear existing timeout to reset debounce
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
    }

    // Schedule new save after debounce period
    this.debounceTimeout = setTimeout(async () => {
      this.debounceTimeout = null;
      try {
        await onSave();
        this._isDirty = false;
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Keep dirty flag so next change triggers another save attempt
      }
    }, this.debounceMs);
  }

  /**
   * Force immediate save (e.g., on page unload or before loading example).
   * Clears any pending debounce timer.
   */
  async saveNow(onSave: SaveCallback): Promise<void> {
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this._isDirty) {
      try {
        await onSave();
        this._isDirty = false;
      } catch (error) {
        console.error('Immediate save failed:', error);
      }
    }
  }

  /**
   * Cancel pending save without executing it.
   */
  cancel(): void {
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }

  /**
   * Check if there are unsaved changes.
   */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Destroy the manager and cancel pending operations.
   */
  destroy(): void {
    this.cancel();
  }
}
