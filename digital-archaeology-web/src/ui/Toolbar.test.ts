// src/ui/Toolbar.test.ts
// Unit tests for Toolbar component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Toolbar } from './Toolbar';
import type { ToolbarCallbacks } from './Toolbar';

describe('Toolbar', () => {
  let container: HTMLDivElement;
  let mockCallbacks: ToolbarCallbacks;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockCallbacks = {
      onFileClick: vi.fn(),
      onAssembleClick: vi.fn(),
      onRunClick: vi.fn(),
      onPauseClick: vi.fn(),
      onResetClick: vi.fn(),
      onStepClick: vi.fn(),
      onStepBackClick: vi.fn(),
      onSpeedChange: vi.fn(),
      onHelpClick: vi.fn(),
      onSettingsClick: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Task 1: Component Structure', () => {
    it('should create a toolbar element on mount', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const element = container.querySelector('.da-toolbar-content');
      expect(element).not.toBeNull();

      toolbar.destroy();
    });

    it('should have a render method that returns toolbar HTML', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      // Toolbar content should have button groups
      const leftGroup = container.querySelector('.da-toolbar-group--left');
      const centerGroup = container.querySelector('.da-toolbar-group--center');
      const rightGroup = container.querySelector('.da-toolbar-group--right');

      expect(leftGroup).not.toBeNull();
      expect(centerGroup).not.toBeNull();
      expect(rightGroup).not.toBeNull();

      toolbar.destroy();
    });

    it('should be safe to call destroy before mount', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.destroy(); // Should not throw
    });

    it('should be safe to call destroy multiple times', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);
      toolbar.destroy();
      toolbar.destroy(); // Should not throw
    });

    it('should allow remounting after destroy', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);
      toolbar.destroy();

      expect(container.querySelector('.da-toolbar-content')).toBeNull();

      toolbar.mount(container);
      expect(container.querySelector('.da-toolbar-content')).not.toBeNull();

      toolbar.destroy();
    });
  });

  describe('Task 2: Toolbar Buttons', () => {
    it('should render File dropdown trigger button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]');
      expect(fileBtn).not.toBeNull();
      expect(fileBtn?.textContent).toContain('📁');

      toolbar.destroy();
    });

    it('should render Assemble button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const assembleBtn = container.querySelector('[data-action="assemble"]');
      expect(assembleBtn).not.toBeNull();
      expect(assembleBtn?.textContent).toContain('Assemble');

      toolbar.destroy();
    });

    it('should render Run button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const runBtn = container.querySelector('[data-action="run"]');
      expect(runBtn).not.toBeNull();
      expect(runBtn?.textContent).toContain('Run');

      toolbar.destroy();
    });

    it('should render Pause button (hidden initially)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLElement;
      expect(pauseBtn).not.toBeNull();
      expect(pauseBtn.hidden).toBe(true);

      toolbar.destroy();
    });

    it('should render Reset button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const resetBtn = container.querySelector('[data-action="reset"]');
      expect(resetBtn).not.toBeNull();
      expect(resetBtn?.textContent).toContain('Reset');

      toolbar.destroy();
    });

    it('should render Step button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBtn = container.querySelector('[data-action="step"]');
      expect(stepBtn).not.toBeNull();
      expect(stepBtn?.textContent).toContain('Step');

      toolbar.destroy();
    });

    it('should render Settings button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const settingsBtn = container.querySelector('[data-action="settings"]');
      expect(settingsBtn).not.toBeNull();
      expect(settingsBtn?.textContent).toContain('⚙');

      toolbar.destroy();
    });

    it('should render Help button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const helpBtn = container.querySelector('[data-action="help"]');
      expect(helpBtn).not.toBeNull();
      expect(helpBtn?.textContent).toContain('?');

      toolbar.destroy();
    });
  });

  describe('Task 3: Speed Control Slider', () => {
    it('should render speed slider', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      expect(slider).not.toBeNull();
      expect(slider.type).toBe('range');

      toolbar.destroy();
    });

    it('should have speed slider with default value 60', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      expect(slider.value).toBe('60');

      toolbar.destroy();
    });

    it('should have speed slider with range 1-1000 Hz', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      expect(slider.min).toBe('1');
      expect(slider.max).toBe('1000');

      toolbar.destroy();
    });

    it('should render speed label with Hz suffix', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const label = container.querySelector('.da-speed-label');
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe('60 Hz');

      toolbar.destroy();
    });
  });

  describe('Task 5: Button State Management', () => {
    it('should return current state via getState()', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const state = toolbar.getState();
      expect(state.canAssemble).toBe(false);
      expect(state.canRun).toBe(false);
      expect(state.speed).toBe(60);
      expect(state.isRunning).toBe(false);

      toolbar.destroy();
    });

    it('should return updated state after updateState()', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canAssemble: true, speed: 75 });
      const state = toolbar.getState();

      expect(state.canAssemble).toBe(true);
      expect(state.speed).toBe(75);

      toolbar.destroy();
    });

    it('should disable execution buttons initially', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;

      expect(assembleBtn.disabled).toBe(true);
      expect(runBtn.disabled).toBe(true);
      expect(resetBtn.disabled).toBe(true);
      expect(stepBtn.disabled).toBe(true);

      toolbar.destroy();
    });

    it('should enable File, Settings, Help buttons initially', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]') as HTMLButtonElement;
      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;
      const helpBtn = container.querySelector('[data-action="help"]') as HTMLButtonElement;

      expect(fileBtn.disabled).toBe(false);
      expect(settingsBtn.disabled).toBe(false);
      expect(helpBtn.disabled).toBe(false);

      toolbar.destroy();
    });

    it('should update button states via updateState()', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canAssemble: true, canRun: true });

      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;

      expect(assembleBtn.disabled).toBe(false);
      expect(runBtn.disabled).toBe(false);

      toolbar.destroy();
    });

    it('should toggle Run/Pause visibility based on isRunning', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const runBtn = container.querySelector('[data-action="run"]') as HTMLElement;
      const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLElement;

      // Initially: Run visible, Pause hidden
      expect(runBtn.hidden).toBe(false);
      expect(pauseBtn.hidden).toBe(true);

      // When running: Run hidden, Pause visible
      toolbar.updateState({ isRunning: true, canPause: true });
      expect(runBtn.hidden).toBe(true);
      expect(pauseBtn.hidden).toBe(false);

      // When stopped: Run visible, Pause hidden
      toolbar.updateState({ isRunning: false });
      expect(runBtn.hidden).toBe(false);
      expect(pauseBtn.hidden).toBe(true);

      toolbar.destroy();
    });

    it('should enable Pause button when canPause is true and isRunning', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;

      // Initially disabled
      expect(pauseBtn.disabled).toBe(true);

      // Enable pause when running
      toolbar.updateState({ isRunning: true, canPause: true });
      expect(pauseBtn.disabled).toBe(false);
      expect(pauseBtn.hidden).toBe(false);

      toolbar.destroy();
    });

    it('should update speed slider value via updateState()', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ speed: 75 });

      const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      const label = container.querySelector('.da-speed-label');

      expect(slider.value).toBe('75');
      expect(label?.textContent).toBe('75 Hz');

      toolbar.destroy();
    });
  });

  describe('Task 6: Button Event Callbacks', () => {
    it('should call onFileClick when File button clicked', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]') as HTMLButtonElement;
      fileBtn.click();

      expect(mockCallbacks.onFileClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onAssembleClick when Assemble button clicked (when enabled)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canAssemble: true });
      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleBtn.click();

      expect(mockCallbacks.onAssembleClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should NOT call onAssembleClick when Assemble button is disabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      // Assemble is disabled by default
      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleBtn.click();

      expect(mockCallbacks.onAssembleClick).not.toHaveBeenCalled();

      toolbar.destroy();
    });

    it('should call onRunClick when Run button clicked (when enabled)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canRun: true });
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      expect(mockCallbacks.onRunClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onPauseClick when Pause button clicked (when visible and enabled)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ isRunning: true, canPause: true });
      const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
      pauseBtn.click();

      expect(mockCallbacks.onPauseClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onResetClick when Reset button clicked (when enabled)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canReset: true });
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      expect(mockCallbacks.onResetClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onStepClick when Step button clicked (when enabled)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canStep: true });
      const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
      stepBtn.click();

      expect(mockCallbacks.onStepClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onHelpClick when Help button clicked', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const helpBtn = container.querySelector('[data-action="help"]') as HTMLButtonElement;
      helpBtn.click();

      expect(mockCallbacks.onHelpClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onSettingsClick when Settings button clicked', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;
      settingsBtn.click();

      expect(mockCallbacks.onSettingsClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should call onStepBackClick when Step Back button clicked (when enabled) (Story 5.2)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canStepBack: true });
      const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
      stepBackBtn.click();

      expect(mockCallbacks.onStepBackClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();
    });

    it('should NOT call onStepBackClick when Step Back button is disabled (Story 5.2)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      // Step Back is disabled by default
      const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
      stepBackBtn.click();

      expect(mockCallbacks.onStepBackClick).not.toHaveBeenCalled();

      toolbar.destroy();
    });

    it('should call onSpeedChange when slider value changes', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      slider.value = '75';
      slider.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockCallbacks.onSpeedChange).toHaveBeenCalledWith(75);

      toolbar.destroy();
    });
  });

  describe('Task 8: Accessibility', () => {
    it('should have role="toolbar" on toolbar container', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const element = container.querySelector('.da-toolbar-content');
      expect(element?.getAttribute('role')).toBe('toolbar');

      toolbar.destroy();
    });

    it('should have aria-label on toolbar', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const element = container.querySelector('.da-toolbar-content');
      expect(element?.getAttribute('aria-label')).toBe('Main toolbar');

      toolbar.destroy();
    });

    it('should have aria-label on each button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const buttons = container.querySelectorAll('button[data-action]');
      buttons.forEach(btn => {
        expect(btn.getAttribute('aria-label')).not.toBeNull();
      });

      toolbar.destroy();
    });

    it('should have aria-keyshortcuts="F10" on Step button (Story 5.1)', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBtn = container.querySelector('[data-action="step"]');
      expect(stepBtn?.getAttribute('aria-keyshortcuts')).toBe('F10');

      toolbar.destroy();
    });

    it('should have title attributes for tooltips', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const buttons = container.querySelectorAll('button[data-action]');
      buttons.forEach(btn => {
        expect(btn.getAttribute('title')).not.toBeNull();
      });

      toolbar.destroy();
    });

    it('should have aria-pressed on Run/Pause toggle buttons', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const runBtn = container.querySelector('[data-action="run"]');
      const pauseBtn = container.querySelector('[data-action="pause"]');

      // When not running, run has aria-pressed="false"
      expect(runBtn?.getAttribute('aria-pressed')).toBe('false');
      expect(pauseBtn?.getAttribute('aria-pressed')).toBe('false');

      // When running, pause has aria-pressed="true"
      toolbar.updateState({ isRunning: true, canPause: true });
      expect(runBtn?.getAttribute('aria-pressed')).toBe('false');
      expect(pauseBtn?.getAttribute('aria-pressed')).toBe('true');

      toolbar.destroy();
    });

    it('should have aria-label on speed slider', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider');
      expect(slider?.getAttribute('aria-label')).toBe('Execution speed (Hz)');

      toolbar.destroy();
    });

    it('should have aria-valuenow/valuemin/valuemax on speed slider', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider');
      expect(slider?.getAttribute('aria-valuenow')).toBe('60');
      expect(slider?.getAttribute('aria-valuemin')).toBe('1');
      expect(slider?.getAttribute('aria-valuemax')).toBe('1000');

      toolbar.destroy();
    });

    it('should update aria-valuenow when speed changes', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      slider.value = '75';
      slider.dispatchEvent(new Event('input', { bubbles: true }));

      expect(slider.getAttribute('aria-valuenow')).toBe('75');

      toolbar.destroy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support ArrowRight to move focus to next button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const helpBtn = container.querySelector('[data-action="help"]') as HTMLButtonElement;
      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;

      // Focus on help button and press ArrowRight
      helpBtn.focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      container.querySelector('.da-toolbar-content')?.dispatchEvent(event);

      expect(document.activeElement).toBe(settingsBtn);

      toolbar.destroy();
    });

    it('should support ArrowLeft to move focus to previous button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const helpBtn = container.querySelector('[data-action="help"]') as HTMLButtonElement;
      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;

      // Focus on settings button and press ArrowLeft
      settingsBtn.focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      container.querySelector('.da-toolbar-content')?.dispatchEvent(event);

      expect(document.activeElement).toBe(helpBtn);

      toolbar.destroy();
    });

    it('should support Home key to move focus to first button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]') as HTMLButtonElement;
      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;

      // Focus on settings button and press Home
      settingsBtn.focus();
      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      container.querySelector('.da-toolbar-content')?.dispatchEvent(event);

      expect(document.activeElement).toBe(fileBtn);

      toolbar.destroy();
    });

    it('should support End key to move focus to last button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]') as HTMLButtonElement;
      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;

      // Focus on file button and press End
      fileBtn.focus();
      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      container.querySelector('.da-toolbar-content')?.dispatchEvent(event);

      expect(document.activeElement).toBe(settingsBtn);

      toolbar.destroy();
    });

    it('should wrap focus from last to first on ArrowRight', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]') as HTMLButtonElement;
      const settingsBtn = container.querySelector('[data-action="settings"]') as HTMLButtonElement;

      // Focus on settings (last) and press ArrowRight
      settingsBtn.focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      container.querySelector('.da-toolbar-content')?.dispatchEvent(event);

      expect(document.activeElement).toBe(fileBtn);

      toolbar.destroy();
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const fileBtn = container.querySelector('[data-action="file"]') as HTMLButtonElement;

      // Click works before destroy
      fileBtn.click();
      expect(mockCallbacks.onFileClick).toHaveBeenCalledTimes(1);

      toolbar.destroy();

      // After destroy, callbacks map should be cleared
      // (We can't easily test that listeners are removed, but we verify cleanup doesn't throw)
      expect(container.querySelector('.da-toolbar-content')).toBeNull();
    });
  });

  describe('dynamic tooltips (Story 3.7)', () => {
    it('should show "Assemble first" tooltip when Run is disabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      // Run starts disabled
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      expect(runBtn.title).toBe('Assemble first (F5)');
    });

    it('should show "Assemble first" tooltip when Step is disabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
      expect(stepBtn.title).toBe('Assemble first (F10)');
    });

    it('should show "Assemble first" tooltip when Reset is disabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      expect(resetBtn.title).toBe('Assemble first (Shift+F5)');
    });

    it('should show normal tooltip when Run is enabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canRun: true });

      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      expect(runBtn.title).toBe('Run (F5)');
    });

    it('should show normal tooltip when Step is enabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canStep: true });

      const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
      expect(stepBtn.title).toBe('Step (F10)');
    });

    it('should show normal tooltip when Reset is enabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canReset: true });

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      expect(resetBtn.title).toBe('Reset (Shift+F5)');
    });

    it('should switch tooltip when button state changes from enabled to disabled', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      // Enable then disable
      toolbar.updateState({ canRun: true });
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      expect(runBtn.title).toBe('Run (F5)');

      toolbar.updateState({ canRun: false });
      expect(runBtn.title).toBe('Assemble first (F5)');
    });
  });

  describe('Step Back button (Story 5.2)', () => {
    it('should render Step Back button', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBackBtn = container.querySelector('[data-action="step-back"]');
      expect(stepBackBtn).not.toBeNull();
      expect(stepBackBtn?.textContent).toContain('Back');

      toolbar.destroy();
    });

    it('should have correct aria-keyshortcuts attribute for F9', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBackBtn = container.querySelector('[data-action="step-back"]');
      expect(stepBackBtn?.getAttribute('aria-keyshortcuts')).toBe('F9');

      toolbar.destroy();
    });

    it('should have correct aria-label for screen readers', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBackBtn = container.querySelector('[data-action="step-back"]');
      expect(stepBackBtn?.getAttribute('aria-label')).toBe('Step back one instruction');

      toolbar.destroy();
    });

    it('should have correct title tooltip', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBackBtn = container.querySelector('[data-action="step-back"]');
      expect(stepBackBtn?.getAttribute('title')).toBe('Step back one instruction (F9)');

      toolbar.destroy();
    });

    it('should be disabled by default', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
      expect(stepBackBtn.disabled).toBe(true);

      toolbar.destroy();
    });

    it('should be enabled when canStepBack is true', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canStepBack: true });
      const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
      expect(stepBackBtn.disabled).toBe(false);

      toolbar.destroy();
    });

    it('should be disabled when canStepBack is false', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      toolbar.updateState({ canStepBack: true });
      toolbar.updateState({ canStepBack: false });
      const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
      expect(stepBackBtn.disabled).toBe(true);

      toolbar.destroy();
    });

    it('should initialize canStepBack to false in default state', () => {
      const toolbar = new Toolbar(mockCallbacks);
      toolbar.mount(container);

      const state = toolbar.getState();
      expect(state.canStepBack).toBe(false);

      toolbar.destroy();
    });
  });
});
