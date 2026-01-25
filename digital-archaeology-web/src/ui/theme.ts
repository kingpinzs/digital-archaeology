/**
 * Theme System for Digital Archaeology
 *
 * Provides theme switching functionality between Lab Mode (technical workspace)
 * and Story Mode (immersive narrative).
 *
 * Theme is applied by setting a class on the <html> element.
 * Preference is persisted to localStorage.
 */

/** Available theme modes */
export type ThemeMode = 'lab' | 'story';

/** Lab stations within Lab Mode */
export type LabStation = 'build' | 'explore';

/** CSS class names for each theme */
const THEME_CLASSES: Record<ThemeMode, string> = {
  lab: 'lab-mode',
  story: 'story-mode',
};

/** localStorage key for theme preference */
const STORAGE_KEY = 'da-theme';

/**
 * Set the application theme by updating the HTML element class.
 * Also persists the preference to localStorage.
 */
export function setTheme(mode: ThemeMode): void {
  const html = document.documentElement;

  // Remove all theme classes
  Object.values(THEME_CLASSES).forEach((cls) => {
    html.classList.remove(cls);
  });

  // Add the selected theme class
  html.classList.add(THEME_CLASSES[mode]);

  // Store preference (with fallback for environments without localStorage)
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage not available (SSR, private browsing, etc.)
  }
}

/**
 * Get the current theme from localStorage or HTML class.
 * Falls back to 'lab' if no theme is set.
 *
 * @returns The current theme mode
 */
export function getTheme(): ThemeMode {
  // Try localStorage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'lab' || stored === 'story') {
      return stored;
    }
    // Migration: treat old 'builder' as 'lab'
    if (stored === 'builder') {
      return 'lab';
    }
  } catch {
    // localStorage not available
  }

  // Check current HTML class
  const html = document.documentElement;
  if (html.classList.contains(THEME_CLASSES.story)) {
    return 'story';
  }

  // Default to lab mode
  return 'lab';
}

/**
 * Toggle between lab and story modes.
 *
 * @returns The new theme mode after toggling
 */
export function toggleTheme(): ThemeMode {
  const current = getTheme();
  const next: ThemeMode = current === 'lab' ? 'story' : 'lab';
  setTheme(next);
  return next;
}

/**
 * Initialize theme from stored preference or default.
 * Should be called on application startup.
 *
 * @returns The initialized theme mode
 */
export function initTheme(): ThemeMode {
  const theme = getTheme();
  setTheme(theme);
  return theme;
}
