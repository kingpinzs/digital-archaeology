// src/ui/ModeToggle.test.ts
// Tests for the ModeToggle component

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { ModeToggle } from './ModeToggle';

describe('ModeToggle', () => {
  let container: HTMLElement;
  let modeToggle: ModeToggle;
  let mockOnModeChange: Mock;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockOnModeChange = vi.fn();
  });

  afterEach(() => {
    modeToggle?.destroy();
    container.remove();
  });

  describe('Task 1: Component Rendering', () => {
    it('should render two toggle buttons with correct labels', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn).not.toBeNull();
      expect(labBtn).not.toBeNull();
      expect(storyBtn?.textContent).toContain('Story');
      expect(labBtn?.textContent).toContain('Lab');
    });

    it('should render Story button with 📜 emoji', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      expect(storyBtn?.textContent).toContain('📜');
    });

    it('should render Lab button with ⚡ emoji', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]');
      expect(labBtn?.textContent).toContain('⚡');
    });

    it('should apply active class to current mode button', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]');
      const storyBtn = container.querySelector('[data-mode="story"]');

      expect(labBtn?.classList.contains('da-mode-toggle-btn--active')).toBe(true);
      expect(storyBtn?.classList.contains('da-mode-toggle-btn--active')).toBe(false);
    });

    it('should apply active class to story button when story mode is current', () => {
      modeToggle = new ModeToggle({
        currentMode: 'story',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]');
      const storyBtn = container.querySelector('[data-mode="story"]');

      expect(storyBtn?.classList.contains('da-mode-toggle-btn--active')).toBe(true);
      expect(labBtn?.classList.contains('da-mode-toggle-btn--active')).toBe(false);
    });
  });

  describe('Task 1: Callback Handling', () => {
    it('should call onModeChange when Story button is clicked', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      expect(mockOnModeChange).toHaveBeenCalledWith('story');
    });

    it('should call onModeChange when Lab button is clicked', () => {
      modeToggle = new ModeToggle({
        currentMode: 'story',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should NOT call onModeChange when clicking already active button', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      expect(mockOnModeChange).not.toHaveBeenCalled();
    });

    it('should update active state after mode change', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      expect(storyBtn.classList.contains('da-mode-toggle-btn--active')).toBe(true);
    });
  });

  describe('Task 1: setMode API', () => {
    it('should update active state when setMode is called', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      modeToggle.setMode('story');

      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn?.classList.contains('da-mode-toggle-btn--active')).toBe(true);
      expect(labBtn?.classList.contains('da-mode-toggle-btn--active')).toBe(false);
    });

    it('should return current mode via getMode', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      expect(modeToggle.getMode()).toBe('lab');

      modeToggle.setMode('story');
      expect(modeToggle.getMode()).toBe('story');
    });
  });

  describe('Task 1: ARIA Accessibility', () => {
    it('should have role="tablist" on container', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const toggle = container.querySelector('.da-mode-toggle');
      expect(toggle?.getAttribute('role')).toBe('tablist');
    });

    it('should have aria-label on container', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const toggle = container.querySelector('.da-mode-toggle');
      expect(toggle?.getAttribute('aria-label')).toBe('View mode');
    });

    it('should have role="tab" on buttons', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn?.getAttribute('role')).toBe('tab');
      expect(labBtn?.getAttribute('role')).toBe('tab');
    });

    it('should have aria-selected on active button', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]');
      const storyBtn = container.querySelector('[data-mode="story"]');

      expect(labBtn?.getAttribute('aria-selected')).toBe('true');
      expect(storyBtn?.getAttribute('aria-selected')).toBe('false');
    });

    it('should have tabindex=0 only on active button', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]');
      const storyBtn = container.querySelector('[data-mode="story"]');

      expect(labBtn?.getAttribute('tabindex')).toBe('0');
      expect(storyBtn?.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('Task 1: Keyboard Navigation', () => {
    it('should switch to next mode on ArrowRight (wraps to story)', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.focus();

      // ArrowRight from lab (index 1) wraps to story (index 0)
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      labBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('story');
    });

    it('should switch to previous mode on ArrowLeft (wraps to lab)', () => {
      modeToggle = new ModeToggle({
        currentMode: 'story',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.focus();

      // ArrowLeft from story (index 0) wraps to lab (index 1)
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      storyBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should go to Story on Home key', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.focus();

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      labBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('story');
    });

    it('should go to Lab on End key', () => {
      modeToggle = new ModeToggle({
        currentMode: 'story',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.focus();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      storyBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should activate focused button on Enter key', () => {
      modeToggle = new ModeToggle({
        currentMode: 'story',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.focus();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      labBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should activate focused button on Space key', () => {
      modeToggle = new ModeToggle({
        currentMode: 'story',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.focus();

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      labBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });
  });

  describe('Task 1: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      expect(container.querySelector('.da-mode-toggle')).not.toBeNull();

      modeToggle.destroy();

      expect(container.querySelector('.da-mode-toggle')).toBeNull();
    });

    it('should not call callback after destroy', () => {
      modeToggle = new ModeToggle({
        currentMode: 'lab',
        onModeChange: mockOnModeChange,
      });
      modeToggle.mount(container);

      modeToggle.destroy();

      // Element is removed, so callback should not have been called
      expect(mockOnModeChange).not.toHaveBeenCalled();
    });
  });
});
