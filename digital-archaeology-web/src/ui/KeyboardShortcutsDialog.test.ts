import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { KEYBOARD_SHORTCUTS, CATEGORY_LABELS, getActiveCategories } from './keyboardShortcuts';

describe('KeyboardShortcutsDialog', () => {
  let dialog: KeyboardShortcutsDialog;

  beforeEach(() => {
    dialog = new KeyboardShortcutsDialog();
  });

  afterEach(() => {
    dialog.destroy();
    // Clean up any remaining dialogs from the DOM
    document.querySelectorAll('.da-shortcuts-backdrop').forEach((el) => el.remove());
  });

  describe('show', () => {
    it('should create and append dialog to document body', () => {
      dialog.show();

      const backdrop = document.querySelector('.da-shortcuts-backdrop');
      const dialogEl = document.querySelector('.da-shortcuts-dialog');

      expect(backdrop).not.toBeNull();
      expect(dialogEl).not.toBeNull();
    });

    it('should set correct ARIA attributes on dialog', () => {
      dialog.show();

      const dialogEl = document.querySelector('.da-shortcuts-dialog');

      expect(dialogEl?.getAttribute('role')).toBe('dialog');
      expect(dialogEl?.getAttribute('aria-modal')).toBe('true');
      expect(dialogEl?.getAttribute('aria-labelledby')).toBe('da-shortcuts-title');
    });

    it('should display dialog title', () => {
      dialog.show();

      const title = document.querySelector('#da-shortcuts-title');

      expect(title?.textContent).toBe('Keyboard Shortcuts');
    });

    it('should display close button', () => {
      dialog.show();

      const closeBtn = document.querySelector('.da-shortcuts-close');

      expect(closeBtn).not.toBeNull();
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('should not create multiple dialogs when called multiple times', () => {
      dialog.show();
      dialog.show();
      dialog.show();

      const backdrops = document.querySelectorAll('.da-shortcuts-backdrop');

      expect(backdrops.length).toBe(1);
    });

    it('should display all shortcut categories', () => {
      dialog.show();

      const categories = getActiveCategories();
      const sectionTitles = document.querySelectorAll('.da-shortcuts-section-title');

      expect(sectionTitles.length).toBe(categories.length);

      for (const category of categories) {
        const found = Array.from(sectionTitles).some(
          (el) => el.textContent === CATEGORY_LABELS[category]
        );
        expect(found).toBe(true);
      }
    });

    it('should display all keyboard shortcuts', () => {
      dialog.show();

      const rows = document.querySelectorAll('.da-shortcuts-row');

      expect(rows.length).toBe(KEYBOARD_SHORTCUTS.length);
    });

    it('should display shortcut descriptions', () => {
      dialog.show();

      const descriptions = document.querySelectorAll('.da-shortcuts-description');

      for (const shortcut of KEYBOARD_SHORTCUTS) {
        const found = Array.from(descriptions).some(
          (el) => el.textContent === shortcut.description
        );
        expect(found).toBe(true);
      }
    });

    it('should display shortcut keys with kbd elements', () => {
      dialog.show();

      const kbdElements = document.querySelectorAll('.da-shortcuts-key');

      // Should have at least one kbd element
      expect(kbdElements.length).toBeGreaterThan(0);
    });
  });

  describe('hide', () => {
    it('should remove dialog from document body', () => {
      dialog.show();
      dialog.hide();

      const backdrop = document.querySelector('.da-shortcuts-backdrop');
      const dialogEl = document.querySelector('.da-shortcuts-dialog');

      expect(backdrop).toBeNull();
      expect(dialogEl).toBeNull();
    });

    it('should be safe to call when dialog is not shown', () => {
      expect(() => dialog.hide()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      dialog.show();
      dialog.hide();
      dialog.hide();
      dialog.hide();

      expect(document.querySelector('.da-shortcuts-backdrop')).toBeNull();
    });
  });

  describe('isVisible', () => {
    it('should return false when dialog is not shown', () => {
      expect(dialog.isVisible()).toBe(false);
    });

    it('should return true when dialog is shown', () => {
      dialog.show();

      expect(dialog.isVisible()).toBe(true);
    });

    it('should return false after dialog is hidden', () => {
      dialog.show();
      dialog.hide();

      expect(dialog.isVisible()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should hide the dialog if shown', () => {
      dialog.show();
      dialog.destroy();

      expect(document.querySelector('.da-shortcuts-backdrop')).toBeNull();
    });

    it('should be safe to call when not shown', () => {
      expect(() => dialog.destroy()).not.toThrow();
    });
  });

  describe('keyboard interaction', () => {
    it('should close dialog when Escape key is pressed', () => {
      dialog.show();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(dialog.isVisible()).toBe(false);
    });

    it('should not close on other key presses', () => {
      dialog.show();

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      expect(dialog.isVisible()).toBe(true);
    });
  });

  describe('click interaction', () => {
    it('should close dialog when close button is clicked', () => {
      dialog.show();

      const closeBtn = document.querySelector('.da-shortcuts-close') as HTMLElement;
      closeBtn?.click();

      expect(dialog.isVisible()).toBe(false);
    });

    it('should close dialog when backdrop is clicked', () => {
      dialog.show();

      const backdrop = document.querySelector('.da-shortcuts-backdrop') as HTMLElement;
      // Create a click event targeting the backdrop itself
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: backdrop });
      backdrop?.dispatchEvent(event);

      expect(dialog.isVisible()).toBe(false);
    });

    it('should not close dialog when dialog content is clicked', () => {
      dialog.show();

      const dialogEl = document.querySelector('.da-shortcuts-dialog') as HTMLElement;
      dialogEl?.click();

      expect(dialog.isVisible()).toBe(true);
    });
  });
});

describe('keyboardShortcuts constants', () => {
  describe('KEYBOARD_SHORTCUTS', () => {
    it('should contain at least 10 shortcuts', () => {
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have all required properties on each shortcut', () => {
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        expect(shortcut).toHaveProperty('keys');
        expect(shortcut).toHaveProperty('description');
        expect(shortcut).toHaveProperty('category');
        expect(typeof shortcut.keys).toBe('string');
        expect(typeof shortcut.description).toBe('string');
        expect(['editing', 'search', 'assembly', 'debugging', 'view']).toContain(shortcut.category);
      }
    });

    it('should include Ctrl+Enter assemble shortcut (Story 3.3)', () => {
      const assemble = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'Ctrl+Enter');
      expect(assemble).toBeDefined();
      expect(assemble?.description).toBe('Assemble code');
      expect(assemble?.category).toBe('assembly');
    });

    it('should include Ctrl+A select all', () => {
      const selectAll = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'Ctrl+A');
      expect(selectAll).toBeDefined();
      expect(selectAll?.description).toContain('Select');
    });

    it('should include Ctrl+F find', () => {
      const find = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'Ctrl+F');
      expect(find).toBeDefined();
      expect(find?.description).toContain('Find');
    });

    it('should include Ctrl+H find and replace', () => {
      const findReplace = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'Ctrl+H');
      expect(findReplace).toBeDefined();
      expect(findReplace?.description).toContain('replace');
    });

    it('should include Tab indent', () => {
      const tab = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'Tab');
      expect(tab).toBeDefined();
      expect(tab?.description.toLowerCase()).toContain('indent');
    });

    it('should include Shift+Tab unindent', () => {
      const shiftTab = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'Shift+Tab');
      expect(shiftTab).toBeDefined();
      expect(shiftTab?.description.toLowerCase()).toContain('unindent');
    });

    it('should include F10 step shortcut (Story 5.1)', () => {
      const step = KEYBOARD_SHORTCUTS.find((s) => s.keys === 'F10');
      expect(step).toBeDefined();
      expect(step?.description).toBe('Step one instruction');
      expect(step?.category).toBe('debugging');
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have label for editing category', () => {
      expect(CATEGORY_LABELS.editing).toBe('Editing');
    });

    it('should have label for search category', () => {
      expect(CATEGORY_LABELS.search).toBe('Search');
    });

    it('should have label for assembly category (Story 3.3)', () => {
      expect(CATEGORY_LABELS.assembly).toBe('Assembly');
    });

    it('should have label for debugging category (Story 5.1)', () => {
      expect(CATEGORY_LABELS.debugging).toBe('Debugging');
    });
  });

  describe('getActiveCategories', () => {
    it('should return at least 3 categories', () => {
      const categories = getActiveCategories();
      expect(categories.length).toBeGreaterThanOrEqual(3);
    });

    it('should include editing category', () => {
      const categories = getActiveCategories();
      expect(categories).toContain('editing');
    });

    it('should include search category', () => {
      const categories = getActiveCategories();
      expect(categories).toContain('search');
    });

    it('should include assembly category (Story 3.3)', () => {
      const categories = getActiveCategories();
      expect(categories).toContain('assembly');
    });

    it('should include debugging category (Story 5.1)', () => {
      const categories = getActiveCategories();
      expect(categories).toContain('debugging');
    });
  });
});
