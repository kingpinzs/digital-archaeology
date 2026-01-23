// src/ui/MenuBar.ts
// Menu bar component with Story/Lab toggle and dropdown menus

/**
 * Application mode type - Story mode or Lab mode.
 */
export type AppMode = 'story' | 'lab';

/**
 * Panel visibility states for View menu.
 */
export interface PanelStates {
  code: boolean;
  circuit: boolean;
  state: boolean;
}

/**
 * Menu bar state configuration.
 */
export interface MenuBarState {
  /** Current application mode */
  currentMode: AppMode;
  /** Currently open menu (null if none) */
  openMenu: string | null;
  /** Panel visibility states for View menu checkmarks */
  panelStates: PanelStates;
}

/**
 * Callback handlers for menu bar actions.
 */
export interface MenuBarCallbacks {
  /** Called when mode toggle is clicked */
  onModeChange: (mode: AppMode) => void;
  // File menu
  onFileNew: () => void;
  onFileOpen: () => void;
  onFileSave: () => void;
  onFileSaveAs: () => void;
  onFileExport: () => void;
  onFileImport: () => void;
  // Edit menu
  onEditUndo: () => void;
  onEditRedo: () => void;
  onEditCut: () => void;
  onEditCopy: () => void;
  onEditPaste: () => void;
  // View menu
  onViewCodePanel: () => void;
  onViewCircuitPanel: () => void;
  onViewStatePanel: () => void;
  onViewResetLayout: () => void;
  // Debug menu
  onDebugAssemble: () => void;
  onDebugRun: () => void;
  onDebugPause: () => void;
  onDebugReset: () => void;
  onDebugStep: () => void;
  onDebugToggleBreakpoint: () => void;
  // Help menu
  onHelpKeyboardShortcuts: () => void;
  onHelpDocumentation: () => void;
  onHelpAbout: () => void;
}

/**
 * Menu item definition.
 */
interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

/**
 * Menu structure definition.
 */
const MENU_STRUCTURE: Record<string, MenuItem[]> = {
  file: [
    { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
    { id: 'open', label: 'Open...', shortcut: 'Ctrl+O' },
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
    { id: 'saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    { id: 'sep1', label: '', separator: true },
    { id: 'export', label: 'Export Binary...' },
    { id: 'import', label: 'Import Binary...' },
  ],
  edit: [
    { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
    { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y' },
    { id: 'sep1', label: '', separator: true },
    { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
    { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
    { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
  ],
  view: [
    { id: 'codePanel', label: 'Show Code Panel' },
    { id: 'circuitPanel', label: 'Show Circuit Panel' },
    { id: 'statePanel', label: 'Show State Panel' },
    { id: 'sep1', label: '', separator: true },
    { id: 'resetLayout', label: 'Reset Layout' },
  ],
  debug: [
    { id: 'assemble', label: 'Assemble', shortcut: 'Ctrl+Enter' },
    { id: 'run', label: 'Run', shortcut: 'F5' },
    { id: 'pause', label: 'Pause', shortcut: 'F5' },
    { id: 'reset', label: 'Reset', shortcut: 'Shift+F5' },
    { id: 'step', label: 'Step', shortcut: 'F10' },
    { id: 'sep1', label: '', separator: true },
    { id: 'toggleBreakpoint', label: 'Toggle Breakpoint', shortcut: 'F9' },
  ],
  help: [
    { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+?' },
    { id: 'docs', label: 'Documentation' },
    { id: 'sep1', label: '', separator: true },
    { id: 'about', label: 'About Digital Archaeology' },
  ],
};

/**
 * Menu trigger labels.
 */
const MENU_LABELS: Record<string, string> = {
  file: 'File',
  edit: 'Edit',
  view: 'View',
  debug: 'Debug',
  help: 'Help',
};

/**
 * MenuBar component with Story/Lab toggle and dropdown menus.
 */
export class MenuBar {
  private element: HTMLElement | null = null;
  private state: MenuBarState;
  private callbacks: MenuBarCallbacks;

  // Cached element references
  private toggleButtons: Map<AppMode, HTMLButtonElement> = new Map();
  private menuTriggers: Map<string, HTMLButtonElement> = new Map();
  private dropdownContainer: HTMLElement | null = null;

  // Bound event handlers for cleanup
  private boundDocumentClick: ((e: MouseEvent) => void) | null = null;
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundMenuTriggerClick: Map<string, (e: Event) => void> = new Map();
  private boundMenuTriggerMouseEnter: Map<string, () => void> = new Map();
  private boundToggleClick: Map<AppMode, () => void> = new Map();
  private boundMenuItemClick: Map<HTMLElement, () => void> = new Map();

  constructor(callbacks: MenuBarCallbacks) {
    this.callbacks = callbacks;
    this.state = {
      currentMode: 'lab',
      openMenu: null,
      panelStates: { code: true, circuit: true, state: true },
    };
  }

  /**
   * Mount the menu bar to a container element.
   * @param container - The element to mount the menu bar into
   */
  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.cacheElements();
    this.attachEventListeners();
    this.updateUI();
  }

  /**
   * Update the menu bar state.
   * @param newState - Partial state to merge with current state
   */
  updateState(newState: Partial<MenuBarState>): void {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  /**
   * Get current menu bar state.
   * @returns Current state object
   */
  getState(): MenuBarState {
    return { ...this.state, panelStates: { ...this.state.panelStates } };
  }

  /**
   * Set panel visibility states for View menu checkmarks.
   * @param states - Panel visibility states
   */
  setPanelStates(states: PanelStates): void {
    this.state.panelStates = { ...states };
  }

  /**
   * Destroy the menu bar and clean up resources.
   */
  destroy(): void {
    // Remove document click listener
    if (this.boundDocumentClick) {
      document.removeEventListener('click', this.boundDocumentClick);
      this.boundDocumentClick = null;
    }

    // Remove keydown listener
    if (this.boundKeydown) {
      document.removeEventListener('keydown', this.boundKeydown);
      this.boundKeydown = null;
    }

    // Remove menu trigger click handlers
    this.menuTriggers.forEach((btn, menuId) => {
      const clickHandler = this.boundMenuTriggerClick.get(menuId);
      if (clickHandler) {
        btn.removeEventListener('click', clickHandler);
      }
      const mouseEnterHandler = this.boundMenuTriggerMouseEnter.get(menuId);
      if (mouseEnterHandler) {
        btn.removeEventListener('mouseenter', mouseEnterHandler);
      }
    });
    this.boundMenuTriggerClick.clear();
    this.boundMenuTriggerMouseEnter.clear();

    // Remove toggle button handlers
    this.toggleButtons.forEach((btn, mode) => {
      const handler = this.boundToggleClick.get(mode);
      if (handler) {
        btn.removeEventListener('click', handler);
      }
    });
    this.boundToggleClick.clear();

    // Clean up any open dropdown menu item listeners
    this.boundMenuItemClick.forEach((handler, element) => {
      element.removeEventListener('click', handler);
    });
    this.boundMenuItemClick.clear();

    // Clear caches
    this.toggleButtons.clear();
    this.menuTriggers.clear();
    this.dropdownContainer = null;

    // Remove element from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Render the menu bar HTML structure.
   * @returns The menu bar element
   */
  private render(): HTMLElement {
    const menuBar = document.createElement('div');
    menuBar.className = 'da-menubar';
    menuBar.setAttribute('role', 'menubar');
    menuBar.setAttribute('aria-label', 'Application menu bar');

    menuBar.innerHTML = `
      <div class="da-menubar-toggle" role="tablist" aria-label="View mode">
        <button
          class="da-menubar-toggle-btn"
          data-mode="story"
          role="tab"
          aria-selected="false"
          aria-controls="da-story-mode-panel"
          tabindex="-1"
          title="Switch to Story Mode"
        >
          <span class="da-menubar-toggle-icon">📜</span>
          <span class="da-menubar-toggle-text">Story</span>
        </button>
        <button
          class="da-menubar-toggle-btn da-menubar-toggle-btn--active"
          data-mode="lab"
          role="tab"
          aria-selected="true"
          aria-controls="da-lab-mode-panel"
          tabindex="0"
          title="Switch to Lab Mode"
        >
          <span class="da-menubar-toggle-icon">⚡</span>
          <span class="da-menubar-toggle-text">Lab</span>
        </button>
      </div>

      <div class="da-menubar-menus">
        ${Object.keys(MENU_STRUCTURE).map(menuId => `
          <div class="da-menu-container" data-menu-container="${menuId}">
            <button
              class="da-menu-trigger"
              data-menu="${menuId}"
              aria-haspopup="true"
              aria-expanded="false"
              aria-label="${MENU_LABELS[menuId]} menu"
            >
              ${MENU_LABELS[menuId]}
            </button>
          </div>
        `).join('')}
      </div>

      <div class="da-menubar-spacer"></div>
    `;

    return menuBar;
  }

  /**
   * Cache element references for efficient updates.
   */
  private cacheElements(): void {
    if (!this.element) return;

    // Cache toggle buttons
    const storyBtn = this.element.querySelector<HTMLButtonElement>('[data-mode="story"]');
    const labBtn = this.element.querySelector<HTMLButtonElement>('[data-mode="lab"]');
    if (storyBtn) this.toggleButtons.set('story', storyBtn);
    if (labBtn) this.toggleButtons.set('lab', labBtn);

    // Cache menu triggers
    Object.keys(MENU_STRUCTURE).forEach(menuId => {
      const trigger = this.element?.querySelector<HTMLButtonElement>(`[data-menu="${menuId}"]`);
      if (trigger) {
        this.menuTriggers.set(menuId, trigger);
      }
    });
  }

  /**
   * Attach event listeners.
   */
  private attachEventListeners(): void {
    // Toggle button click handlers
    this.toggleButtons.forEach((btn, mode) => {
      const handler = () => this.handleToggleClick(mode);
      this.boundToggleClick.set(mode, handler);
      btn.addEventListener('click', handler);
    });

    // Menu trigger click handlers
    this.menuTriggers.forEach((btn, menuId) => {
      const clickHandler = (e: Event) => {
        e.stopPropagation();
        this.handleMenuTriggerClick(menuId);
      };
      this.boundMenuTriggerClick.set(menuId, clickHandler);
      btn.addEventListener('click', clickHandler);

      // Mouse enter handler for switching menus while one is open
      const mouseEnterHandler = () => {
        if (this.state.openMenu !== null && this.state.openMenu !== menuId) {
          this.openMenu(menuId);
        }
      };
      this.boundMenuTriggerMouseEnter.set(menuId, mouseEnterHandler);
      btn.addEventListener('mouseenter', mouseEnterHandler);
    });

    // Document click handler for closing menus
    this.boundDocumentClick = (e: MouseEvent) => this.handleDocumentClick(e);
    document.addEventListener('click', this.boundDocumentClick);

    // Keyboard handler for Escape and arrow navigation
    this.boundKeydown = (e: KeyboardEvent) => this.handleKeydown(e);
    document.addEventListener('keydown', this.boundKeydown);
  }

  /**
   * Handle toggle button click.
   * @param mode - The mode to switch to
   */
  private handleToggleClick(mode: AppMode): void {
    if (this.state.currentMode === mode) return;

    this.state.currentMode = mode;
    this.updateToggleUI();
    this.callbacks.onModeChange(mode);
  }

  /**
   * Handle menu trigger click.
   * @param menuId - The menu to toggle
   */
  private handleMenuTriggerClick(menuId: string): void {
    if (this.state.openMenu === menuId) {
      this.closeMenu();
    } else {
      this.openMenu(menuId);
    }
  }

  /**
   * Handle document click for closing menus.
   * @param e - Mouse event
   */
  private handleDocumentClick(e: MouseEvent): void {
    if (this.state.openMenu === null) return;

    const target = e.target as HTMLElement;

    // Don't close if clicking on a menu trigger (handled by trigger click)
    if (target.closest('.da-menu-trigger')) return;

    // Don't close if clicking inside the dropdown
    if (target.closest('.da-menu-dropdown')) return;

    this.closeMenu();
  }

  /**
   * Handle keyboard events.
   * @param e - Keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (this.state.openMenu === null) return;

    switch (e.key) {
      case 'Escape': {
        e.preventDefault();
        // Save the open menu before closing so we can restore focus
        const previousMenu = this.state.openMenu;
        this.closeMenu();
        // Focus the trigger that was open
        if (previousMenu) {
          const trigger = this.menuTriggers.get(previousMenu);
          trigger?.focus();
        }
        break;
      }

      case 'ArrowDown':
        e.preventDefault();
        this.focusNextMenuItem(1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.focusNextMenuItem(-1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.focusNextMenu(1);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.focusNextMenu(-1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        this.activateFocusedMenuItem();
        break;
    }
  }

  /**
   * Focus the next/previous menu item.
   * @param direction - 1 for next, -1 for previous
   */
  private focusNextMenuItem(direction: number): void {
    if (!this.dropdownContainer) return;

    const items = Array.from(
      this.dropdownContainer.querySelectorAll<HTMLElement>('.da-menu-item:not(.da-menu-separator)')
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex(item => item === document.activeElement);
    let newIndex: number;

    if (currentIndex === -1) {
      newIndex = direction > 0 ? 0 : items.length - 1;
    } else {
      newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = items.length - 1;
      if (newIndex >= items.length) newIndex = 0;
    }

    items[newIndex].focus();
  }

  /**
   * Focus the next/previous menu.
   * @param direction - 1 for next, -1 for previous
   */
  private focusNextMenu(direction: number): void {
    if (this.state.openMenu === null) return;

    const menuIds = Object.keys(MENU_STRUCTURE);
    const currentIndex = menuIds.indexOf(this.state.openMenu);
    let newIndex = currentIndex + direction;

    if (newIndex < 0) newIndex = menuIds.length - 1;
    if (newIndex >= menuIds.length) newIndex = 0;

    this.openMenu(menuIds[newIndex]);
  }

  /**
   * Activate the currently focused menu item.
   */
  private activateFocusedMenuItem(): void {
    const focused = document.activeElement as HTMLElement;
    if (focused?.classList.contains('da-menu-item')) {
      focused.click();
    }
  }

  /**
   * Open a menu dropdown.
   * @param menuId - The menu to open
   */
  private openMenu(menuId: string): void {
    // Close existing dropdown
    this.removeDropdown();

    // Update state
    this.state.openMenu = menuId;

    // Update trigger states
    this.menuTriggers.forEach((btn, id) => {
      btn.classList.toggle('da-menu-trigger--open', id === menuId);
      btn.setAttribute('aria-expanded', id === menuId ? 'true' : 'false');
    });

    // Create and show dropdown
    const container = this.element?.querySelector(`[data-menu-container="${menuId}"]`);
    if (container) {
      this.dropdownContainer = this.createDropdown(menuId);
      container.appendChild(this.dropdownContainer);

      // Focus first menu item immediately on open.
      // Design choice: We auto-focus the first item for faster keyboard navigation,
      // rather than requiring ArrowDown to enter the menu. This matches VS Code behavior.
      const firstItem = this.dropdownContainer.querySelector<HTMLElement>('.da-menu-item:not(.da-menu-separator)');
      firstItem?.focus();
    }
  }

  /**
   * Close the current menu dropdown.
   */
  private closeMenu(): void {
    this.removeDropdown();
    this.state.openMenu = null;

    // Update trigger states
    this.menuTriggers.forEach(btn => {
      btn.classList.remove('da-menu-trigger--open');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Remove the dropdown from DOM and clean up event listeners.
   */
  private removeDropdown(): void {
    if (this.dropdownContainer) {
      // Clean up menu item click listeners before removing from DOM
      this.boundMenuItemClick.forEach((handler, element) => {
        element.removeEventListener('click', handler);
      });
      this.boundMenuItemClick.clear();

      this.dropdownContainer.remove();
      this.dropdownContainer = null;
    }
  }

  /**
   * Create a dropdown menu element.
   * @param menuId - The menu ID
   * @returns The dropdown element
   */
  private createDropdown(menuId: string): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'da-menu-dropdown';
    dropdown.setAttribute('role', 'menu');
    dropdown.setAttribute('aria-label', `${MENU_LABELS[menuId]} menu`);

    const items = MENU_STRUCTURE[menuId];
    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'da-menu-separator';
        separator.setAttribute('role', 'separator');
        dropdown.appendChild(separator);
      } else {
        const menuItem = document.createElement('button');
        menuItem.className = 'da-menu-item';
        if (item.disabled) {
          menuItem.classList.add('da-menu-item--disabled');
          menuItem.setAttribute('aria-disabled', 'true');
        }
        menuItem.setAttribute('role', 'menuitemcheckbox');
        menuItem.setAttribute('data-action', item.id);
        menuItem.setAttribute('tabindex', '-1');

        // Add checkmark for View menu panel items
        let checkmark = '';
        let isChecked = false;
        if (menuId === 'view') {
          if (item.id === 'codePanel') {
            isChecked = this.state.panelStates.code;
          } else if (item.id === 'circuitPanel') {
            isChecked = this.state.panelStates.circuit;
          } else if (item.id === 'statePanel') {
            isChecked = this.state.panelStates.state;
          }
          if (item.id === 'codePanel' || item.id === 'circuitPanel' || item.id === 'statePanel') {
            checkmark = isChecked ? '✓ ' : '    ';
            menuItem.setAttribute('aria-checked', isChecked ? 'true' : 'false');
          } else {
            menuItem.setAttribute('role', 'menuitem');
          }
        } else {
          menuItem.setAttribute('role', 'menuitem');
        }

        menuItem.innerHTML = `
          <span class="da-menu-item-label">${checkmark}${item.label}</span>
          ${item.shortcut ? `<span class="da-menu-shortcut">${item.shortcut}</span>` : ''}
        `;

        const clickHandler = () => {
          if (!item.disabled) {
            this.handleMenuItemClick(menuId, item.id);
          }
        };
        this.boundMenuItemClick.set(menuItem, clickHandler);
        menuItem.addEventListener('click', clickHandler);

        dropdown.appendChild(menuItem);
      }
    });

    return dropdown;
  }

  /**
   * Handle menu item click.
   * @param menuId - The menu ID
   * @param itemId - The item ID
   */
  private handleMenuItemClick(menuId: string, itemId: string): void {
    this.closeMenu();

    // Dispatch to appropriate callback
    switch (menuId) {
      case 'file':
        this.handleFileMenuClick(itemId);
        break;
      case 'edit':
        this.handleEditMenuClick(itemId);
        break;
      case 'view':
        this.handleViewMenuClick(itemId);
        break;
      case 'debug':
        this.handleDebugMenuClick(itemId);
        break;
      case 'help':
        this.handleHelpMenuClick(itemId);
        break;
    }
  }

  /**
   * Handle File menu item clicks.
   */
  private handleFileMenuClick(itemId: string): void {
    switch (itemId) {
      case 'new':
        this.callbacks.onFileNew();
        break;
      case 'open':
        this.callbacks.onFileOpen();
        break;
      case 'save':
        this.callbacks.onFileSave();
        break;
      case 'saveAs':
        this.callbacks.onFileSaveAs();
        break;
      case 'export':
        this.callbacks.onFileExport();
        break;
      case 'import':
        this.callbacks.onFileImport();
        break;
    }
  }

  /**
   * Handle Edit menu item clicks.
   */
  private handleEditMenuClick(itemId: string): void {
    switch (itemId) {
      case 'undo':
        this.callbacks.onEditUndo();
        break;
      case 'redo':
        this.callbacks.onEditRedo();
        break;
      case 'cut':
        this.callbacks.onEditCut();
        break;
      case 'copy':
        this.callbacks.onEditCopy();
        break;
      case 'paste':
        this.callbacks.onEditPaste();
        break;
    }
  }

  /**
   * Handle View menu item clicks.
   */
  private handleViewMenuClick(itemId: string): void {
    switch (itemId) {
      case 'codePanel':
        this.callbacks.onViewCodePanel();
        break;
      case 'circuitPanel':
        this.callbacks.onViewCircuitPanel();
        break;
      case 'statePanel':
        this.callbacks.onViewStatePanel();
        break;
      case 'resetLayout':
        this.callbacks.onViewResetLayout();
        break;
    }
  }

  /**
   * Handle Debug menu item clicks.
   */
  private handleDebugMenuClick(itemId: string): void {
    switch (itemId) {
      case 'assemble':
        this.callbacks.onDebugAssemble();
        break;
      case 'run':
        this.callbacks.onDebugRun();
        break;
      case 'pause':
        this.callbacks.onDebugPause();
        break;
      case 'reset':
        this.callbacks.onDebugReset();
        break;
      case 'step':
        this.callbacks.onDebugStep();
        break;
      case 'toggleBreakpoint':
        this.callbacks.onDebugToggleBreakpoint();
        break;
    }
  }

  /**
   * Handle Help menu item clicks.
   */
  private handleHelpMenuClick(itemId: string): void {
    switch (itemId) {
      case 'shortcuts':
        this.callbacks.onHelpKeyboardShortcuts();
        break;
      case 'docs':
        this.callbacks.onHelpDocumentation();
        break;
      case 'about':
        this.callbacks.onHelpAbout();
        break;
    }
  }

  /**
   * Update UI based on current state.
   */
  private updateUI(): void {
    this.updateToggleUI();
  }

  /**
   * Update toggle button UI.
   */
  private updateToggleUI(): void {
    this.toggleButtons.forEach((btn, mode) => {
      const isActive = mode === this.state.currentMode;
      btn.classList.toggle('da-menubar-toggle-btn--active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }
}
