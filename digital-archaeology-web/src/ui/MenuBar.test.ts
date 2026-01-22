// src/ui/MenuBar.test.ts
// Unit tests for MenuBar component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MenuBar } from './MenuBar';
import type { MenuBarCallbacks } from './MenuBar';

describe('MenuBar', () => {
  let container: HTMLElement;
  let mockCallbacks: MenuBarCallbacks;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockCallbacks = {
      onModeChange: vi.fn(),
      // File menu
      onFileNew: vi.fn(),
      onFileOpen: vi.fn(),
      onFileSave: vi.fn(),
      onFileSaveAs: vi.fn(),
      onFileExport: vi.fn(),
      onFileImport: vi.fn(),
      // Edit menu
      onEditUndo: vi.fn(),
      onEditRedo: vi.fn(),
      onEditCut: vi.fn(),
      onEditCopy: vi.fn(),
      onEditPaste: vi.fn(),
      // View menu
      onViewCodePanel: vi.fn(),
      onViewCircuitPanel: vi.fn(),
      onViewStatePanel: vi.fn(),
      onViewResetLayout: vi.fn(),
      // Debug menu
      onDebugAssemble: vi.fn(),
      onDebugRun: vi.fn(),
      onDebugPause: vi.fn(),
      onDebugReset: vi.fn(),
      onDebugStep: vi.fn(),
      onDebugToggleBreakpoint: vi.fn(),
      // Help menu
      onHelpKeyboardShortcuts: vi.fn(),
      onHelpDocumentation: vi.fn(),
      onHelpAbout: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Component Structure', () => {
    it('should render the menu bar container', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const element = container.querySelector('.da-menubar');
      expect(element).not.toBeNull();
    });

    it('should have role="menubar" attribute', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const element = container.querySelector('.da-menubar');
      expect(element?.getAttribute('role')).toBe('menubar');
    });

    it('should have aria-label attribute', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const element = container.querySelector('.da-menubar');
      expect(element?.getAttribute('aria-label')).toBe('Application menu bar');
    });

    it('should be removable via destroy()', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      expect(container.querySelector('.da-menubar')).not.toBeNull();

      menuBar.destroy();

      expect(container.querySelector('.da-menubar')).toBeNull();
    });
  });

  describe('Story/Lab Toggle', () => {
    it('should render Story and Lab toggle buttons', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn).not.toBeNull();
      expect(labBtn).not.toBeNull();
    });

    it('should have Lab mode active by default', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]');
      expect(labBtn?.classList.contains('da-menubar-toggle-btn--active')).toBe(true);
      expect(labBtn?.getAttribute('aria-pressed')).toBe('true');
    });

    it('should have Story mode inactive by default', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      expect(storyBtn?.classList.contains('da-menubar-toggle-btn--active')).toBe(false);
      expect(storyBtn?.getAttribute('aria-pressed')).toBe('false');
    });

    it('should switch to Story mode when Story button is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('story');
      expect(storyBtn.classList.contains('da-menubar-toggle-btn--active')).toBe(true);
    });

    it('should switch to Lab mode when Lab button is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      // First switch to Story
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      // Then switch back to Lab
      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('lab');
      expect(labBtn.classList.contains('da-menubar-toggle-btn--active')).toBe(true);
    });

    it('should not fire callback when clicking already active mode', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      // Lab is already active, so callback should not be called
      expect(mockCallbacks.onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('Menu Triggers', () => {
    it('should render all menu trigger buttons', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileMenu = container.querySelector('[data-menu="file"]');
      const editMenu = container.querySelector('[data-menu="edit"]');
      const viewMenu = container.querySelector('[data-menu="view"]');
      const debugMenu = container.querySelector('[data-menu="debug"]');
      const helpMenu = container.querySelector('[data-menu="help"]');

      expect(fileMenu).not.toBeNull();
      expect(editMenu).not.toBeNull();
      expect(viewMenu).not.toBeNull();
      expect(debugMenu).not.toBeNull();
      expect(helpMenu).not.toBeNull();
    });

    it('should have aria-haspopup attribute on triggers', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const triggers = container.querySelectorAll('.da-menu-trigger');
      triggers.forEach(trigger => {
        expect(trigger.getAttribute('aria-haspopup')).toBe('true');
      });
    });

    it('should have aria-expanded="false" initially', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const triggers = container.querySelectorAll('.da-menu-trigger');
      triggers.forEach(trigger => {
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
      });
    });
  });

  describe('Dropdown Menus', () => {
    it('should open dropdown when clicking menu trigger', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const dropdown = container.querySelector('.da-menu-dropdown');
      expect(dropdown).not.toBeNull();
    });

    it('should set aria-expanded="true" when menu is open', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      expect(fileTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should add open class to trigger when menu is open', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      expect(fileTrigger.classList.contains('da-menu-trigger--open')).toBe(true);
    });

    it('should close dropdown when clicking same trigger again', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();
      fileTrigger.click();

      const dropdown = container.querySelector('.da-menu-dropdown');
      expect(dropdown).toBeNull();
    });

    it('should close previous dropdown when clicking different trigger', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const editTrigger = container.querySelector('[data-menu="edit"]') as HTMLButtonElement;
      editTrigger.click();

      // File trigger should not be open
      expect(fileTrigger.classList.contains('da-menu-trigger--open')).toBe(false);

      // Edit trigger should be open
      expect(editTrigger.classList.contains('da-menu-trigger--open')).toBe(true);

      // Only one dropdown should exist
      const dropdowns = container.querySelectorAll('.da-menu-dropdown');
      expect(dropdowns.length).toBe(1);
    });

    it('should have role="menu" on dropdown', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const dropdown = container.querySelector('.da-menu-dropdown');
      expect(dropdown?.getAttribute('role')).toBe('menu');
    });
  });

  describe('Click Outside to Close', () => {
    it('should close dropdown when clicking outside', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      // Click outside the menu
      document.body.click();

      const dropdown = container.querySelector('.da-menu-dropdown');
      expect(dropdown).toBeNull();
    });

    it('should not close dropdown when clicking inside dropdown', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const dropdown = container.querySelector('.da-menu-dropdown');
      dropdown?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Dropdown should still exist
      expect(container.querySelector('.da-menu-dropdown')).not.toBeNull();
    });
  });

  describe('Escape Key to Close', () => {
    it('should close dropdown when Escape key is pressed', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      expect(container.querySelector('.da-menu-dropdown')).not.toBeNull();

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);

      expect(container.querySelector('.da-menu-dropdown')).toBeNull();
    });

    it('should restore focus to trigger when Escape is pressed', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);

      // Focus should be on the file trigger
      expect(document.activeElement).toBe(fileTrigger);

      menuBar.destroy();
    });
  });

  describe('Menu Items', () => {
    it('should render menu items with role="menuitem"', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const menuItems = container.querySelectorAll('.da-menu-item');
      menuItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('menuitem');
      });
    });

    it('should render separator elements', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const separators = container.querySelectorAll('.da-menu-separator');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('should render keyboard shortcuts', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const shortcuts = container.querySelectorAll('.da-menu-shortcut');
      expect(shortcuts.length).toBeGreaterThan(0);
    });
  });

  describe('Menu Item Callbacks', () => {
    it('should fire onFileNew when New menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const newItem = container.querySelector('[data-action="new"]') as HTMLButtonElement;
      newItem.click();

      expect(mockCallbacks.onFileNew).toHaveBeenCalled();
    });

    it('should fire onFileSave when Save menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const saveItem = container.querySelector('[data-action="save"]') as HTMLButtonElement;
      saveItem.click();

      expect(mockCallbacks.onFileSave).toHaveBeenCalled();
    });

    it('should fire onEditUndo when Undo menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const editTrigger = container.querySelector('[data-menu="edit"]') as HTMLButtonElement;
      editTrigger.click();

      const undoItem = container.querySelector('[data-action="undo"]') as HTMLButtonElement;
      undoItem.click();

      expect(mockCallbacks.onEditUndo).toHaveBeenCalled();
    });

    it('should fire onViewResetLayout when Reset Layout menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const resetItem = container.querySelector('[data-action="resetLayout"]') as HTMLButtonElement;
      resetItem.click();

      expect(mockCallbacks.onViewResetLayout).toHaveBeenCalled();
    });

    it('should fire onDebugAssemble when Assemble menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const debugTrigger = container.querySelector('[data-menu="debug"]') as HTMLButtonElement;
      debugTrigger.click();

      const assembleItem = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleItem.click();

      expect(mockCallbacks.onDebugAssemble).toHaveBeenCalled();
    });

    it('should fire onHelpAbout when About menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();

      const aboutItem = container.querySelector('[data-action="about"]') as HTMLButtonElement;
      aboutItem.click();

      expect(mockCallbacks.onHelpAbout).toHaveBeenCalled();
    });

    it('should close menu after menu item is clicked', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      const newItem = container.querySelector('[data-action="new"]') as HTMLButtonElement;
      newItem.click();

      expect(container.querySelector('.da-menu-dropdown')).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should return initial state via getState()', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const state = menuBar.getState();
      expect(state.currentMode).toBe('lab');
      expect(state.openMenu).toBeNull();
    });

    it('should return updated state after mode change', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      const state = menuBar.getState();
      expect(state.currentMode).toBe('story');
    });

    it('should update state via updateState()', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      menuBar.updateState({ currentMode: 'story' });

      const storyBtn = container.querySelector('[data-mode="story"]');
      expect(storyBtn?.classList.contains('da-menubar-toggle-btn--active')).toBe(true);

      const state = menuBar.getState();
      expect(state.currentMode).toBe('story');
    });

    it('should return copy of state, not reference', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const state1 = menuBar.getState();
      const state2 = menuBar.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('should have default panel states all visible', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const state = menuBar.getState();
      expect(state.panelStates.code).toBe(true);
      expect(state.panelStates.circuit).toBe(true);
      expect(state.panelStates.state).toBe(true);
    });

    it('should update panel states via setPanelStates()', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      menuBar.setPanelStates({ code: false, circuit: true, state: false });

      const state = menuBar.getState();
      expect(state.panelStates.code).toBe(false);
      expect(state.panelStates.circuit).toBe(true);
      expect(state.panelStates.state).toBe(false);
    });

    it('should return copy of panelStates, not reference', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const state1 = menuBar.getState();
      const state2 = menuBar.getState();

      expect(state1.panelStates).not.toBe(state2.panelStates);
      expect(state1.panelStates).toEqual(state2.panelStates);
    });

    it('should show checkmark for visible panels in View menu', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const codePanelItem = container.querySelector('[data-action="codePanel"]') as HTMLButtonElement;
      expect(codePanelItem.textContent).toContain('✓');
      expect(codePanelItem.getAttribute('aria-checked')).toBe('true');
    });

    it('should not show checkmark for hidden panels in View menu', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      menuBar.setPanelStates({ code: false, circuit: true, state: true });

      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const codePanelItem = container.querySelector('[data-action="codePanel"]') as HTMLButtonElement;
      expect(codePanelItem.textContent).not.toContain('✓');
      expect(codePanelItem.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next menu with ArrowRight', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      // Press ArrowRight to go to Edit menu
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      document.dispatchEvent(arrowRightEvent);

      // Edit menu should now be open
      const editTrigger = container.querySelector('[data-menu="edit"]');
      expect(editTrigger?.classList.contains('da-menu-trigger--open')).toBe(true);
    });

    it('should navigate to previous menu with ArrowLeft', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const editTrigger = container.querySelector('[data-menu="edit"]') as HTMLButtonElement;
      editTrigger.click();

      // Press ArrowLeft to go to File menu
      const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      document.dispatchEvent(arrowLeftEvent);

      // File menu should now be open
      const fileTrigger = container.querySelector('[data-menu="file"]');
      expect(fileTrigger?.classList.contains('da-menu-trigger--open')).toBe(true);
    });

    it('should wrap around from last to first menu with ArrowRight', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();

      // Press ArrowRight to wrap to File menu
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      document.dispatchEvent(arrowRightEvent);

      // File menu should now be open
      const fileTrigger = container.querySelector('[data-menu="file"]');
      expect(fileTrigger?.classList.contains('da-menu-trigger--open')).toBe(true);
    });

    it('should navigate down in menu with ArrowDown', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      // Press ArrowDown to focus second item
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      document.dispatchEvent(arrowDownEvent);

      // Second menu item should be focused
      const items = container.querySelectorAll('.da-menu-item:not(.da-menu-separator)');
      expect(document.activeElement).toBe(items[1]);
    });
  });

  describe('Cleanup', () => {
    it('should remove document click listener on destroy', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      menuBar.destroy();

      // Clicking document should not cause errors
      expect(() => document.body.click()).not.toThrow();
    });

    it('should remove keydown listener on destroy', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      menuBar.destroy();

      // Pressing Escape should not cause errors
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      expect(() => document.dispatchEvent(escapeEvent)).not.toThrow();
    });

    it('should clean up menu item listeners when dropdown is closed', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      // Open menu
      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      // Get a menu item
      const newItem = container.querySelector('[data-action="new"]') as HTMLButtonElement;
      expect(newItem).not.toBeNull();

      // Close menu by clicking trigger again
      fileTrigger.click();

      // Dropdown should be gone
      expect(container.querySelector('.da-menu-dropdown')).toBeNull();

      // Open again - should work without errors (no listener leak)
      fileTrigger.click();
      expect(container.querySelector('.da-menu-dropdown')).not.toBeNull();

      menuBar.destroy();
    });

    it('should clean up menu item listeners on destroy while dropdown is open', () => {
      const menuBar = new MenuBar(mockCallbacks);
      menuBar.mount(container);

      // Open menu
      const fileTrigger = container.querySelector('[data-menu="file"]') as HTMLButtonElement;
      fileTrigger.click();

      expect(container.querySelector('.da-menu-dropdown')).not.toBeNull();

      // Destroy while dropdown is open
      menuBar.destroy();

      // Should not cause errors
      expect(container.querySelector('.da-menubar')).toBeNull();
    });
  });
});
