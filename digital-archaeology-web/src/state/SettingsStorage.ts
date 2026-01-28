// src/state/SettingsStorage.ts
// localStorage persistence service for application settings
// Story 9.1: Implement Local Storage for Settings

import type { AppSettings } from './types';
import { DEFAULT_SETTINGS, isValidSettings } from './types';

/** Storage key for unified settings in localStorage */
export const SETTINGS_STORAGE_KEY = 'digital-archaeology-settings';

/** Legacy storage key for theme (backward compatibility) */
export const LEGACY_THEME_KEY = 'da-theme';

/**
 * Service for persisting application settings to localStorage.
 * Follows the StoryStorage.ts pattern with type guards and error handling.
 */
export class SettingsStorage {
  private storageKey: string;

  constructor(storageKey: string = SETTINGS_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Save complete settings to localStorage.
   * Silently fails if localStorage is unavailable.
   */
  saveSettings(settings: AppSettings): void {
    try {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      // localStorage not available (SSR, private browsing, quota exceeded)
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Load settings from localStorage with migration support.
   * Returns null if no valid settings are found.
   * Includes backward compatibility with legacy theme storage.
   */
  loadSettings(): AppSettings | null {
    try {
      // Try new unified settings first
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (isValidSettings(parsed)) {
          return parsed;
        }
        // Invalid settings data - clear and return null
        console.warn('Invalid settings data in localStorage, clearing...');
        this.clearSettings();
        return null;
      }

      // No unified settings - try migrating from legacy theme storage
      return this.migrateFromLegacy();
    } catch (error) {
      // Handle JSON parse errors or localStorage access issues
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  /**
   * Clear settings from localStorage.
   */
  clearSettings(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }

  /**
   * Check if settings exist in localStorage.
   */
  hasSettings(): boolean {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get a single setting value with type safety.
   * Returns default if not found or invalid.
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const settings = this.loadSettings();
    if (settings && key in settings) {
      return settings[key];
    }
    return DEFAULT_SETTINGS[key];
  }

  /**
   * Update a single setting value and save.
   * Merges with existing settings or defaults.
   */
  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const current = this.loadSettings() ?? { ...DEFAULT_SETTINGS };
    const updated = { ...current, [key]: value };
    this.saveSettings(updated);
  }

  /**
   * Update multiple settings at once and save.
   * Merges with existing settings or defaults.
   */
  updateSettings(partial: Partial<AppSettings>): void {
    const current = this.loadSettings() ?? { ...DEFAULT_SETTINGS };
    const updated = { ...current, ...partial };
    this.saveSettings(updated);
  }

  /**
   * Migrate from legacy theme-only storage.
   * Returns settings with legacy theme if found, null otherwise.
   */
  private migrateFromLegacy(): AppSettings | null {
    try {
      const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
      if (legacyTheme === 'lab' || legacyTheme === 'story') {
        // Create new settings with legacy theme value
        const migrated: AppSettings = {
          ...DEFAULT_SETTINGS,
          theme: legacyTheme,
        };
        // Save migrated settings (but keep legacy key for backward compat with theme.ts)
        this.saveSettings(migrated);
        return migrated;
      }
      // Handle legacy 'builder' as 'lab'
      if (legacyTheme === 'builder') {
        const migrated: AppSettings = {
          ...DEFAULT_SETTINGS,
          theme: 'lab',
        };
        this.saveSettings(migrated);
        return migrated;
      }
    } catch (error) {
      console.error('Failed to migrate legacy settings:', error);
    }
    return null;
  }

  /**
   * Get settings or defaults.
   * Convenience method that never returns null.
   */
  getSettingsOrDefaults(): AppSettings {
    return this.loadSettings() ?? { ...DEFAULT_SETTINGS };
  }
}
