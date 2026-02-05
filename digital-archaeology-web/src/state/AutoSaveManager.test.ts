// src/state/AutoSaveManager.test.ts
// Tests for AutoSaveManager (debounced auto-save)
// Story 9.2: Implement IndexedDB for Projects

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoSaveManager } from './AutoSaveManager';

describe('AutoSaveManager (Story 9.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should default to 2000ms debounce', () => {
      const manager = new AutoSaveManager();
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);

      // Should not fire before 2000ms
      vi.advanceTimersByTime(1999);
      expect(saveFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(saveFn).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should accept custom debounce time', () => {
      const manager = new AutoSaveManager(500);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);

      vi.advanceTimersByTime(499);
      expect(saveFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(saveFn).toHaveBeenCalledTimes(1);

      manager.destroy();
    });
  });

  describe('markDirty()', () => {
    it('should set isDirty to true immediately', () => {
      const manager = new AutoSaveManager(1000);
      expect(manager.isDirty).toBe(false);

      manager.markDirty(vi.fn().mockResolvedValue(undefined));
      expect(manager.isDirty).toBe(true);

      manager.destroy();
    });

    it('should call save callback after debounce period', () => {
      const manager = new AutoSaveManager(1000);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);
      vi.advanceTimersByTime(1000);

      expect(saveFn).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should reset debounce on repeated calls', () => {
      const manager = new AutoSaveManager(1000);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);
      vi.advanceTimersByTime(500);
      expect(saveFn).not.toHaveBeenCalled();

      // Reset debounce
      manager.markDirty(saveFn);
      vi.advanceTimersByTime(500);
      expect(saveFn).not.toHaveBeenCalled();

      // Now full 1000ms from last call
      vi.advanceTimersByTime(500);
      expect(saveFn).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should clear isDirty after successful save', async () => {
      const manager = new AutoSaveManager(100);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);
      expect(manager.isDirty).toBe(true);

      vi.advanceTimersByTime(100);
      // Wait for the async save to complete
      await vi.runAllTimersAsync();

      expect(manager.isDirty).toBe(false);

      manager.destroy();
    });

    it('should keep isDirty true if save fails', async () => {
      const manager = new AutoSaveManager(100);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const saveFn = vi.fn().mockRejectedValue(new Error('Save failed'));

      manager.markDirty(saveFn);
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(manager.isDirty).toBe(true);

      consoleSpy.mockRestore();
      manager.destroy();
    });
  });

  describe('saveNow()', () => {
    it('should execute save immediately when dirty', async () => {
      const manager = new AutoSaveManager(10000);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(vi.fn().mockResolvedValue(undefined));
      expect(manager.isDirty).toBe(true);

      await manager.saveNow(saveFn);
      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(manager.isDirty).toBe(false);

      manager.destroy();
    });

    it('should not execute save when not dirty', async () => {
      const manager = new AutoSaveManager(1000);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      await manager.saveNow(saveFn);
      expect(saveFn).not.toHaveBeenCalled();

      manager.destroy();
    });

    it('should cancel pending debounce timer', async () => {
      const manager = new AutoSaveManager(1000);
      const debouncedSaveFn = vi.fn().mockResolvedValue(undefined);
      const immediateSaveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(debouncedSaveFn);
      await manager.saveNow(immediateSaveFn);

      // The debounced save should have been cancelled
      vi.advanceTimersByTime(2000);
      expect(debouncedSaveFn).not.toHaveBeenCalled();
      expect(immediateSaveFn).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should handle save failure gracefully', async () => {
      const manager = new AutoSaveManager(1000);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const saveFn = vi.fn().mockRejectedValue(new Error('DB error'));

      manager.markDirty(vi.fn().mockResolvedValue(undefined));
      await manager.saveNow(saveFn);

      // Should not throw
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      manager.destroy();
    });
  });

  describe('cancel()', () => {
    it('should cancel pending save', () => {
      const manager = new AutoSaveManager(1000);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);
      manager.cancel();

      vi.advanceTimersByTime(2000);
      expect(saveFn).not.toHaveBeenCalled();

      manager.destroy();
    });

    it('should not throw when no pending save', () => {
      const manager = new AutoSaveManager(1000);

      // Should not throw
      manager.cancel();

      manager.destroy();
    });
  });

  describe('isDirty', () => {
    it('should be false initially', () => {
      const manager = new AutoSaveManager();
      expect(manager.isDirty).toBe(false);
      manager.destroy();
    });

    it('should be true after markDirty', () => {
      const manager = new AutoSaveManager(1000);
      manager.markDirty(vi.fn().mockResolvedValue(undefined));
      expect(manager.isDirty).toBe(true);
      manager.destroy();
    });
  });

  describe('destroy()', () => {
    it('should cancel pending save on destroy', () => {
      const manager = new AutoSaveManager(1000);
      const saveFn = vi.fn().mockResolvedValue(undefined);

      manager.markDirty(saveFn);
      manager.destroy();

      vi.advanceTimersByTime(2000);
      expect(saveFn).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      const manager = new AutoSaveManager(1000);

      manager.destroy();
      manager.destroy(); // Should not throw
    });
  });
});
