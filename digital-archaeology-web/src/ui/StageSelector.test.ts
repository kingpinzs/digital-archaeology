// src/ui/StageSelector.test.ts
// Tests for the StageSelector component

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { StageSelector, LAB_STAGES, STAGE_METADATA } from './StageSelector';
import type { LabStage } from './StageSelector';

describe('StageSelector', () => {
  let container: HTMLElement;
  let selector: StageSelector;
  let mockOnStageChange: Mock;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockOnStageChange = vi.fn();
  });

  afterEach(() => {
    selector?.destroy();
    container.remove();
  });

  describe('Task 1: Component Rendering', () => {
    it('should render trigger button with current stage label', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger');
      expect(trigger).not.toBeNull();
      expect(trigger?.textContent).toContain('Micro4');
    });

    it('should render trigger with stage icon', () => {
      selector = new StageSelector({
        currentStage: 'micro8',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const icon = container.querySelector('.da-stage-selector-trigger-icon');
      expect(icon?.textContent).toBe('8');
    });

    it('should render trigger with chevron', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const chevron = container.querySelector('.da-stage-selector-trigger-chevron');
      expect(chevron).not.toBeNull();
    });

    it('should render dropdown with all 6 stages', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const items = container.querySelectorAll('.da-stage-selector-item');
      expect(items.length).toBe(6);
    });

    it('should render each stage with correct label', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: LAB_STAGES as unknown as LabStage[],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      for (const stage of LAB_STAGES) {
        const item = container.querySelector(`[data-stage="${stage}"]`);
        expect(item?.textContent).toContain(STAGE_METADATA[stage].label);
      }
    });

    it('should render stage detail info (data width and address space)', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro4Item = container.querySelector('[data-stage="micro4"]');
      expect(micro4Item?.textContent).toContain('4-bit');
      expect(micro4Item?.textContent).toContain('256 B');
    });
  });

  describe('Task 1: Active State', () => {
    it('should apply active class to current stage item', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro4Item = container.querySelector('[data-stage="micro4"]');
      expect(micro4Item?.classList.contains('da-stage-selector-item--active')).toBe(true);
    });

    it('should not apply active class to non-current stages', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.classList.contains('da-stage-selector-item--active')).toBe(false);
    });
  });

  describe('Task 1: Locked States', () => {
    it('should apply locked class to stages not in unlockedStages', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.classList.contains('da-stage-selector-item--locked')).toBe(true);
    });

    it('should not apply locked class to unlocked stages', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.classList.contains('da-stage-selector-item--locked')).toBe(false);
    });

    it('should show lock icon on locked stages', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      const lock = micro8Item?.querySelector('.da-stage-selector-item-lock');
      expect(lock).not.toBeNull();
    });

    it('should not show lock icon on unlocked stages', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro4Item = container.querySelector('[data-stage="micro4"]');
      const lock = micro4Item?.querySelector('.da-stage-selector-item-lock');
      expect(lock).toBeNull();
    });

    it('should not fire callback when clicking locked stage', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.click();

      expect(mockOnStageChange).not.toHaveBeenCalled();
    });
  });

  describe('Task 2: Dropdown Interaction', () => {
    it('should open dropdown on trigger click', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.classList.contains('da-stage-selector-dropdown--open')).toBe(true);
    });

    it('should close dropdown on second trigger click', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click(); // open
      trigger.click(); // close

      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.classList.contains('da-stage-selector-dropdown--open')).toBe(false);
    });

    it('should set aria-expanded=true when open', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-expanded=false when closed', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should fire onStageChange when clicking unlocked stage', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      // Open dropdown
      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      // Click micro8
      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.click();

      expect(mockOnStageChange).toHaveBeenCalledWith('micro8');
    });

    it('should update active state after selection', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      // Open and select micro8
      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();
      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.click();

      // Verify active state moved
      expect(micro8Item.classList.contains('da-stage-selector-item--active')).toBe(true);
      const micro4Item = container.querySelector('[data-stage="micro4"]');
      expect(micro4Item?.classList.contains('da-stage-selector-item--active')).toBe(false);
    });

    it('should update trigger label after selection', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      // Open and select micro8
      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();
      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.click();

      const label = container.querySelector('.da-stage-selector-trigger-label');
      expect(label?.textContent).toBe('Micro8');

      const icon = container.querySelector('.da-stage-selector-trigger-icon');
      expect(icon?.textContent).toBe('8');
    });

    it('should close dropdown after selection', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();
      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.click();

      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.classList.contains('da-stage-selector-dropdown--open')).toBe(false);
    });

    it('should close dropdown on click outside', async () => {
      vi.useFakeTimers();
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      // Advance past the setTimeout(0) that registers the document click handler
      await vi.advanceTimersByTimeAsync(1);

      // Click outside the selector
      document.body.click();

      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.classList.contains('da-stage-selector-dropdown--open')).toBe(false);
      vi.useRealTimers();
    });

    it('should close dropdown on clicking same stage', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();
      const micro4Item = container.querySelector('[data-stage="micro4"]') as HTMLElement;
      micro4Item.click();

      expect(mockOnStageChange).not.toHaveBeenCalled();
      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.classList.contains('da-stage-selector-dropdown--open')).toBe(false);
    });
  });

  describe('Task 2: Keyboard Navigation', () => {
    it('should close dropdown on Escape', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.classList.contains('da-stage-selector-dropdown--open')).toBe(false);
    });

    it('should move focus down on ArrowDown', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: LAB_STAGES as unknown as LabStage[],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      // Focus should be on micro4 (active item)
      const micro4Item = container.querySelector('[data-stage="micro4"]') as HTMLElement;
      micro4Item.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement?.getAttribute('data-stage')).toBe('micro8');
    });

    it('should move focus up on ArrowUp', () => {
      selector = new StageSelector({
        currentStage: 'micro8',
        unlockedStages: LAB_STAGES as unknown as LabStage[],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement?.getAttribute('data-stage')).toBe('micro4');
    });

    it('should wrap around on ArrowDown from last item', () => {
      selector = new StageSelector({
        currentStage: 'micro32s',
        unlockedStages: LAB_STAGES as unknown as LabStage[],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      const lastItem = container.querySelector('[data-stage="micro32s"]') as HTMLElement;
      lastItem.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement?.getAttribute('data-stage')).toBe('micro4');
    });

    it('should select stage on Enter key', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      // Focus micro8
      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.focus();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      document.dispatchEvent(event);

      expect(mockOnStageChange).toHaveBeenCalledWith('micro8');
    });

    it('should focus first item on Home key', () => {
      selector = new StageSelector({
        currentStage: 'micro8',
        unlockedStages: LAB_STAGES as unknown as LabStage[],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      const micro8Item = container.querySelector('[data-stage="micro8"]') as HTMLElement;
      micro8Item.focus();

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement?.getAttribute('data-stage')).toBe('micro4');
    });

    it('should focus last item on End key', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: LAB_STAGES as unknown as LabStage[],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger') as HTMLButtonElement;
      trigger.click();

      const micro4Item = container.querySelector('[data-stage="micro4"]') as HTMLElement;
      micro4Item.focus();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement?.getAttribute('data-stage')).toBe('micro32s');
    });
  });

  describe('Task 1: Public API', () => {
    it('should return current stage via getStage', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      expect(selector.getStage()).toBe('micro4');
    });

    it('should update display when setStage is called', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      selector.setStage('micro8');

      expect(selector.getStage()).toBe('micro8');

      const label = container.querySelector('.da-stage-selector-trigger-label');
      expect(label?.textContent).toBe('Micro8');

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.classList.contains('da-stage-selector-item--active')).toBe(true);
    });

    it('should update locked states when setUnlockedStages is called', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      // Initially micro8 is locked
      let micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.classList.contains('da-stage-selector-item--locked')).toBe(true);

      // Unlock micro8
      selector.setUnlockedStages(['micro4', 'micro8']);

      micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.classList.contains('da-stage-selector-item--locked')).toBe(false);
      expect(micro8Item?.querySelector('.da-stage-selector-item-lock')).toBeNull();
    });
  });

  describe('Task 1: ARIA Accessibility', () => {
    it('should have role=combobox on trigger', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger');
      expect(trigger?.getAttribute('role')).toBe('combobox');
    });

    it('should have aria-haspopup=listbox on trigger', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const trigger = container.querySelector('.da-stage-selector-trigger');
      expect(trigger?.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should have role=listbox on dropdown', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const dropdown = container.querySelector('.da-stage-selector-dropdown');
      expect(dropdown?.getAttribute('role')).toBe('listbox');
    });

    it('should have role=option on items', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const items = container.querySelectorAll('.da-stage-selector-item');
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('option');
      });
    });

    it('should have aria-selected=true on active item', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const activeItem = container.querySelector('[data-stage="micro4"]');
      expect(activeItem?.getAttribute('aria-selected')).toBe('true');
    });

    it('should have aria-selected=false on non-active items', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.getAttribute('aria-selected')).toBe('false');
    });

    it('should have aria-disabled=true on locked items', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have aria-disabled=false on unlocked items', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      const micro4Item = container.querySelector('[data-stage="micro4"]');
      expect(micro4Item?.getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('Task 1: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      expect(container.querySelector('.da-stage-selector')).not.toBeNull();

      selector.destroy();

      expect(container.querySelector('.da-stage-selector')).toBeNull();
    });

    it('should not fire callback after destroy', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      selector.destroy();

      expect(mockOnStageChange).not.toHaveBeenCalled();
    });
  });

  // Story 19.5: Unlock Requirement Display
  describe('Task 10: Unlock Requirement Display', () => {
    it('should display requirement text on locked items via constructor option', () => {
      const reqs = new Map<LabStage, string>([
        ['micro8', 'Complete Act 4: First Microprocessor'],
      ]);
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
        unlockRequirements: reqs,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      const reqEl = micro8Item?.querySelector('.da-stage-selector-item-requirement');
      expect(reqEl).not.toBeNull();
      expect(reqEl?.textContent).toBe('Complete Act 4: First Microprocessor');
    });

    it('should add requirement text when setUnlockRequirements is called', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      // Initially no requirement text
      let micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.querySelector('.da-stage-selector-item-requirement')).toBeNull();

      // Set requirements
      selector.setUnlockRequirements(new Map<LabStage, string>([
        ['micro8', 'Complete Act 4: First Microprocessor'],
        ['micro16', 'Complete Act 5: 8-bit Era'],
      ]));

      micro8Item = container.querySelector('[data-stage="micro8"]');
      const reqEl = micro8Item?.querySelector('.da-stage-selector-item-requirement');
      expect(reqEl?.textContent).toBe('Complete Act 4: First Microprocessor');

      const micro16Item = container.querySelector('[data-stage="micro16"]');
      const reqEl16 = micro16Item?.querySelector('.da-stage-selector-item-requirement');
      expect(reqEl16?.textContent).toBe('Complete Act 5: 8-bit Era');
    });

    it('should NOT show requirement text for unlocked items', () => {
      const reqs = new Map<LabStage, string>([
        ['micro4', 'This should not appear'],
        ['micro8', 'Complete Act 4: First Microprocessor'],
      ]);
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4', 'micro8'],
        onStageChange: mockOnStageChange,
        unlockRequirements: reqs,
      });
      selector.mount(container);

      // micro4 is unlocked — no requirement
      const micro4Item = container.querySelector('[data-stage="micro4"]');
      expect(micro4Item?.querySelector('.da-stage-selector-item-requirement')).toBeNull();

      // micro8 is unlocked — no requirement
      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.querySelector('.da-stage-selector-item-requirement')).toBeNull();
    });

    it('should use textContent (XSS-safe), not innerHTML', () => {
      const reqs = new Map<LabStage, string>([
        ['micro8', '<script>alert("xss")</script>'],
      ]);
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
        unlockRequirements: reqs,
      });
      selector.mount(container);

      const micro8Item = container.querySelector('[data-stage="micro8"]');
      const reqEl = micro8Item?.querySelector('.da-stage-selector-item-requirement');
      // textContent should contain the raw text, not executed script
      expect(reqEl?.textContent).toBe('<script>alert("xss")</script>');
      expect(reqEl?.querySelector('script')).toBeNull();
    });

    it('should remove requirement text when stage becomes unlocked', () => {
      const reqs = new Map<LabStage, string>([
        ['micro8', 'Complete Act 4: First Microprocessor'],
      ]);
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
        unlockRequirements: reqs,
      });
      selector.mount(container);

      // Requirement visible initially
      let micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.querySelector('.da-stage-selector-item-requirement')).not.toBeNull();

      // Unlock micro8
      selector.setUnlockedStages(['micro4', 'micro8']);

      micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.querySelector('.da-stage-selector-item-requirement')).toBeNull();
      expect(micro8Item?.querySelector('.da-stage-selector-item-lock')).toBeNull();
    });

    it('should update requirement text when setUnlockRequirements and setUnlockedStages are called together', () => {
      selector = new StageSelector({
        currentStage: 'micro4',
        unlockedStages: ['micro4'],
        onStageChange: mockOnStageChange,
      });
      selector.mount(container);

      // Set requirements for all locked stages
      selector.setUnlockRequirements(new Map<LabStage, string>([
        ['micro8', 'Complete Act 4: First Microprocessor'],
        ['micro16', 'Complete Act 5: 8-bit Era'],
      ]));

      // Unlock micro8
      selector.setUnlockedStages(['micro4', 'micro8']);

      // micro8 requirement should be gone
      const micro8Item = container.querySelector('[data-stage="micro8"]');
      expect(micro8Item?.querySelector('.da-stage-selector-item-requirement')).toBeNull();

      // micro16 requirement should still show
      const micro16Item = container.querySelector('[data-stage="micro16"]');
      expect(micro16Item?.querySelector('.da-stage-selector-item-requirement')?.textContent)
        .toBe('Complete Act 5: 8-bit Era');
    });
  });
});
