// src/examples/ExampleBrowser.ts
// Submenu component for browsing and selecting example programs

import type { ExampleProgram, ExampleBrowserCallbacks, ExampleCategory } from './types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from './types';
import { getProgramsByCategory } from './exampleMetadata';
import { ExampleTooltip } from './ExampleTooltip';

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

  // Tooltip component for showing program details on hover (Story 8.3)
  private tooltip: ExampleTooltip | null = null;
  private hoverTimeout: number | null = null;

  // Hover event handlers map for cleanup (Story 8.3)
  private itemHoverHandlers: Map<HTMLElement, { enter: () => void; leave: () => void }> =
    new Map();

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

    // Clean up hover handlers and tooltip (Story 8.3)
    for (const [item, handlers] of this.itemHoverHandlers) {
      item.removeEventListener('mouseenter', handlers.enter);
      item.removeEventListener('mouseleave', handlers.leave);
      item.removeEventListener('focus', handlers.enter);
      item.removeEventListener('blur', handlers.leave);
    }
    this.itemHoverHandlers.clear();

    if (this.hoverTimeout !== null) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    this.tooltip?.destroy();
    this.tooltip = null;

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
        // Note: title attribute removed in favor of custom tooltip (Story 8.3)
        html.push(`
          <button
            class="da-menu-item da-example-item"
            role="menuitem"
            data-filename="${program.filename}"
            tabindex="-1"
            aria-describedby="da-example-tooltip"
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

    // Cache programs list once to avoid O(n²) lookups (Code Review fix)
    const programs = this.getPrograms();

    // Attach click and hover handlers to each item (store for cleanup)
    for (const item of this.focusableItems) {
      // Click handler
      const clickHandler = () => this.handleItemClick(item);
      this.itemClickHandlers.set(item, clickHandler);
      item.addEventListener('click', clickHandler);

      // Hover handlers for tooltip (Story 8.3)
      const filename = item.dataset.filename;
      if (filename) {
        const program = programs.find((p) => p.filename === filename);
        if (program) {
          const enterHandler = () => this.handleItemMouseEnter(item, program);
          const leaveHandler = () => this.handleItemMouseLeave();
          this.itemHoverHandlers.set(item, { enter: enterHandler, leave: leaveHandler });
          item.addEventListener('mouseenter', enterHandler);
          item.addEventListener('mouseleave', leaveHandler);
          // Also show tooltip on focus for keyboard accessibility
          item.addEventListener('focus', enterHandler);
          item.addEventListener('blur', leaveHandler);
        }
      }
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

  /**
   * Show tooltip on hover with a delay to avoid flicker (Story 8.3).
   */
  private handleItemMouseEnter(item: HTMLElement, program: ExampleProgram): void {
    // Delay tooltip show by 300ms to avoid flicker
    this.hoverTimeout = window.setTimeout(() => {
      if (!this.tooltip) {
        this.tooltip = new ExampleTooltip();
      }
      this.tooltip.show(program, item);
    }, 300);
  }

  /**
   * Hide tooltip and clear pending show timeout (Story 8.3).
   */
  private handleItemMouseLeave(): void {
    if (this.hoverTimeout !== null) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.tooltip?.hide();
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
