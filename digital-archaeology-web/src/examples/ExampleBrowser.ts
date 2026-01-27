// src/examples/ExampleBrowser.ts
// Submenu component for browsing and selecting example programs

import type { ExampleProgram, ExampleBrowserCallbacks, ExampleCategory } from './types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from './types';
import { getProgramsByCategory } from './exampleMetadata';

/**
 * ExampleBrowser displays a categorized submenu of example programs.
 * Supports keyboard navigation and accessibility features.
 */
export class ExampleBrowser {
  private element: HTMLElement | null = null;
  private callbacks: ExampleBrowserCallbacks;
  private programsByCategory: Map<ExampleCategory, ExampleProgram[]>;
  private focusedIndex: number = 0;
  private focusableItems: HTMLElement[] = [];

  // Bound event handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleDocumentClick: (e: MouseEvent) => void;

  // Item click handlers map for cleanup (Story 8.1 - memory leak fix)
  private itemClickHandlers: Map<HTMLElement, () => void> = new Map();

  // Element that had focus before browser opened (Story 8.1 - focus management)
  private previousActiveElement: HTMLElement | null = null;

  constructor(callbacks: ExampleBrowserCallbacks) {
    this.callbacks = callbacks;
    this.programsByCategory = getProgramsByCategory();
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
  }

  /**
   * Create and return the submenu element.
   * The caller is responsible for positioning and appending to DOM.
   */
  render(): HTMLElement {
    this.element = document.createElement('div');
    this.element.className = 'da-example-browser da-menu-dropdown';
    this.element.setAttribute('role', 'menu');
    this.element.setAttribute('aria-label', 'Example programs');

    this.renderContent();
    this.cacheAndSetupItems();

    return this.element;
  }

  /**
   * Mount the browser at a specific position.
   * @param container - Parent element to append to
   */
  mount(container: HTMLElement): void {
    // Save current focus for restoration on close (Story 8.1 - focus management)
    this.previousActiveElement = document.activeElement as HTMLElement | null;

    if (!this.element) {
      this.render();
    }
    container.appendChild(this.element!);
    this.attachEventListeners();
    this.focusFirstItem();
  }

  /**
   * Destroy the browser and clean up resources.
   */
  destroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    document.removeEventListener('click', this.boundHandleDocumentClick);

    // Clean up item click handlers (Story 8.1 - memory leak fix)
    for (const [item, handler] of this.itemClickHandlers) {
      item.removeEventListener('click', handler);
    }
    this.itemClickHandlers.clear();

    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.focusableItems = [];

    // Restore focus to previous element (Story 8.1 - focus management)
    if (this.previousActiveElement && document.contains(this.previousActiveElement)) {
      this.previousActiveElement.focus();
    }
    this.previousActiveElement = null;
  }

  /**
   * Check if the browser is currently visible.
   */
  isVisible(): boolean {
    return this.element !== null && this.element.parentElement !== null;
  }

  /**
   * Get all programs flat list.
   */
  getPrograms(): ExampleProgram[] {
    const programs: ExampleProgram[] = [];
    for (const category of CATEGORY_ORDER) {
      const categoryPrograms = this.programsByCategory.get(category);
      if (categoryPrograms) {
        programs.push(...categoryPrograms);
      }
    }
    return programs;
  }

  private renderContent(): void {
    if (!this.element) return;

    const html: string[] = [];

    for (const category of CATEGORY_ORDER) {
      const programs = this.programsByCategory.get(category);
      if (!programs || programs.length === 0) continue;

      // Category header (not focusable)
      html.push(`
        <div class="da-example-category-header" role="presentation">
          ${CATEGORY_LABELS[category]}
        </div>
      `);

      // Programs in category
      for (const program of programs) {
        html.push(`
          <button
            class="da-menu-item da-example-item"
            role="menuitem"
            data-filename="${program.filename}"
            title="${program.description}"
            tabindex="-1"
          >
            <span class="da-menu-item-label">${program.name}</span>
          </button>
        `);
      }
    }

    this.element.innerHTML = html.join('');
  }

  private cacheAndSetupItems(): void {
    if (!this.element) return;

    // Cache focusable items (only program buttons, not category headers)
    this.focusableItems = Array.from(
      this.element.querySelectorAll<HTMLElement>('.da-example-item')
    );

    // Attach click handlers to each item (store for cleanup)
    for (const item of this.focusableItems) {
      const handler = () => this.handleItemClick(item);
      this.itemClickHandlers.set(item, handler);
      item.addEventListener('click', handler);
    }
  }

  private attachEventListeners(): void {
    document.addEventListener('keydown', this.boundHandleKeydown);
    // Delay document click listener to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', this.boundHandleDocumentClick);
    }, 0);
  }

  private handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusNext();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.focusPrevious();
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectFocusedItem();
        break;

      case 'Escape':
        e.preventDefault();
        this.callbacks.onClose();
        break;

      case 'Home':
        e.preventDefault();
        this.focusFirst();
        break;

      case 'End':
        e.preventDefault();
        this.focusLast();
        break;
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Don't close if clicking inside the browser
    if (this.element?.contains(target)) return;

    // Don't close if clicking on the Examples menu trigger
    if (target.closest('[data-action="examples"]')) return;

    this.callbacks.onClose();
  }

  private handleItemClick(item: HTMLElement): void {
    const filename = item.dataset.filename;
    if (!filename) return;

    const programs = this.getPrograms();
    const program = programs.find((p) => p.filename === filename);
    if (program) {
      this.callbacks.onSelect(program);
    }
  }

  private focusFirstItem(): void {
    if (this.focusableItems.length > 0) {
      this.focusedIndex = 0;
      this.focusableItems[0].focus();
    }
  }

  private focusNext(): void {
    if (this.focusableItems.length === 0) return;

    this.focusedIndex = (this.focusedIndex + 1) % this.focusableItems.length;
    this.focusableItems[this.focusedIndex].focus();
  }

  private focusPrevious(): void {
    if (this.focusableItems.length === 0) return;

    this.focusedIndex =
      (this.focusedIndex - 1 + this.focusableItems.length) % this.focusableItems.length;
    this.focusableItems[this.focusedIndex].focus();
  }

  private focusFirst(): void {
    if (this.focusableItems.length === 0) return;

    this.focusedIndex = 0;
    this.focusableItems[0].focus();
  }

  private focusLast(): void {
    if (this.focusableItems.length === 0) return;

    this.focusedIndex = this.focusableItems.length - 1;
    this.focusableItems[this.focusedIndex].focus();
  }

  private selectFocusedItem(): void {
    if (this.focusableItems.length === 0) return;

    const item = this.focusableItems[this.focusedIndex];
    if (item) {
      this.handleItemClick(item);
    }
  }
}
