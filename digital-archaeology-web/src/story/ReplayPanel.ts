// src/story/ReplayPanel.ts
// Modal panel for time-travel replay of visited scenes
// Story 26.8: Time-Travel Replay

import type { TimelineEntry } from './StoryState';

/**
 * Callbacks for ReplayPanel events.
 */
export interface ReplayPanelCallbacks {
  /** Called when the panel is closed */
  onClose: () => void;
  /** Called when a scene is selected for replay */
  onReplayScene: (sceneId: string) => void;
  /** Called when user wants to return to present (exit replay) */
  onReturnToPresent: () => void;
}

/**
 * Data needed to display the replay panel.
 */
export interface ReplayPanelData {
  /** Chronological timeline of visited scenes */
  timeline: TimelineEntry[];
  /** Current scene ID (live play position) */
  currentSceneId: string;
  /** Scene ID being replayed (null if not replaying) */
  replaySceneId: string | null;
}

/** Scene type icons for display */
const SCENE_TYPE_ICONS: Record<string, string> = {
  narrative: '\u{1F4D6}', // 📖
  dialogue: '\u{1F4AC}',  // 💬
  choice: '\u{2194}',     // ↔
  challenge: '\u{1F3AF}', // 🎯
  decision: '\u{2696}',   // ⚖
  builder: '\u{1F527}',   // 🔧
};

/**
 * ReplayPanel displays a chronological timeline of visited scenes.
 * Allows the player to replay past scenes without losing progress.
 *
 * Layout:
 * - Full-screen backdrop with semi-transparent overlay
 * - Centered modal with timeline list grouped by act
 * - "Return to Present" button at top when in replay mode
 */
export class ReplayPanel {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private callbacks: ReplayPanelCallbacks | null = null;
  private data: ReplayPanelData | null = null;

  // Event handlers for cleanup
  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private handleBackdropClick: ((e: MouseEvent) => void) | null = null;

  /**
   * Set the callbacks for replay panel events.
   */
  setCallbacks(callbacks: ReplayPanelCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Open the replay panel with the given data.
   */
  open(data: ReplayPanelData): void {
    this.data = data;
    this.render();
    this.setupEventListeners();
    this.element?.focus();
  }

  /**
   * Close the replay panel.
   */
  close(): void {
    this.removeEventListeners();

    if (this.backdropElement) {
      this.backdropElement.remove();
      this.backdropElement = null;
    }
    this.element = null;
  }

  /**
   * Check if the panel is currently open.
   */
  isOpen(): boolean {
    return this.element !== null;
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.close();
    this.callbacks = null;
    this.data = null;
  }

  // =========================================================================
  // Rendering
  // =========================================================================

  private render(): void {
    // Remove existing
    this.close();
    if (!this.data) return;

    // Backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-replay-panel__backdrop';

    // Modal
    this.element = document.createElement('div');
    this.element.className = 'da-replay-panel';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', 'Time-Travel Replay');
    this.element.tabIndex = -1;

    // Header
    const header = document.createElement('div');
    header.className = 'da-replay-panel__header';

    const title = document.createElement('h2');
    title.className = 'da-replay-panel__title';
    title.textContent = '\u{23F1} Time-Travel Replay'; // ⏱

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'da-replay-panel__close';
    closeBtn.textContent = '\u{2715}';
    closeBtn.setAttribute('aria-label', 'Close replay panel');
    closeBtn.addEventListener('click', () => {
      this.callbacks?.onClose();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Return to present button (when in replay mode)
    if (this.data.replaySceneId) {
      const returnBtn = document.createElement('button');
      returnBtn.type = 'button';
      returnBtn.className = 'da-replay-panel__return';
      returnBtn.textContent = 'Return to Present \u2192';
      returnBtn.addEventListener('click', () => {
        this.callbacks?.onReturnToPresent();
      });
      header.appendChild(returnBtn);
    }

    // Status line
    const status = document.createElement('div');
    status.className = 'da-replay-panel__status';
    status.textContent = this.data.replaySceneId
      ? 'Replaying past scene \u2014 progress preserved'
      : `${this.data.timeline.length} scenes visited`;

    // Timeline list
    const body = document.createElement('div');
    body.className = 'da-replay-panel__body';

    if (this.data.timeline.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'da-replay-panel__empty';
      empty.textContent = 'No scenes visited yet. Start the story to build your timeline.';
      body.appendChild(empty);
    } else {
      // Group by act
      const grouped = this.groupByAct(this.data.timeline);
      for (const [actNumber, entries] of grouped) {
        const group = this.renderActGroup(actNumber, entries);
        body.appendChild(group);
      }
    }

    this.element.appendChild(header);
    this.element.appendChild(status);
    this.element.appendChild(body);

    this.backdropElement.appendChild(this.element);
    document.body.appendChild(this.backdropElement);
  }

  private groupByAct(timeline: TimelineEntry[]): Map<number, TimelineEntry[]> {
    const groups = new Map<number, TimelineEntry[]>();
    for (const entry of timeline) {
      const existing = groups.get(entry.actNumber);
      if (existing) {
        existing.push(entry);
      } else {
        groups.set(entry.actNumber, [entry]);
      }
    }
    return groups;
  }

  private renderActGroup(actNumber: number, entries: TimelineEntry[]): HTMLElement {
    const group = document.createElement('div');
    group.className = 'da-replay-panel__act-group';

    const actHeader = document.createElement('div');
    actHeader.className = 'da-replay-panel__act-header';
    actHeader.textContent = `Act ${actNumber}: ${entries[0].actTitle}`;
    group.appendChild(actHeader);

    for (const entry of entries) {
      const item = this.renderTimelineItem(entry);
      group.appendChild(item);
    }

    return group;
  }

  private renderTimelineItem(entry: TimelineEntry): HTMLElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'da-replay-panel__item';

    const isCurrent = entry.sceneId === this.data?.currentSceneId;
    const isReplaying = entry.sceneId === this.data?.replaySceneId;

    if (isCurrent) item.classList.add('da-replay-panel__item--current');
    if (isReplaying) item.classList.add('da-replay-panel__item--replaying');
    if (entry.choiceMade) item.classList.add('da-replay-panel__item--has-choice');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'da-replay-panel__item-icon';
    icon.textContent = SCENE_TYPE_ICONS[entry.sceneType] ?? '\u25CB';
    item.appendChild(icon);

    // Info
    const info = document.createElement('div');
    info.className = 'da-replay-panel__item-info';

    const label = document.createElement('span');
    label.className = 'da-replay-panel__item-label';
    label.textContent = `${this.formatSceneType(entry.sceneType)}`;
    info.appendChild(label);

    const context = document.createElement('span');
    context.className = 'da-replay-panel__item-context';
    context.textContent = `Ch ${entry.chapterNumber}: ${entry.chapterTitle}`;
    info.appendChild(context);

    item.appendChild(info);

    // Badges
    if (isCurrent) {
      const badge = document.createElement('span');
      badge.className = 'da-replay-panel__badge da-replay-panel__badge--current';
      badge.textContent = 'NOW';
      item.appendChild(badge);
    }
    if (isReplaying) {
      const badge = document.createElement('span');
      badge.className = 'da-replay-panel__badge da-replay-panel__badge--replaying';
      badge.textContent = 'REPLAYING';
      item.appendChild(badge);
    }
    if (entry.choiceMade) {
      const choiceIcon = document.createElement('span');
      choiceIcon.className = 'da-replay-panel__choice-icon';
      choiceIcon.textContent = '\u{2714}'; // ✔
      choiceIcon.setAttribute('aria-label', 'Choice made here');
      item.appendChild(choiceIcon);
    }

    item.addEventListener('click', () => {
      this.callbacks?.onReplayScene(entry.sceneId);
    });

    return item;
  }

  private formatSceneType(type: string): string {
    const map: Record<string, string> = {
      narrative: 'Story',
      dialogue: 'Dialogue',
      choice: 'Branch Point',
      challenge: 'Challenge',
      decision: 'Decision',
      builder: 'Builder',
    };
    return map[type] ?? type;
  }

  // =========================================================================
  // Event handling
  // =========================================================================

  private setupEventListeners(): void {
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.callbacks?.onClose();
      }
    };
    this.handleBackdropClick = (e: MouseEvent) => {
      if (e.target === this.backdropElement) {
        this.callbacks?.onClose();
      }
    };

    document.addEventListener('keydown', this.handleKeyDown);
    this.backdropElement?.addEventListener('click', this.handleBackdropClick);
  }

  private removeEventListeners(): void {
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
    if (this.handleBackdropClick && this.backdropElement) {
      this.backdropElement.removeEventListener('click', this.handleBackdropClick);
      this.handleBackdropClick = null;
    }
  }
}
