// src/story/StoryBrowser.ts
// Modal browser for navigating story acts and chapters
// Story Navigation: Phase 2 - Add act/chapter picker browser

import type { StoryAct, StoryChapter, StoryScene } from './content-types';
import type { StoryProgress } from './StoryState';

/**
 * Callback interface for StoryBrowser events.
 */
export interface StoryBrowserCallbacks {
  /** Called when user selects a scene to navigate to */
  onSceneSelect: (sceneId: string) => void;
  /** Called when the browser is closed */
  onClose: () => void;
}

/**
 * Data needed to display the browser.
 */
export interface StoryBrowserData {
  /** All acts with chapters and scenes */
  acts: StoryAct[];
  /** Current progress for highlighting */
  progress: StoryProgress | null;
  /** Set of visited scene IDs */
  visitedScenes?: Set<string>;
}

/**
 * StoryBrowser provides a modal overlay for navigating through all
 * acts and chapters in the story. Users can:
 * - See all 11 acts with their titles and eras
 * - Expand acts to see chapters
 * - Expand chapters to see scenes
 * - Jump to any visited scene
 * - See current position highlighted
 *
 * Layout:
 * - Full-screen backdrop with semi-transparent overlay
 * - Centered modal with scrollable content
 * - Collapsible act sections
 */
export class StoryBrowser {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private callbacks: StoryBrowserCallbacks | null = null;
  private data: StoryBrowserData | null = null;
  private expandedActs: Set<number> = new Set();
  private expandedChapters: Set<string> = new Set();

  // Event handlers for cleanup
  private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private handleBackdropClick: ((e: MouseEvent) => void) | null = null;

  /**
   * Set the callbacks for browser events.
   */
  setCallbacks(callbacks: StoryBrowserCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Open the browser modal with the given data.
   */
  open(data: StoryBrowserData): void {
    this.data = data;

    // Expand current act by default
    if (data.progress) {
      this.expandedActs.add(data.progress.position.actNumber);
      this.expandedChapters.add(`${data.progress.position.actNumber}-${data.progress.position.chapterNumber}`);
    }

    this.render();
    this.setupEventListeners();

    // Focus the modal for keyboard navigation
    this.element?.focus();
  }

  /**
   * Close the browser modal.
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
   * Check if the browser is currently open.
   */
  isOpen(): boolean {
    return this.backdropElement !== null;
  }

  /**
   * Render the browser modal.
   */
  private render(): void {
    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-story-browser-backdrop';
    this.backdropElement.setAttribute('role', 'dialog');
    this.backdropElement.setAttribute('aria-modal', 'true');
    this.backdropElement.setAttribute('aria-label', 'Story browser');

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'da-story-browser';
    modal.setAttribute('tabindex', '-1');
    this.element = modal;

    // Header
    const header = this.createHeader();
    modal.appendChild(header);

    // Content - acts list
    const content = document.createElement('div');
    content.className = 'da-story-browser-content';

    if (this.data) {
      for (const act of this.data.acts) {
        const actSection = this.createActSection(act);
        content.appendChild(actSection);
      }
    }

    modal.appendChild(content);
    this.backdropElement.appendChild(modal);
    document.body.appendChild(this.backdropElement);
  }

  /**
   * Create the modal header.
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-story-browser-header';

    const title = document.createElement('h2');
    title.className = 'da-story-browser-title';
    title.textContent = 'Story Navigator';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'da-story-browser-close';
    closeBtn.setAttribute('aria-label', 'Close story browser');
    closeBtn.textContent = '\u00D7'; // × character
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Create an act section with expandable chapters.
   */
  private createActSection(act: StoryAct): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-story-browser-act';

    const isExpanded = this.expandedActs.has(act.number);
    const isCurrent = this.data?.progress?.position.actNumber === act.number;

    // Act header (clickable to expand/collapse)
    const actHeader = document.createElement('button');
    actHeader.type = 'button';
    actHeader.className = 'da-story-browser-act-header';
    if (isCurrent) {
      actHeader.classList.add('da-story-browser-act-header--current');
    }
    actHeader.setAttribute('aria-expanded', String(isExpanded));

    const actIcon = document.createElement('span');
    actIcon.className = 'da-story-browser-act-icon';
    actIcon.textContent = isExpanded ? '\u25BC' : '\u25B6'; // ▼ or ▶

    const actInfo = document.createElement('span');
    actInfo.className = 'da-story-browser-act-info';

    const actNumber = document.createElement('span');
    actNumber.className = 'da-story-browser-act-number';
    actNumber.textContent = `Act ${act.number}`;

    const actTitle = document.createElement('span');
    actTitle.className = 'da-story-browser-act-title';
    actTitle.textContent = act.title;

    actInfo.appendChild(actNumber);
    actInfo.appendChild(actTitle);

    const actEra = document.createElement('span');
    actEra.className = 'da-story-browser-act-era';
    actEra.textContent = act.era;

    if (isCurrent) {
      const currentBadge = document.createElement('span');
      currentBadge.className = 'da-story-browser-current-badge';
      currentBadge.textContent = 'Current';
      actHeader.appendChild(currentBadge);
    }

    actHeader.appendChild(actIcon);
    actHeader.appendChild(actInfo);
    actHeader.appendChild(actEra);

    actHeader.addEventListener('click', () => {
      this.toggleAct(act.number, section, actHeader, actIcon);
    });

    section.appendChild(actHeader);

    // Chapters container (collapsible)
    const chaptersContainer = document.createElement('div');
    chaptersContainer.className = 'da-story-browser-chapters';
    if (!isExpanded) {
      chaptersContainer.classList.add('da-story-browser-chapters--collapsed');
    }

    for (const chapter of act.chapters) {
      const chapterSection = this.createChapterSection(act, chapter);
      chaptersContainer.appendChild(chapterSection);
    }

    section.appendChild(chaptersContainer);

    return section;
  }

  /**
   * Create a chapter section with scenes.
   */
  private createChapterSection(act: StoryAct, chapter: StoryChapter): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-story-browser-chapter';

    const chapterKey = `${act.number}-${chapter.number}`;
    const isExpanded = this.expandedChapters.has(chapterKey);
    const isCurrent = this.data?.progress?.position.actNumber === act.number &&
      this.data?.progress?.position.chapterNumber === chapter.number;

    // Chapter header
    const chapterHeader = document.createElement('button');
    chapterHeader.type = 'button';
    chapterHeader.className = 'da-story-browser-chapter-header';
    if (isCurrent) {
      chapterHeader.classList.add('da-story-browser-chapter-header--current');
    }
    chapterHeader.setAttribute('aria-expanded', String(isExpanded));

    const chapterIcon = document.createElement('span');
    chapterIcon.className = 'da-story-browser-chapter-icon';
    chapterIcon.textContent = isExpanded ? '\u25BC' : '\u25B6';

    const chapterInfo = document.createElement('span');
    chapterInfo.className = 'da-story-browser-chapter-info';

    const chapterNumber = document.createElement('span');
    chapterNumber.className = 'da-story-browser-chapter-number';
    chapterNumber.textContent = `Ch ${chapter.number}:`;

    const chapterTitle = document.createElement('span');
    chapterTitle.className = 'da-story-browser-chapter-title';
    chapterTitle.textContent = chapter.title;

    chapterInfo.appendChild(chapterNumber);
    chapterInfo.appendChild(chapterTitle);

    const chapterYear = document.createElement('span');
    chapterYear.className = 'da-story-browser-chapter-year';
    chapterYear.textContent = chapter.year;

    const sceneCount = document.createElement('span');
    sceneCount.className = 'da-story-browser-scene-count';
    sceneCount.textContent = `${chapter.scenes.length} scenes`;

    chapterHeader.appendChild(chapterIcon);
    chapterHeader.appendChild(chapterInfo);
    chapterHeader.appendChild(chapterYear);
    chapterHeader.appendChild(sceneCount);

    chapterHeader.addEventListener('click', () => {
      this.toggleChapter(chapterKey, section, chapterHeader, chapterIcon);
    });

    section.appendChild(chapterHeader);

    // Scenes container (collapsible)
    const scenesContainer = document.createElement('div');
    scenesContainer.className = 'da-story-browser-scenes';
    if (!isExpanded) {
      scenesContainer.classList.add('da-story-browser-scenes--collapsed');
    }

    for (let i = 0; i < chapter.scenes.length; i++) {
      const scene = chapter.scenes[i];
      const sceneItem = this.createSceneItem(scene, i + 1);
      scenesContainer.appendChild(sceneItem);
    }

    section.appendChild(scenesContainer);

    return section;
  }

  /**
   * Create a scene item (clickable to navigate).
   */
  private createSceneItem(scene: StoryScene, sceneNumber: number): HTMLElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'da-story-browser-scene';

    const isCurrent = this.data?.progress?.position.sceneId === scene.id;
    const isVisited = this.data?.visitedScenes?.has(scene.id) ?? false;

    if (isCurrent) {
      item.classList.add('da-story-browser-scene--current');
    }
    if (isVisited) {
      item.classList.add('da-story-browser-scene--visited');
    }

    const sceneIcon = document.createElement('span');
    sceneIcon.className = 'da-story-browser-scene-icon';
    if (isCurrent) {
      sceneIcon.textContent = '\u25B6'; // ▶ current
    } else if (isVisited) {
      sceneIcon.textContent = '\u2713'; // ✓ visited
    } else {
      sceneIcon.textContent = '\u25CB'; // ○ not visited
    }

    const sceneLabel = document.createElement('span');
    sceneLabel.className = 'da-story-browser-scene-label';
    sceneLabel.textContent = `Scene ${sceneNumber}`;

    const sceneType = document.createElement('span');
    sceneType.className = 'da-story-browser-scene-type';
    sceneType.textContent = this.formatSceneType(scene.type);

    item.appendChild(sceneIcon);
    item.appendChild(sceneLabel);
    item.appendChild(sceneType);

    item.addEventListener('click', () => {
      this.callbacks?.onSceneSelect(scene.id);
      this.close();
    });

    return item;
  }

  /**
   * Format scene type for display.
   */
  private formatSceneType(type: string): string {
    const typeMap: Record<string, string> = {
      narrative: 'Story',
      dialogue: 'Dialogue',
      choice: 'Choice',
      challenge: 'Challenge',
    };
    return typeMap[type] ?? type;
  }

  /**
   * Toggle act expanded state.
   */
  private toggleAct(
    actNumber: number,
    section: HTMLElement,
    header: HTMLElement,
    icon: HTMLElement
  ): void {
    const chaptersContainer = section.querySelector('.da-story-browser-chapters');
    if (!chaptersContainer) return;

    const isExpanded = this.expandedActs.has(actNumber);

    if (isExpanded) {
      this.expandedActs.delete(actNumber);
      chaptersContainer.classList.add('da-story-browser-chapters--collapsed');
      header.setAttribute('aria-expanded', 'false');
      icon.textContent = '\u25B6'; // ▶
    } else {
      this.expandedActs.add(actNumber);
      chaptersContainer.classList.remove('da-story-browser-chapters--collapsed');
      header.setAttribute('aria-expanded', 'true');
      icon.textContent = '\u25BC'; // ▼
    }
  }

  /**
   * Toggle chapter expanded state.
   */
  private toggleChapter(
    chapterKey: string,
    section: HTMLElement,
    header: HTMLElement,
    icon: HTMLElement
  ): void {
    const scenesContainer = section.querySelector('.da-story-browser-scenes');
    if (!scenesContainer) return;

    const isExpanded = this.expandedChapters.has(chapterKey);

    if (isExpanded) {
      this.expandedChapters.delete(chapterKey);
      scenesContainer.classList.add('da-story-browser-scenes--collapsed');
      header.setAttribute('aria-expanded', 'false');
      icon.textContent = '\u25B6'; // ▶
    } else {
      this.expandedChapters.add(chapterKey);
      scenesContainer.classList.remove('da-story-browser-scenes--collapsed');
      header.setAttribute('aria-expanded', 'true');
      icon.textContent = '\u25BC'; // ▼
    }
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
   * Destroy the browser and clean up resources.
   */
  destroy(): void {
    this.close();
    this.callbacks = null;
    this.data = null;
    this.expandedActs.clear();
    this.expandedChapters.clear();
  }
}
