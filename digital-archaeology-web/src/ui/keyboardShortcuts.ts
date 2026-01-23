// src/ui/keyboardShortcuts.ts
// Keyboard shortcuts data for the Help menu dialog

/**
 * Represents a keyboard shortcut.
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., "Ctrl+A" or "Ctrl+Shift+Z") */
  keys: string;
  /** Human-readable description of what the shortcut does */
  description: string;
  /** Category for grouping in the shortcuts dialog */
  category: 'editing' | 'search' | 'assembly' | 'view';
}

/**
 * All keyboard shortcuts available in the editor.
 * These are Monaco Editor defaults that work out-of-box.
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Editing shortcuts
  { keys: 'Ctrl+A', description: 'Select all text', category: 'editing' },
  { keys: 'Ctrl+C', description: 'Copy selection', category: 'editing' },
  { keys: 'Ctrl+V', description: 'Paste from clipboard', category: 'editing' },
  { keys: 'Ctrl+X', description: 'Cut selection', category: 'editing' },
  { keys: 'Ctrl+Z', description: 'Undo', category: 'editing' },
  { keys: 'Ctrl+Y', description: 'Redo', category: 'editing' },
  { keys: 'Ctrl+Shift+Z', description: 'Redo (alternative)', category: 'editing' },
  { keys: 'Tab', description: 'Indent selected lines', category: 'editing' },
  { keys: 'Shift+Tab', description: 'Unindent selected lines', category: 'editing' },

  // Search shortcuts
  { keys: 'Ctrl+F', description: 'Find', category: 'search' },
  { keys: 'Ctrl+H', description: 'Find and replace', category: 'search' },
  { keys: 'F3', description: 'Find next', category: 'search' },
  { keys: 'Shift+F3', description: 'Find previous', category: 'search' },
  { keys: 'Escape', description: 'Close find widget', category: 'search' },

  // Assembly shortcuts
  { keys: 'Ctrl+Enter', description: 'Assemble code', category: 'assembly' },

  // View shortcuts (Story 10.1)
  { keys: 'Ctrl+Shift+M', description: 'Toggle Story/Lab mode', category: 'view' },
];

/**
 * Category labels for display in the shortcuts dialog.
 */
export const CATEGORY_LABELS: Record<KeyboardShortcut['category'], string> = {
  editing: 'Editing',
  search: 'Search',
  assembly: 'Assembly',
  view: 'View',
};

/**
 * Get shortcuts filtered by category.
 * @param category - The category to filter by
 * @returns Array of shortcuts in the given category
 */
export function getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter((s) => s.category === category);
}

/**
 * Get all unique categories that have shortcuts.
 * @returns Array of categories with at least one shortcut
 */
export function getActiveCategories(): KeyboardShortcut['category'][] {
  const categories = new Set<KeyboardShortcut['category']>();
  for (const shortcut of KEYBOARD_SHORTCUTS) {
    categories.add(shortcut.category);
  }
  return Array.from(categories);
}
