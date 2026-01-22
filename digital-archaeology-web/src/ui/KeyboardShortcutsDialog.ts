// src/ui/KeyboardShortcutsDialog.ts
// Modal dialog component showing keyboard shortcuts

import {
  CATEGORY_LABELS,
  getActiveCategories,
  getShortcutsByCategory,
} from './keyboardShortcuts';
import type { KeyboardShortcut } from './keyboardShortcuts';

/**
 * Modal dialog displaying keyboard shortcuts.
 * Follows the mount/destroy pattern from Epic 1.
 */
export class KeyboardShortcutsDialog {
  private backdropElement: HTMLElement | null = null;
  private dialogElement: HTMLElement | null = null;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleBackdropClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleBackdropClick = this.handleBackdropClick.bind(this);
  }

  /**
   * Show the keyboard shortcuts dialog.
   * Creates and appends the dialog to the document body.
   */
  show(): void {
    // Prevent multiple dialogs
    if (this.dialogElement) return;

    this.createDialog();
    this.addEventListeners();

    // Focus the dialog for keyboard navigation
    // Note: dialogElement is guaranteed to exist after createDialog()
    if (this.dialogElement) {
      (this.dialogElement as HTMLElement).focus();
    }
  }

  /**
   * Hide and remove the dialog.
   */
  hide(): void {
    this.removeEventListeners();

    if (this.backdropElement) {
      this.backdropElement.remove();
      this.backdropElement = null;
    }

    this.dialogElement = null;
  }

  /**
   * Check if the dialog is currently visible.
   * @returns true if dialog is visible, false otherwise
   */
  isVisible(): boolean {
    return this.dialogElement !== null;
  }

  /**
   * Destroy the dialog and clean up resources.
   */
  destroy(): void {
    this.hide();
  }

  /**
   * Create the dialog DOM structure.
   */
  private createDialog(): void {
    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-shortcuts-backdrop';
    this.backdropElement.setAttribute('aria-hidden', 'true');

    // Create dialog container
    this.dialogElement = document.createElement('div');
    this.dialogElement.className = 'da-shortcuts-dialog';
    this.dialogElement.setAttribute('role', 'dialog');
    this.dialogElement.setAttribute('aria-modal', 'true');
    this.dialogElement.setAttribute('aria-labelledby', 'da-shortcuts-title');
    this.dialogElement.setAttribute('tabindex', '-1');

    // Create header
    const header = document.createElement('div');
    header.className = 'da-shortcuts-header';

    const title = document.createElement('h2');
    title.id = 'da-shortcuts-title';
    title.className = 'da-shortcuts-title';
    title.textContent = 'Keyboard Shortcuts';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'da-shortcuts-close';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.hide());
    header.appendChild(closeButton);

    this.dialogElement.appendChild(header);

    // Create content with shortcuts grouped by category
    const content = document.createElement('div');
    content.className = 'da-shortcuts-content';

    const categories = getActiveCategories();
    for (const category of categories) {
      const section = this.createCategorySection(category);
      content.appendChild(section);
    }

    this.dialogElement.appendChild(content);

    // Append to body
    this.backdropElement.appendChild(this.dialogElement);
    document.body.appendChild(this.backdropElement);
  }

  /**
   * Create a section for a shortcut category.
   * @param category - The category to create a section for
   * @returns The section element
   */
  private createCategorySection(category: KeyboardShortcut['category']): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-shortcuts-section';

    const heading = document.createElement('h3');
    heading.className = 'da-shortcuts-section-title';
    heading.textContent = CATEGORY_LABELS[category];
    section.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'da-shortcuts-list';

    const shortcuts = getShortcutsByCategory(category);
    for (const shortcut of shortcuts) {
      const row = this.createShortcutRow(shortcut);
      list.appendChild(row);
    }

    section.appendChild(list);
    return section;
  }

  /**
   * Create a row for a single shortcut.
   * @param shortcut - The shortcut to create a row for
   * @returns The row element
   */
  private createShortcutRow(shortcut: KeyboardShortcut): HTMLElement {
    const row = document.createElement('div');
    row.className = 'da-shortcuts-row';

    const description = document.createElement('span');
    description.className = 'da-shortcuts-description';
    description.textContent = shortcut.description;
    row.appendChild(description);

    const keys = document.createElement('span');
    keys.className = 'da-shortcuts-keys';

    // Parse and display individual key badges
    const keyParts = shortcut.keys.split('+');
    for (let i = 0; i < keyParts.length; i++) {
      const kbd = document.createElement('kbd');
      kbd.className = 'da-shortcuts-key';
      kbd.textContent = keyParts[i];
      keys.appendChild(kbd);

      // Add plus sign between keys
      if (i < keyParts.length - 1) {
        const plus = document.createElement('span');
        plus.className = 'da-shortcuts-plus';
        plus.textContent = '+';
        keys.appendChild(plus);
      }
    }

    row.appendChild(keys);
    return row;
  }

  /**
   * Add event listeners for keyboard and click handling.
   */
  private addEventListeners(): void {
    document.addEventListener('keydown', this.boundHandleKeyDown);
    this.backdropElement?.addEventListener('click', this.boundHandleBackdropClick);
  }

  /**
   * Remove event listeners.
   */
  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.backdropElement?.removeEventListener('click', this.boundHandleBackdropClick);
  }

  /**
   * Handle keydown events to close on Escape.
   * @param e - The keyboard event
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.hide();
    }
  }

  /**
   * Handle backdrop clicks to close the dialog.
   * @param e - The mouse event
   */
  private handleBackdropClick(e: MouseEvent): void {
    // Only close if clicking the backdrop itself, not the dialog
    if (e.target === this.backdropElement) {
      this.hide();
    }
  }
}
