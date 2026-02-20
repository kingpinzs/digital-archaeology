// src/ui/StageSelector.ts
// Dropdown selector for switching between CPU stages in Lab Mode

/**
 * Lab-usable CPU stages that have emulators/assemblers.
 * Pre-microprocessor stages (mechanical, relay, vacuum, transistor)
 * and 'future' are story-only stages with no lab tooling.
 */
export type LabStage = 'micro4' | 'micro8' | 'micro16' | 'micro32' | 'micro32p' | 'micro32s';

/** Display metadata for each lab stage */
export interface StageInfo {
  label: string;
  icon: string;
  dataWidth: string;
  addressSpace: string;
  instructionCount: number;
}

/** Ordered list of all lab stages for rendering */
export const LAB_STAGES: readonly LabStage[] = [
  'micro4', 'micro8', 'micro16', 'micro32', 'micro32p', 'micro32s',
] as const;

/** Display metadata keyed by stage */
export const STAGE_METADATA: Record<LabStage, StageInfo> = {
  micro4:   { label: 'Micro4',    icon: '4',  dataWidth: '4-bit',  addressSpace: '256 B',  instructionCount: 16 },
  micro8:   { label: 'Micro8',    icon: '8',  dataWidth: '8-bit',  addressSpace: '64 KB',  instructionCount: 80 },
  micro16:  { label: 'Micro16',   icon: '16', dataWidth: '16-bit', addressSpace: '1 MB',   instructionCount: 100 },
  micro32:  { label: 'Micro32',   icon: '32', dataWidth: '32-bit', addressSpace: '4 GB',   instructionCount: 200 },
  micro32p: { label: 'Micro32-P', icon: 'P',  dataWidth: '32-bit', addressSpace: '4 GB',   instructionCount: 200 },
  micro32s: { label: 'Micro32-S', icon: 'S',  dataWidth: '32-bit', addressSpace: '4 GB',   instructionCount: 200 },
};

/**
 * Configuration options for the StageSelector component.
 */
export interface StageSelectorOptions {
  /** Currently selected stage */
  currentStage: LabStage;
  /** Stages the user has unlocked */
  unlockedStages: LabStage[];
  /** Callback when stage changes */
  onStageChange: (stage: LabStage) => void;
  /** Optional unlock requirement text per locked stage (Story 19.5) */
  unlockRequirements?: Map<LabStage, string>;
}

/**
 * StageSelector component provides a dropdown to switch between CPU stages.
 * Follows the ModeToggle class-based component pattern with mount/destroy lifecycle.
 */
export class StageSelector {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private currentStage: LabStage;
  private unlockedStages: Set<LabStage>;
  private onStageChange: (stage: LabStage) => void;
  private unlockRequirements: Map<LabStage, string> = new Map();
  private isOpen: boolean = false;

  // Cached DOM references
  private triggerBtn: HTMLButtonElement | null = null;
  private triggerIcon: HTMLSpanElement | null = null;
  private triggerLabel: HTMLSpanElement | null = null;
  private dropdown: HTMLElement | null = null;
  private items: Map<LabStage, HTMLElement> = new Map();

  // Bound event handlers for cleanup (bound in constructor per project convention)
  private boundTriggerClick: () => void;
  private boundDocumentClick: (e: MouseEvent) => void;
  private boundKeydown: (e: KeyboardEvent) => void;
  private boundItemHandlers: Map<LabStage, () => void> = new Map();

  constructor(options: StageSelectorOptions) {
    this.currentStage = options.currentStage;
    this.unlockedStages = new Set(options.unlockedStages);
    this.onStageChange = options.onStageChange;
    if (options.unlockRequirements) {
      this.unlockRequirements = new Map(options.unlockRequirements);
    }

    // Bind handlers in constructor for proper add/remove pairing
    this.boundTriggerClick = this.toggleDropdown.bind(this);
    this.boundDocumentClick = this.onDocumentClick.bind(this);
    this.boundKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the selector to a container element.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this.cacheElements();
    this.attachEventListeners();
    this.updateActiveState();
  }

  /**
   * Update the current stage and refresh display.
   */
  setStage(stage: LabStage): void {
    this.currentStage = stage;
    this.updateActiveState();
    this.updateTriggerLabel();
  }

  /**
   * Get the current stage.
   */
  getStage(): LabStage {
    return this.currentStage;
  }

  /**
   * Update the set of unlocked stages.
   */
  setUnlockedStages(stages: LabStage[]): void {
    this.unlockedStages = new Set(stages);
    this.updateLockedState();
  }

  /**
   * Update unlock requirement text for locked stages (Story 19.5).
   */
  setUnlockRequirements(reqs: Map<LabStage, string>): void {
    this.unlockRequirements = new Map(reqs);
    this.updateLockedState();
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    this.closeDropdown();

    if (this.triggerBtn) {
      this.triggerBtn.removeEventListener('click', this.boundTriggerClick);
    }

    // Remove item click handlers
    this.items.forEach((item, stage) => {
      const handler = this.boundItemHandlers.get(stage);
      if (handler) item.removeEventListener('click', handler);
    });

    this.boundItemHandlers.clear();
    this.items.clear();
    this.triggerBtn = null;
    this.triggerIcon = null;
    this.triggerLabel = null;
    this.dropdown = null;

    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.container = null;
  }

  /**
   * Render the component HTML structure using safe DOM methods.
   */
  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-stage-selector';

    // Trigger button
    const trigger = document.createElement('button');
    trigger.className = 'da-stage-selector-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'CPU Stage');

    const meta = STAGE_METADATA[this.currentStage];

    const iconSpan = document.createElement('span');
    iconSpan.className = 'da-stage-selector-trigger-icon';
    iconSpan.textContent = meta.icon;
    trigger.appendChild(iconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'da-stage-selector-trigger-label';
    labelSpan.textContent = meta.label;
    trigger.appendChild(labelSpan);

    const chevron = document.createElement('span');
    chevron.className = 'da-stage-selector-trigger-chevron';
    chevron.textContent = '\u25BE'; // ▾
    trigger.appendChild(chevron);

    wrapper.appendChild(trigger);

    // Dropdown panel
    const dropdown = document.createElement('div');
    dropdown.className = 'da-stage-selector-dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-label', 'CPU Stage');

    for (const stage of LAB_STAGES) {
      const info = STAGE_METADATA[stage];
      const isLocked = !this.unlockedStages.has(stage);
      const isActive = stage === this.currentStage;

      const item = document.createElement('div');
      item.className = 'da-stage-selector-item';
      if (isActive) item.classList.add('da-stage-selector-item--active');
      if (isLocked) item.classList.add('da-stage-selector-item--locked');

      item.setAttribute('role', 'option');
      item.setAttribute('data-stage', stage);
      item.setAttribute('aria-selected', String(isActive));
      item.setAttribute('aria-disabled', String(isLocked));
      item.setAttribute('tabindex', '-1');

      const itemIcon = document.createElement('span');
      itemIcon.className = 'da-stage-selector-item-icon';
      itemIcon.textContent = info.icon;
      item.appendChild(itemIcon);

      const itemLabel = document.createElement('span');
      itemLabel.className = 'da-stage-selector-item-label';
      itemLabel.textContent = info.label;
      item.appendChild(itemLabel);

      const itemDetail = document.createElement('span');
      itemDetail.className = 'da-stage-selector-item-detail';
      itemDetail.textContent = `${info.dataWidth} \u00B7 ${info.addressSpace}`;
      item.appendChild(itemDetail);

      if (isLocked) {
        const lock = document.createElement('span');
        lock.className = 'da-stage-selector-item-lock';
        lock.textContent = '\uD83D\uDD12'; // 🔒
        item.appendChild(lock);

        const reqText = this.unlockRequirements.get(stage);
        if (reqText) {
          const req = document.createElement('span');
          req.className = 'da-stage-selector-item-requirement';
          req.textContent = reqText;
          item.appendChild(req);
        }
      }

      dropdown.appendChild(item);
    }

    wrapper.appendChild(dropdown);
    return wrapper;
  }

  /**
   * Cache element references.
   */
  private cacheElements(): void {
    if (!this.element) return;
    this.triggerBtn = this.element.querySelector('.da-stage-selector-trigger');
    this.triggerIcon = this.element.querySelector('.da-stage-selector-trigger-icon');
    this.triggerLabel = this.element.querySelector('.da-stage-selector-trigger-label');
    this.dropdown = this.element.querySelector('.da-stage-selector-dropdown');

    for (const stage of LAB_STAGES) {
      const item = this.element.querySelector<HTMLElement>(`[data-stage="${stage}"]`);
      if (item) this.items.set(stage, item);
    }
  }

  /**
   * Attach event listeners.
   */
  private attachEventListeners(): void {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', this.boundTriggerClick);
    }

    // Item click handlers
    this.items.forEach((item, stage) => {
      const handler = () => this.handleItemClick(stage);
      this.boundItemHandlers.set(stage, handler);
      item.addEventListener('click', handler);
    });
  }

  /**
   * Toggle dropdown open/closed.
   */
  private toggleDropdown(): void {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open the dropdown.
   */
  private openDropdown(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    this.dropdown?.classList.add('da-stage-selector-dropdown--open');
    this.triggerBtn?.setAttribute('aria-expanded', 'true');

    // Focus current stage item
    const activeItem = this.items.get(this.currentStage);
    activeItem?.focus();

    // Document click to close (delayed to avoid current click event)
    setTimeout(() => {
      if (this.isOpen) {
        document.addEventListener('click', this.boundDocumentClick);
      }
    }, 0);

    // Keyboard navigation
    document.addEventListener('keydown', this.boundKeydown);
  }

  /**
   * Close the dropdown.
   */
  private closeDropdown(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.dropdown?.classList.remove('da-stage-selector-dropdown--open');
    this.triggerBtn?.setAttribute('aria-expanded', 'false');

    document.removeEventListener('click', this.boundDocumentClick);
    document.removeEventListener('keydown', this.boundKeydown);
  }

  /**
   * Handle item click - select stage if unlocked.
   */
  private handleItemClick(stage: LabStage): void {
    if (!this.unlockedStages.has(stage)) return;
    if (stage === this.currentStage) {
      this.closeDropdown();
      return;
    }

    this.currentStage = stage;
    this.updateActiveState();
    this.updateTriggerLabel();
    this.closeDropdown();
    this.onStageChange(stage);
  }

  /**
   * Handle document click for close-on-outside behavior.
   */
  private onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!this.element?.contains(target)) {
      this.closeDropdown();
    }
  }

  /**
   * Handle keyboard navigation in the dropdown.
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        this.triggerBtn?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.focusNextItem(1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.focusNextItem(-1);
        break;

      case 'Home':
        e.preventDefault();
        this.focusItemAtIndex(0);
        break;

      case 'End':
        e.preventDefault();
        this.focusItemAtIndex(LAB_STAGES.length - 1);
        break;

      case 'Enter':
      case ' ': {
        e.preventDefault();
        const focused = document.activeElement as HTMLElement;
        const stage = focused?.getAttribute('data-stage') as LabStage | null;
        if (stage) {
          this.handleItemClick(stage);
        }
        break;
      }
    }
  }

  /**
   * Focus the next/previous item in the list.
   */
  private focusNextItem(direction: number): void {
    const focused = document.activeElement as HTMLElement;
    const currentStage = focused?.getAttribute('data-stage') as LabStage | null;
    const currentIndex = currentStage ? LAB_STAGES.indexOf(currentStage) : -1;

    let newIndex: number;
    if (currentIndex === -1) {
      newIndex = direction > 0 ? 0 : LAB_STAGES.length - 1;
    } else {
      newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = LAB_STAGES.length - 1;
      if (newIndex >= LAB_STAGES.length) newIndex = 0;
    }

    this.focusItemAtIndex(newIndex);
  }

  /**
   * Focus an item at a specific index.
   */
  private focusItemAtIndex(index: number): void {
    const stage = LAB_STAGES[index];
    const item = this.items.get(stage);
    item?.focus();
  }

  /**
   * Update which item has the active class and aria-selected.
   */
  private updateActiveState(): void {
    this.items.forEach((item, stage) => {
      const isActive = stage === this.currentStage;
      item.classList.toggle('da-stage-selector-item--active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });
  }

  /**
   * Update trigger button label to reflect current stage.
   */
  private updateTriggerLabel(): void {
    const meta = STAGE_METADATA[this.currentStage];
    if (this.triggerIcon) this.triggerIcon.textContent = meta.icon;
    if (this.triggerLabel) this.triggerLabel.textContent = meta.label;
  }

  /**
   * Update locked/unlocked states on all items.
   */
  private updateLockedState(): void {
    this.items.forEach((item, stage) => {
      const isLocked = !this.unlockedStages.has(stage);
      item.classList.toggle('da-stage-selector-item--locked', isLocked);
      item.setAttribute('aria-disabled', String(isLocked));

      const existingLock = item.querySelector('.da-stage-selector-item-lock');
      const existingReq = item.querySelector('.da-stage-selector-item-requirement');

      if (isLocked) {
        if (!existingLock) {
          const lock = document.createElement('span');
          lock.className = 'da-stage-selector-item-lock';
          lock.textContent = '\uD83D\uDD12'; // 🔒
          item.appendChild(lock);
        }

        const reqText = this.unlockRequirements.get(stage);
        if (reqText) {
          if (existingReq) {
            existingReq.textContent = reqText;
          } else {
            const req = document.createElement('span');
            req.className = 'da-stage-selector-item-requirement';
            req.textContent = reqText;
            item.appendChild(req);
          }
        } else if (existingReq) {
          existingReq.remove();
        }
      } else {
        if (existingLock) existingLock.remove();
        if (existingReq) existingReq.remove();
      }
    });
  }
}
