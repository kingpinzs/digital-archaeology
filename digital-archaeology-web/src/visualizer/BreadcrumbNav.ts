// src/visualizer/BreadcrumbNav.ts
// Breadcrumb navigation component for circuit hierarchy (Story 6.12)

/**
 * Represents a single item in the breadcrumb navigation path.
 */
export interface BreadcrumbItem {
  /** Unique identifier for this navigation level */
  id: string;
  /** Display label for the breadcrumb */
  label: string;
  /** Depth level in hierarchy (0 = root) */
  level: number;
}

/**
 * Configuration options for BreadcrumbNav component.
 */
export interface BreadcrumbNavOptions {
  /** Separator character between breadcrumb items (default: ">") */
  separator?: string;
  /** Callback when a breadcrumb item is clicked */
  onItemClick?: (item: BreadcrumbItem) => void;
  /** Initial path to display */
  initialPath?: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation component for displaying circuit hierarchy path.
 * Supports keyboard navigation and screen reader accessibility.
 */
export class BreadcrumbNav {
  private container: HTMLElement | null = null;
  private navElement: HTMLElement | null = null;
  private options: BreadcrumbNavOptions;
  private path: BreadcrumbItem[] = [];
  private boundClickHandler: ((e: Event) => void) | null = null;
  private boundKeydownHandler: ((e: Event) => void) | null = null;

  constructor(options: BreadcrumbNavOptions = {}) {
    this.options = {
      separator: '>',
      ...options,
    };
    this.path = options.initialPath ?? [];
  }

  /**
   * Mount the breadcrumb navigation to a container element.
   * @param container - The DOM element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    this.removeEventListeners();

    if (this.navElement) {
      this.navElement.remove();
      this.navElement = null;
    }

    this.container = null;
    this.path = [];
  }

  /**
   * Update the breadcrumb path.
   * @param items - New path items to display
   */
  setPath(items: BreadcrumbItem[]): void {
    this.path = [...items];
    this.render();
    this.attachEventListeners();
  }

  /**
   * Get the current breadcrumb path.
   * @returns Copy of the current path array
   */
  getPath(): BreadcrumbItem[] {
    return [...this.path];
  }

  /**
   * Render the breadcrumb navigation structure.
   */
  private render(): void {
    if (!this.container) return;

    // Remove existing nav if present
    if (this.navElement) {
      this.removeEventListeners();
      this.navElement.remove();
    }

    // Create nav element
    this.navElement = document.createElement('nav');
    this.navElement.className = 'da-breadcrumb-nav';
    this.navElement.setAttribute('aria-label', 'Circuit navigation');

    // Create ordered list
    const list = document.createElement('ol');
    list.className = 'da-breadcrumb-list';

    // Render each path item
    this.path.forEach((item, index) => {
      const isLast = index === this.path.length - 1;

      // Create list item
      const li = document.createElement('li');
      li.className = 'da-breadcrumb-item';

      if (isLast) {
        // Current location - non-clickable span
        li.classList.add('da-breadcrumb-current');
        li.setAttribute('aria-current', 'location');

        const span = document.createElement('span');
        span.textContent = item.label;
        li.appendChild(span);
      } else {
        // Clickable breadcrumb button
        const button = document.createElement('button');
        button.className = 'da-breadcrumb-link';
        button.type = 'button';
        button.setAttribute('data-id', item.id);
        button.setAttribute('data-level', String(item.level));
        button.textContent = item.label;
        li.appendChild(button);
      }

      list.appendChild(li);

      // Add separator after non-last items
      if (!isLast) {
        const separatorLi = document.createElement('li');
        separatorLi.className = 'da-breadcrumb-item da-breadcrumb-separator';
        separatorLi.setAttribute('aria-hidden', 'true');
        separatorLi.textContent = this.options.separator!
        list.appendChild(separatorLi);
      }
    });

    this.navElement.appendChild(list);
    this.container.appendChild(this.navElement);
  }

  /**
   * Attach event listeners for click and keyboard navigation.
   */
  private attachEventListeners(): void {
    if (!this.navElement) return;

    this.boundClickHandler = (e: Event) => this.handleClick(e);
    this.boundKeydownHandler = (e: Event) => this.handleKeydown(e as KeyboardEvent);

    this.navElement.addEventListener('click', this.boundClickHandler);
    this.navElement.addEventListener('keydown', this.boundKeydownHandler);
  }

  /**
   * Remove event listeners.
   */
  private removeEventListeners(): void {
    if (!this.navElement) return;

    if (this.boundClickHandler) {
      this.navElement.removeEventListener('click', this.boundClickHandler);
    }
    if (this.boundKeydownHandler) {
      this.navElement.removeEventListener('keydown', this.boundKeydownHandler);
    }

    this.boundClickHandler = null;
    this.boundKeydownHandler = null;
  }

  /**
   * Handle click events on breadcrumb items.
   * @param e - Click event
   */
  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;

    if (target.classList.contains('da-breadcrumb-link')) {
      const id = target.getAttribute('data-id');
      const level = parseInt(target.getAttribute('data-level') ?? '0', 10);

      if (id) {
        const item = this.path.find(p => p.id === id && p.level === level);
        if (item && this.options.onItemClick) {
          this.options.onItemClick(item);
        }
      }
    }
  }

  /**
   * Handle keyboard events for accessibility.
   * @param e - Keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;

    if (target.classList.contains('da-breadcrumb-link')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        target.click();
      }
    }
  }
}
