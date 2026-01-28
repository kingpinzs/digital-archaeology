// src/state/SettingsStorage.test.ts
// Tests for SettingsStorage service
// Story 9.1: Implement Local Storage for Settings

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SettingsStorage,
  SETTINGS_STORAGE_KEY,
  LEGACY_THEME_KEY,
} from './SettingsStorage';
import type { AppSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

describe('SettingsStorage (Story 9.1)', () => {
  let storage: SettingsStorage;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    });

    storage = new SettingsStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveSettings()', () => {
    it('should save settings to localStorage as JSON', () => {
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        speed: 100,
      };

      storage.saveSettings(settings);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => storage.saveSettings(DEFAULT_SETTINGS)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loadSettings()', () => {
    it('should return null when no settings exist', () => {
      const result = storage.loadSettings();
      expect(result).toBeNull();
    });

    it('should load and parse valid settings from localStorage', () => {
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        speed: 200,
        theme: 'story',
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(settings);

      const result = storage.loadSettings();

      expect(result).toEqual(settings);
    });

    it('should return null and clear invalid settings', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify({ invalid: true });

      const result = storage.loadSettings();

      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid settings data in localStorage, clearing...'
      );

      consoleSpy.mockRestore();
    });

    it('should handle JSON parse errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock[SETTINGS_STORAGE_KEY] = 'not-valid-json';

      const result = storage.loadSettings();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('clearSettings()', () => {
    it('should remove settings from localStorage', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(DEFAULT_SETTINGS);

      storage.clearSettings();

      expect(localStorage.removeItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(localStorage.removeItem).mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(() => storage.clearSettings()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('hasSettings()', () => {
    it('should return true when settings exist', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(DEFAULT_SETTINGS);

      expect(storage.hasSettings()).toBe(true);
    });

    it('should return false when settings do not exist', () => {
      expect(storage.hasSettings()).toBe(false);
    });

    it('should return false on localStorage error', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(storage.hasSettings()).toBe(false);
    });
  });

  describe('getSetting()', () => {
    it('should return specific setting value', () => {
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        speed: 500,
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(settings);

      expect(storage.getSetting('speed')).toBe(500);
    });

    it('should return default when settings do not exist', () => {
      expect(storage.getSetting('speed')).toBe(DEFAULT_SETTINGS.speed);
    });

    it('should return nested settings correctly', () => {
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        panelWidths: { code: 400, state: 300 },
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(settings);

      expect(storage.getSetting('panelWidths')).toEqual({ code: 400, state: 300 });
    });
  });

  describe('setSetting()', () => {
    it('should update single setting and save', () => {
      storage.setSetting('speed', 750);

      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock[SETTINGS_STORAGE_KEY]);
      expect(savedData.speed).toBe(750);
    });

    it('should merge with existing settings', () => {
      const initial: AppSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'story',
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(initial);

      storage.setSetting('speed', 100);

      const savedData = JSON.parse(localStorageMock[SETTINGS_STORAGE_KEY]);
      expect(savedData.theme).toBe('story');
      expect(savedData.speed).toBe(100);
    });

    it('should use defaults when no existing settings', () => {
      storage.setSetting('speed', 200);

      const savedData = JSON.parse(localStorageMock[SETTINGS_STORAGE_KEY]);
      expect(savedData.theme).toBe(DEFAULT_SETTINGS.theme);
      expect(savedData.panelWidths).toEqual(DEFAULT_SETTINGS.panelWidths);
    });
  });

  describe('updateSettings()', () => {
    it('should update multiple settings at once', () => {
      storage.updateSettings({
        speed: 300,
        theme: 'story',
      });

      const savedData = JSON.parse(localStorageMock[SETTINGS_STORAGE_KEY]);
      expect(savedData.speed).toBe(300);
      expect(savedData.theme).toBe('story');
    });

    it('should preserve settings not being updated', () => {
      const initial: AppSettings = {
        ...DEFAULT_SETTINGS,
        editorOptions: { ...DEFAULT_SETTINGS.editorOptions, fontSize: 18 },
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(initial);

      storage.updateSettings({ speed: 400 });

      const savedData = JSON.parse(localStorageMock[SETTINGS_STORAGE_KEY]);
      expect(savedData.editorOptions.fontSize).toBe(18);
    });
  });

  describe('getSettingsOrDefaults()', () => {
    it('should return stored settings when available', () => {
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        speed: 800,
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(settings);

      expect(storage.getSettingsOrDefaults().speed).toBe(800);
    });

    it('should return defaults when no settings exist', () => {
      expect(storage.getSettingsOrDefaults()).toEqual(DEFAULT_SETTINGS);
    });

    it('should never return null', () => {
      const result = storage.getSettingsOrDefaults();
      expect(result).not.toBeNull();
      expect(result).toBeDefined();
    });
  });

  describe('backward compatibility with legacy theme storage', () => {
    it('should migrate from legacy da-theme key', () => {
      localStorageMock[LEGACY_THEME_KEY] = 'story';

      const result = storage.loadSettings();

      expect(result).not.toBeNull();
      expect(result?.theme).toBe('story');
      // Should save migrated settings
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should migrate legacy "builder" theme to "lab"', () => {
      localStorageMock[LEGACY_THEME_KEY] = 'builder';

      const result = storage.loadSettings();

      expect(result?.theme).toBe('lab');
    });

    it('should use defaults for other settings during migration', () => {
      localStorageMock[LEGACY_THEME_KEY] = 'story';

      const result = storage.loadSettings();

      expect(result?.speed).toBe(DEFAULT_SETTINGS.speed);
      expect(result?.panelWidths).toEqual(DEFAULT_SETTINGS.panelWidths);
      expect(result?.editorOptions).toEqual(DEFAULT_SETTINGS.editorOptions);
    });

    it('should prefer new settings over legacy when both exist', () => {
      localStorageMock[LEGACY_THEME_KEY] = 'story';
      const newSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'lab',
        speed: 999,
      };
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify(newSettings);

      const result = storage.loadSettings();

      expect(result?.theme).toBe('lab');
      expect(result?.speed).toBe(999);
    });

    it('should return null if legacy theme is invalid', () => {
      localStorageMock[LEGACY_THEME_KEY] = 'invalid-theme';

      const result = storage.loadSettings();

      expect(result).toBeNull();
    });
  });

  describe('localStorage unavailability fallback', () => {
    it('should handle localStorage being undefined', () => {
      vi.stubGlobal('localStorage', undefined);
      const storageWithoutLS = new SettingsStorage();

      // These should not throw
      expect(() => storageWithoutLS.loadSettings()).not.toThrow();
      expect(() => storageWithoutLS.saveSettings(DEFAULT_SETTINGS)).not.toThrow();
      expect(() => storageWithoutLS.clearSettings()).not.toThrow();
    });
  });

  describe('custom storage key', () => {
    it('should use custom storage key when provided', () => {
      const customStorage = new SettingsStorage('custom-key');
      customStorage.saveSettings(DEFAULT_SETTINGS);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'custom-key',
        expect.any(String)
      );
    });
  });

  describe('type validation', () => {
    it('should reject settings with invalid theme', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify({
        ...DEFAULT_SETTINGS,
        theme: 'invalid',
      });

      const result = storage.loadSettings();
      expect(result).toBeNull();
    });

    it('should reject settings with speed out of range', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify({
        ...DEFAULT_SETTINGS,
        speed: 2000,
      });

      const result = storage.loadSettings();
      expect(result).toBeNull();
    });

    it('should reject settings with invalid panel widths', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify({
        ...DEFAULT_SETTINGS,
        panelWidths: { code: 100, state: 100 }, // Below minimums
      });

      const result = storage.loadSettings();
      expect(result).toBeNull();
    });

    it('should reject settings with invalid editor options', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify({
        ...DEFAULT_SETTINGS,
        editorOptions: {
          fontSize: 100, // Out of range
          tabSize: 2,
          wordWrap: 'on',
          minimap: true,
        },
      });

      const result = storage.loadSettings();
      expect(result).toBeNull();
    });

    it('should reject settings with invalid wordWrap value', () => {
      localStorageMock[SETTINGS_STORAGE_KEY] = JSON.stringify({
        ...DEFAULT_SETTINGS,
        editorOptions: {
          ...DEFAULT_SETTINGS.editorOptions,
          wordWrap: 'invalid',
        },
      });

      const result = storage.loadSettings();
      expect(result).toBeNull();
    });
  });
});
