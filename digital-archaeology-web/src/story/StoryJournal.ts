// src/story/StoryJournal.ts
// Modal journal for viewing story history and progress
// Phase 3: Story Navigation - Journal Component

import type { StoryChoice, StoryProgress } from './StoryState';
import type { StoryAct } from './content-types';

/**
 * Callback interface for StoryJournal events.
 */
export interface StoryJournalCallbacks {
  /** Called when the journal is closed */
  onClose: () => void;
  /** Called when user wants to navigate to a scene */
  onSceneSelect?: (sceneId: string) => void;
}

/**
 * Data needed to display the journal.
 */
export interface StoryJournalData {
  /** Current progress */
  progress: StoryProgress | null;
  /** All acts (for scene lookup) */
  acts: StoryAct[];
  /** Navigation history (scene IDs) */
  sceneHistory: string[];
}

/**
 * StoryJournal displays the player's journey through the story:
 * - Current progress summary
 * - Choices made during the story
 * - Discovered items/concepts
 * - Navigation history
 *
 * Layout:
 * - Full-screen backdrop with semi-transparent overlay
 * - Centered modal with tabs for different sections
 */
export class StoryJournal {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private callbacks: StoryJournalCallbacks | null = null;
  private data: StoryJournalData | null = null;
  private activeTab: 'progress' | 'choices' | 'discoveries' = 'progress';

  // Event handlers for cleanup
  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private handleBackdropClick: ((e: MouseEvent) => void) | null = null;

  /**
   * Set the callbacks for journal events.
   */
  setCallbacks(callbacks: StoryJournalCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Open the journal modal with the given data.
   */
  open(data: StoryJournalData): void {
    this.data = data;
    this.activeTab = 'progress';
    this.render();
    this.setupEventListeners();
    this.element?.focus();
  }

  /**
   * Close the journal modal.
   */
  close(): void {
    this.removeEventListeners();

    if (this.backdropElement) {
      this.backdropElement.remove();
      this.backdropElement = null;
    }
    this.element = null;

    this.callbacks?.onClose();
  }

  /**
   * Check if the journal is currently open.
   */
  isOpen(): boolean {
    return this.backdropElement !== null;
  }

  /**
   * Render the journal modal.
   */
  private render(): void {
    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-story-journal-backdrop';
    this.backdropElement.setAttribute('role', 'dialog');
    this.backdropElement.setAttribute('aria-modal', 'true');
    this.backdropElement.setAttribute('aria-label', 'Story journal');

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'da-story-journal';
    modal.setAttribute('tabindex', '-1');
    this.element = modal;

    // Header
    const header = this.createHeader();
    modal.appendChild(header);

    // Tabs
    const tabs = this.createTabs();
    modal.appendChild(tabs);

    // Content
    const content = document.createElement('div');
    content.className = 'da-story-journal-content';
    this.renderTabContent(content);
    modal.appendChild(content);

    this.backdropElement.appendChild(modal);
    document.body.appendChild(this.backdropElement);
  }

  /**
   * Create the modal header.
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-story-journal-header';

    const title = document.createElement('h2');
    title.className = 'da-story-journal-title';
    title.textContent = 'Journey Log';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'da-story-journal-close';
    closeBtn.setAttribute('aria-label', 'Close journal');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Create the tab navigation.
   */
  private createTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.className = 'da-story-journal-tabs';
    tabs.setAttribute('role', 'tablist');

    const progressTab = this.createTab('progress', 'Progress');
    const choicesTab = this.createTab('choices', 'Choices');
    const discoveriesTab = this.createTab('discoveries', 'Discoveries');

    tabs.appendChild(progressTab);
    tabs.appendChild(choicesTab);
    tabs.appendChild(discoveriesTab);

    return tabs;
  }

  /**
   * Create a single tab button.
   */
  private createTab(id: string, label: string): HTMLElement {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'da-story-journal-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(this.activeTab === id));
    if (this.activeTab === id) {
      tab.classList.add('da-story-journal-tab--active');
    }
    tab.textContent = label;
    tab.addEventListener('click', () => {
      this.activeTab = id as 'progress' | 'choices' | 'discoveries';
      this.updateTabs();
      const content = this.element?.querySelector('.da-story-journal-content');
      if (content) {
        this.renderTabContent(content as HTMLElement);
      }
    });

    return tab;
  }

  /**
   * Update tab active states.
   */
  private updateTabs(): void {
    const tabs = this.element?.querySelectorAll('.da-story-journal-tab');
    if (!tabs) return;

    const tabIds = ['progress', 'choices', 'discoveries'];
    tabs.forEach((tab, index) => {
      const isActive = tabIds[index] === this.activeTab;
      tab.classList.toggle('da-story-journal-tab--active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
  }

  /**
   * Render content for the active tab.
   */
  private renderTabContent(container: HTMLElement): void {
    // Clear existing content
    container.textContent = '';

    switch (this.activeTab) {
      case 'progress':
        this.renderProgressTab(container);
        break;
      case 'choices':
        this.renderChoicesTab(container);
        break;
      case 'discoveries':
        this.renderDiscoveriesTab(container);
        break;
    }
  }

  /**
   * Render the progress tab content.
   */
  private renderProgressTab(container: HTMLElement): void {
    const progress = this.data?.progress;

    if (!progress) {
      const empty = document.createElement('p');
      empty.className = 'da-story-journal-empty';
      empty.textContent = 'No progress recorded yet.';
      container.appendChild(empty);
      return;
    }

    // Summary section
    const summary = document.createElement('div');
    summary.className = 'da-story-journal-summary';

    const summaryTitle = document.createElement('h3');
    summaryTitle.textContent = 'Current Position';
    summary.appendChild(summaryTitle);

    const position = document.createElement('div');
    position.className = 'da-story-journal-position';

    const actInfo = this.getActInfo(progress.position.actNumber);
    const positionText = document.createElement('p');
    positionText.innerHTML = `<strong>Act ${progress.position.actNumber}:</strong> ${actInfo?.title ?? 'Unknown'}`;
    position.appendChild(positionText);

    const chapterText = document.createElement('p');
    chapterText.textContent = `Chapter ${progress.position.chapterNumber}`;
    position.appendChild(chapterText);

    if (actInfo) {
      const eraText = document.createElement('p');
      eraText.className = 'da-story-journal-era';
      eraText.textContent = actInfo.era;
      position.appendChild(eraText);
    }

    summary.appendChild(position);

    // Stats
    const stats = document.createElement('div');
    stats.className = 'da-story-journal-stats';

    const statsTitle = document.createElement('h3');
    statsTitle.textContent = 'Journey Stats';
    stats.appendChild(statsTitle);

    const statsList = document.createElement('ul');
    statsList.className = 'da-story-journal-stats-list';

    const scenesVisited = this.data?.sceneHistory?.length ?? 0;
    const choicesMade = progress.choices.length;
    const discoveriesCount = progress.discoveredItems.length;

    const statItems = [
      { label: 'Scenes Visited', value: scenesVisited + 1 }, // +1 for current
      { label: 'Choices Made', value: choicesMade },
      { label: 'Discoveries', value: discoveriesCount },
      { label: 'Time Started', value: this.formatDate(progress.startedAt) },
      { label: 'Last Played', value: this.formatDate(progress.lastPlayedAt) },
    ];

    for (const stat of statItems) {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'da-story-journal-stat-label';
      label.textContent = stat.label;
      const value = document.createElement('span');
      value.className = 'da-story-journal-stat-value';
      value.textContent = String(stat.value);
      li.appendChild(label);
      li.appendChild(value);
      statsList.appendChild(li);
    }

    stats.appendChild(statsList);

    container.appendChild(summary);
    container.appendChild(stats);
  }

  /**
   * Render the choices tab content.
   */
  private renderChoicesTab(container: HTMLElement): void {
    const choices = this.data?.progress?.choices ?? [];

    if (choices.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'da-story-journal-empty';
      empty.textContent = 'No choices made yet. Your decisions will be recorded here.';
      container.appendChild(empty);
      return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Your Choices';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'da-story-journal-choices-list';

    // Show choices in reverse chronological order
    const sortedChoices = [...choices].reverse();

    for (const choice of sortedChoices) {
      const item = this.createChoiceItem(choice);
      list.appendChild(item);
    }

    container.appendChild(list);
  }

  /**
   * Create a choice list item.
   */
  private createChoiceItem(choice: StoryChoice): HTMLElement {
    const item = document.createElement('li');
    item.className = 'da-story-journal-choice-item';

    const choiceId = document.createElement('span');
    choiceId.className = 'da-story-journal-choice-id';
    choiceId.textContent = choice.choiceId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const sceneInfo = document.createElement('span');
    sceneInfo.className = 'da-story-journal-choice-scene';
    sceneInfo.textContent = `Scene: ${choice.sceneId}`;

    const timestamp = document.createElement('span');
    timestamp.className = 'da-story-journal-choice-time';
    timestamp.textContent = this.formatDate(choice.timestamp);

    item.appendChild(choiceId);
    item.appendChild(sceneInfo);
    item.appendChild(timestamp);

    return item;
  }

  /**
   * Render the discoveries tab content.
   */
  private renderDiscoveriesTab(container: HTMLElement): void {
    const discoveries = this.data?.progress?.discoveredItems ?? [];

    if (discoveries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'da-story-journal-empty';
      empty.textContent = 'No discoveries yet. Explore the story to uncover secrets!';
      container.appendChild(empty);
      return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Your Discoveries';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'da-story-journal-discoveries-grid';

    for (const item of discoveries) {
      const card = this.createDiscoveryCard(item);
      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  /**
   * Create a discovery card.
   */
  private createDiscoveryCard(itemId: string): HTMLElement {
    const card = document.createElement('div');
    card.className = 'da-story-journal-discovery-card';

    const icon = document.createElement('span');
    icon.className = 'da-story-journal-discovery-icon';
    icon.textContent = '\uD83D\uDD2C'; // microscope emoji

    const name = document.createElement('span');
    name.className = 'da-story-journal-discovery-name';
    // Format the item ID as a readable name
    name.textContent = itemId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    card.appendChild(icon);
    card.appendChild(name);

    return card;
  }

  /**
   * Get act info by number.
   */
  private getActInfo(actNumber: number): StoryAct | undefined {
    return this.data?.acts.find(a => a.number === actNumber);
  }

  /**
   * Format a timestamp as a readable date.
   */
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Set up event listeners for keyboard and click handling.
   */
  private setupEventListeners(): void {
    // Escape key to close
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this.handleKeyDown);

    // Click on backdrop to close
    this.handleBackdropClick = (e: MouseEvent) => {
      if (e.target === this.backdropElement) {
        this.close();
      }
    };
    this.backdropElement?.addEventListener('click', this.handleBackdropClick);
  }

  /**
   * Remove event listeners.
   */
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

  /**
   * Destroy the journal and clean up resources.
   */
  destroy(): void {
    this.close();
    this.callbacks = null;
    this.data = null;
  }
}
