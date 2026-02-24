// src/progress/JourneyMap.ts
// Journey map modal UI component
// Story 19.4: Create Progress Visualization
// Extended: Tabbed interface with Timeline, World Map, and Artifacts tabs

import type { JourneyMapData, JourneyNode } from './types';
import type { CollectibleProfile } from './collectible-types';
import { DEFAULT_COLLECTIBLE_PROFILE } from './collectible-types';
import { WorldMapView } from './WorldMapView';
import { ArtifactGallery } from './ArtifactGallery';
import type { StoryAct } from '@story/content-types';
import { formatSceneType } from '@story/scene-utils';

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 300;

/** Tab identifiers */
export type JourneyMapTab = 'timeline' | 'world-map' | 'artifacts';

/**
 * Options for the extended show() method.
 */
export interface JourneyMapShowOptions {
  journeyData: JourneyMapData;
  collectibleProfile: CollectibleProfile;
  currentActNumber: number;
  onNavigate: (actNumber: number) => void;
  onPinLocation: (locationId: string) => void;
  onUnpinLocation: (locationId: string) => void;
  onCollectArtifact: (artifactId: string) => void;
  initialTab?: JourneyMapTab;
  highlightedLocationId?: string;
  highlightedArtifactId?: string;
  /** Story 26.6: Story acts for timeline hover preview */
  storyActs?: StoryAct[];
  /** Story 26.6: Visited scenes for preview indicators */
  visitedScenes?: Set<string>;
  /** Story 26.6: Current scene ID for preview highlighting */
  currentSceneId?: string;
  /** Story 26.6: Navigate to a specific scene */
  onSceneNavigate?: (sceneId: string) => void;
  /** Story 26.7: Current branch label (null = golden path) */
  activeBranchLabel?: string | null;
  /** Story 26.7: Set of act numbers containing active branch points */
  branchActNumbers?: Set<number>;
  /** Story 26.7: Map of sceneId → branch label for scenes where user took a branch */
  takenBranches?: Map<string, string>;
}

/**
 * Journey map modal component.
 * Displays a full-screen modal with tabs: Timeline, World Map, and Artifacts.
 * The Timeline tab shows a horizontal timeline of all 11 acts.
 * The World Map tab shows an interactive SVG world map with location pins.
 * The Artifacts tab shows a collectible card gallery.
 *
 * NOTE: This file is 1,051 lines and a candidate for refactoring.
 * Recommended split: extract timeline rendering into JourneyTimelineTab.ts,
 * keeping this class as a lightweight modal/tab shell.
 *
 * Section guide:
 *  - Lines ~57-297:   Modal lifecycle (mount, show, hide, destroy)
 *  - Lines ~299-356:  Tab bar creation and switching
 *  - Lines ~358-530:  Timeline tab rendering (nodes, labels, branch indicators)
 *  - Lines ~530-570:  Preview tooltip management
 *  - Lines ~570-950:  Era detail view, preview rendering, branch navigation
 *  - Lines ~950-1051: Cleanup helpers (removeOverlay, restoreFocus, child components)
 */
export class JourneyMap {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;
  private onNavigate: ((actNumber: number) => void) | null = null;

  // Story 26.6: Timeline preview data
  private storyActs: StoryAct[] | null = null;
  private visitedScenes: Set<string> | null = null;
  private currentSceneId: string | null = null;
  private onSceneNavigate: ((sceneId: string) => void) | null = null;
  private activePreview: HTMLElement | null = null;

  // Story 26.7: Active branch tracking
  private activeBranchLabel: string | null = null;
  private branchActNumbers: Set<number> | null = null;
  private takenBranches: Map<string, string> | null = null;

  // Tab state
  private activeTab: JourneyMapTab = 'timeline';
  private tabPanels: Map<JourneyMapTab, HTMLElement> = new Map();
  private tabButtons: Map<JourneyMapTab, HTMLElement> = new Map();

  // Story 26.11: Era detail view
  private eraDetailView: HTMLElement | null = null;

  // Child components
  private worldMapView: WorldMapView | null = null;
  private artifactGallery: ArtifactGallery | null = null;

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the journey map component to a parent element.
   * Safe to call multiple times — destroys previous instance first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = parent;
  }

  /**
   * Show the journey map modal — extended version with tabs.
   * Accepts an options object with collectible data and callbacks.
   */
  show(dataOrOptions: JourneyMapData | JourneyMapShowOptions, onNavigate?: (actNumber: number) => void): void {
    // Backward compatibility: detect old 2-arg signature
    if (onNavigate !== undefined || !('journeyData' in dataOrOptions)) {
      const data = dataOrOptions as JourneyMapData;
      this.showWithOptions({
        journeyData: data,
        collectibleProfile: DEFAULT_COLLECTIBLE_PROFILE,
        currentActNumber: data.currentActNumber,
        onNavigate: onNavigate ?? (() => {}),
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
      });
      return;
    }

    this.showWithOptions(dataOrOptions as JourneyMapShowOptions);
  }

  private showWithOptions(options: JourneyMapShowOptions): void {
    if (!this.container) return;

    // Save currently focused element for restoration after close
    this.previouslyFocusedElement = document.activeElement;
    this.onNavigate = options.onNavigate;
    this.activeTab = options.initialTab ?? 'timeline';

    // Story 26.6: Store preview data for timeline hover
    this.storyActs = options.storyActs ?? null;
    this.visitedScenes = options.visitedScenes ?? null;
    this.currentSceneId = options.currentSceneId ?? null;
    this.onSceneNavigate = options.onSceneNavigate ?? null;

    // Story 26.7: Active branch label and branch data
    this.activeBranchLabel = options.activeBranchLabel ?? null;
    this.branchActNumbers = options.branchActNumbers ?? null;
    this.takenBranches = options.takenBranches ?? null;

    // Clean up any existing overlay
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.className = 'da-journey-map da-journey-map--entering';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-journey-map__backdrop';
    backdrop.addEventListener('click', () => {
      this.hide();
    });

    // Content area
    const content = document.createElement('div');
    content.className = 'da-journey-map__content';

    // Header
    const header = document.createElement('div');
    header.className = 'da-journey-map__header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'da-journey-map__title';
    titleEl.id = 'da-journey-map-title';
    titleEl.textContent = 'Journey Map';
    this.overlay.setAttribute('aria-labelledby', titleEl.id);

    const counterEl = document.createElement('span');
    counterEl.className = 'da-journey-map__counter';
    counterEl.textContent = `${options.journeyData.completedCount} / ${options.journeyData.totalActs} Complete`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-journey-map__close';
    closeBtn.textContent = '\u{2715}';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close journey map');
    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(titleEl);
    header.appendChild(counterEl);
    header.appendChild(closeBtn);

    // Tab bar
    const tabBar = this.createTabBar();

    // Tab panels
    const panelsContainer = document.createElement('div');
    panelsContainer.className = 'da-journey-map__panels';

    // Timeline panel
    const timelinePanel = this.renderTimelinePanel(options.journeyData);
    this.tabPanels.set('timeline', timelinePanel);
    panelsContainer.appendChild(timelinePanel);

    // World Map panel
    const worldMapPanel = this.renderWorldMapPanel(options);
    this.tabPanels.set('world-map', worldMapPanel);
    panelsContainer.appendChild(worldMapPanel);

    // Artifacts panel
    const artifactsPanel = this.renderArtifactsPanel(options);
    this.tabPanels.set('artifacts', artifactsPanel);
    panelsContainer.appendChild(artifactsPanel);

    // Set initial tab visibility
    this.updateTabVisibility();

    content.appendChild(header);
    content.appendChild(tabBar);
    content.appendChild(panelsContainer);

    this.overlay.appendChild(backdrop);
    this.overlay.appendChild(content);

    this.container.appendChild(this.overlay);

    // Add keyboard listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Focus the close button
    requestAnimationFrame(() => {
      closeBtn.focus();
    });

    // Remove entering class after animation triggers
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.remove('da-journey-map--entering');
        }
      });
    });

    // Scroll timeline to show current node (if on timeline tab)
    if (this.activeTab === 'timeline') {
      requestAnimationFrame(() => {
        const currentNode = timelinePanel.querySelector('.da-journey-map__node--current');
        if (currentNode && typeof (currentNode as HTMLElement).scrollIntoView === 'function') {
          (currentNode as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }
  }

  /**
   * Dismiss the journey map with exit animation.
   */
  hide(): void {
    if (!this.overlay) return;

    // Guard against double-invocation race
    if (this.exitTimeout !== null) return;

    this.overlay.classList.add('da-journey-map--exiting');

    this.exitTimeout = setTimeout(() => {
      this.removeOverlay();
      this.restoreFocus();
    }, EXIT_DURATION_MS);
  }

  /**
   * Clean up all resources: pending timeouts, DOM elements, event listeners.
   */
  destroy(): void {
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    this.dismissPreview();
    if (this.eraDetailView) {
      this.hideEraDetail();
    }
    this.removeOverlay();
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.container = null;
    this.onNavigate = null;
    this.storyActs = null;
    this.visitedScenes = null;
    this.currentSceneId = null;
    this.onSceneNavigate = null;
    this.activeBranchLabel = null;
    this.branchActNumbers = null;
    this.takenBranches = null;
  }

  // =========================================================================
  // Tab bar
  // =========================================================================

  private createTabBar(): HTMLElement {
    const tabBar = document.createElement('div');
    tabBar.className = 'da-journey-map__tabs';
    tabBar.setAttribute('role', 'tablist');

    const tabs: { id: JourneyMapTab; label: string; icon: string }[] = [
      { id: 'timeline', label: 'Timeline', icon: '\u{1F4C5}' },
      { id: 'world-map', label: 'World Map', icon: '\u{1F5FA}' },
      { id: 'artifacts', label: 'Artifacts', icon: '\u{1F3C6}' },
    ];

    for (const tab of tabs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'da-journey-map__tab';
      if (tab.id === this.activeTab) {
        btn.classList.add('da-journey-map__tab--active');
      }
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(tab.id === this.activeTab));
      btn.setAttribute('aria-controls', `da-journey-map-panel-${tab.id}`);
      btn.dataset.tab = tab.id;
      btn.textContent = `${tab.icon} ${tab.label}`;
      btn.addEventListener('click', () => {
        this.switchTab(tab.id);
      });
      this.tabButtons.set(tab.id, btn);
      tabBar.appendChild(btn);
    }

    return tabBar;
  }

  private switchTab(tab: JourneyMapTab): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    this.updateTabVisibility();
  }

  private updateTabVisibility(): void {
    for (const [tabId, panel] of this.tabPanels) {
      if (tabId === this.activeTab) {
        panel.classList.remove('da-journey-map__panel--hidden');
        panel.setAttribute('aria-hidden', 'false');
      } else {
        panel.classList.add('da-journey-map__panel--hidden');
        panel.setAttribute('aria-hidden', 'true');
      }
    }
    for (const [tabId, btn] of this.tabButtons) {
      if (tabId === this.activeTab) {
        btn.classList.add('da-journey-map__tab--active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('da-journey-map__tab--active');
        btn.setAttribute('aria-selected', 'false');
      }
    }
  }

  // =========================================================================
  // Timeline panel (extracted from original show())
  // =========================================================================

  private renderTimelinePanel(data: JourneyMapData): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-journey-map__panel';
    panel.id = 'da-journey-map-panel-timeline';
    panel.setAttribute('role', 'tabpanel');

    // Story 26.6: "Golden Path" label above the timeline
    // Story 26.7: Show active branch badge when on alternate timeline
    const pathLabel = document.createElement('div');
    pathLabel.className = 'da-journey-map__golden-path-label';
    if (this.activeBranchLabel) {
      pathLabel.textContent = 'The Golden Path';
      const branchBadge = document.createElement('span');
      branchBadge.className = 'da-journey-map__branch-badge';
      branchBadge.textContent = `\u2192 ${this.activeBranchLabel}`;
      pathLabel.appendChild(branchBadge);
    } else {
      pathLabel.textContent = 'The Golden Path';
    }
    panel.appendChild(pathLabel);

    const timeline = document.createElement('div');
    timeline.className = 'da-journey-map__timeline';

    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i];

      // Add connector before each node except the first
      if (i > 0) {
        const prevNode = data.nodes[i - 1];
        const connector = this.createConnector(prevNode, node);
        timeline.appendChild(connector);
      }

      const nodeEl = this.createNode(node);
      timeline.appendChild(nodeEl);
    }

    // Story 26.6: Dismiss active preview when clicking timeline background
    timeline.addEventListener('click', (e) => {
      if (e.target === timeline) this.dismissPreview();
    });

    panel.appendChild(timeline);
    return panel;
  }

  // =========================================================================
  // World Map panel
  // =========================================================================

  private renderWorldMapPanel(options: JourneyMapShowOptions): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-journey-map__panel';
    panel.id = 'da-journey-map-panel-world-map';
    panel.setAttribute('role', 'tabpanel');

    this.worldMapView = new WorldMapView();
    this.worldMapView.mount(panel);
    this.worldMapView.setCallbacks({
      onPinLocation: (locationId) => options.onPinLocation(locationId),
      onUnpinLocation: (locationId) => options.onUnpinLocation(locationId),
    });
    this.worldMapView.update(
      options.currentActNumber,
      options.collectibleProfile,
      options.highlightedLocationId,
    );

    return panel;
  }

  // =========================================================================
  // Artifacts panel
  // =========================================================================

  private renderArtifactsPanel(options: JourneyMapShowOptions): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-journey-map__panel';
    panel.id = 'da-journey-map-panel-artifacts';
    panel.setAttribute('role', 'tabpanel');

    this.artifactGallery = new ArtifactGallery();
    this.artifactGallery.mount(panel);
    this.artifactGallery.setCallbacks({
      onCollectArtifact: (artifactId) => options.onCollectArtifact(artifactId),
    });
    this.artifactGallery.update(
      options.currentActNumber,
      options.collectibleProfile,
      options.highlightedArtifactId,
    );

    return panel;
  }

  // =========================================================================
  // Node/connector helpers (unchanged from original)
  // =========================================================================

  private createNode(node: JourneyNode): HTMLElement {
    const el = document.createElement('div');
    el.dataset.actNumber = String(node.actNumber);
    el.className = `da-journey-map__node da-journey-map__node--${node.status}`;

    // Story 26.13: All nodes are navigable ("open doors" philosophy)
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    const statusHint = node.status === 'locked' || node.status === 'upcoming'
      ? ' (not yet visited)' : '';
    el.setAttribute('aria-label', `Navigate to ${node.title} (${node.era})${statusHint}`);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePreview(node, el);
    });
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.togglePreview(node, el);
      }
    });

    // Icon
    const iconEl = document.createElement('div');
    iconEl.className = 'da-journey-map__node-icon';
    iconEl.textContent = node.icon;

    // Checkmark overlay for completed
    if (node.status === 'completed') {
      const checkEl = document.createElement('span');
      checkEl.className = 'da-journey-map__node-check';
      checkEl.textContent = '\u{2713}';
      iconEl.appendChild(checkEl);
    }

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'da-journey-map__node-title';
    titleEl.textContent = node.title;

    // Era
    const eraEl = document.createElement('div');
    eraEl.className = 'da-journey-map__node-era';
    eraEl.textContent = node.era;

    el.appendChild(iconEl);
    el.appendChild(titleEl);
    el.appendChild(eraEl);

    // Story 26.7: Branch indicator for acts with branch points
    if (this.branchActNumbers?.has(node.actNumber)) {
      const branchIndicator = document.createElement('div');
      branchIndicator.className = 'da-journey-map__branch-indicator';
      branchIndicator.textContent = '\u2B95'; // ⮕ fork arrow
      branchIndicator.setAttribute('aria-label', 'Contains alternate timeline branch');
      el.appendChild(branchIndicator);
    }

    return el;
  }

  // =========================================================================
  // Story 26.6: Timeline hover preview
  // =========================================================================

  /**
   * Toggle the scene preview tooltip on a timeline node.
   */
  private togglePreview(node: JourneyNode, nodeEl: HTMLElement): void {
    // If clicking the same node that has an active preview, dismiss and navigate
    if (this.activePreview && nodeEl.contains(this.activePreview)) {
      this.onNavigate?.(node.actNumber);
      this.hide();
      return;
    }

    this.dismissPreview();

    const act = this.storyActs?.find(a => a.number === node.actNumber);
    if (!act) {
      // No story data — fall back to direct navigation
      this.onNavigate?.(node.actNumber);
      this.hide();
      return;
    }

    const preview = this.createPreview(act, node);
    nodeEl.appendChild(preview);
    this.activePreview = preview;
  }

  /**
   * Dismiss the active preview tooltip.
   */
  private dismissPreview(): void {
    if (this.activePreview) {
      this.activePreview.remove();
      this.activePreview = null;
    }
  }

  /**
   * Create a preview tooltip showing chapters, scenes, figures, and inventions.
   * Story 26.11: Enhanced with key figures, inventions pills, and era detail button.
   */
  private createPreview(act: StoryAct, node?: JourneyNode): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'da-journey-map__preview';
    preview.setAttribute('role', 'region');
    preview.setAttribute('aria-label', `Preview of Act ${act.number}: ${act.title}`);

    // "Go to Act" header with navigate button
    const header = document.createElement('div');
    header.className = 'da-journey-map__preview-header';

    const headerTitle = document.createElement('span');
    headerTitle.className = 'da-journey-map__preview-title';
    headerTitle.textContent = `Act ${act.number}: ${act.title}`;

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'da-journey-map__preview-go';
    goBtn.textContent = 'Go \u2192';
    goBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onNavigate?.(act.number);
      this.hide();
    });

    header.appendChild(headerTitle);
    header.appendChild(goBtn);
    preview.appendChild(header);

    // Story 26.13: Skip ahead warning for locked/upcoming nodes
    if (node && (node.status === 'locked' || node.status === 'upcoming')) {
      const skipWarning = document.createElement('div');
      skipWarning.className = 'da-journey-map__preview-skip-warning';
      skipWarning.textContent = 'Jumping here will skip earlier content. You can always return later.';
      preview.appendChild(skipWarning);
    }

    // Scene type icons
    const typeIcons: Record<string, string> = {
      narrative: '\u{1F4D6}', // 📖
      dialogue: '\u{1F4AC}',  // 💬
      choice: '\u{2194}',     // ↔
      challenge: '\u{1F3AF}', // 🎯
      decision: '\u{2696}',   // ⚖
      builder: '\u{1F527}',   // 🔧
    };

    // Chapters and scenes
    for (const chapter of act.chapters) {
      const chapterEl = document.createElement('div');
      chapterEl.className = 'da-journey-map__preview-chapter';

      const chapterTitle = document.createElement('div');
      chapterTitle.className = 'da-journey-map__preview-chapter-title';
      chapterTitle.textContent = `Ch ${chapter.number}: ${chapter.title}`;
      chapterEl.appendChild(chapterTitle);

      const sceneList = document.createElement('div');
      sceneList.className = 'da-journey-map__preview-scenes';

      for (const scene of chapter.scenes) {
        const sceneEl = document.createElement('button');
        sceneEl.type = 'button';
        sceneEl.className = 'da-journey-map__preview-scene';

        const isCurrent = this.currentSceneId === scene.id;
        const isVisited = this.visitedScenes?.has(scene.id) ?? false;

        if (isCurrent) sceneEl.classList.add('da-journey-map__preview-scene--current');
        if (isVisited) sceneEl.classList.add('da-journey-map__preview-scene--visited');
        if (scene.type === 'choice') sceneEl.classList.add('da-journey-map__preview-scene--branch');

        // Story 26.7: Check if user took a branch from this scene
        const branchLabel = this.takenBranches?.get(scene.id);
        if (branchLabel) sceneEl.classList.add('da-journey-map__preview-scene--branched');

        const typeIcon = document.createElement('span');
        typeIcon.className = 'da-journey-map__preview-scene-icon';
        typeIcon.textContent = typeIcons[scene.type] ?? '\u25CB'; // ○

        const sceneLabel = document.createElement('span');
        sceneLabel.className = 'da-journey-map__preview-scene-label';
        sceneLabel.textContent = formatSceneType(scene.type);

        sceneEl.appendChild(typeIcon);
        sceneEl.appendChild(sceneLabel);

        // Story 26.7: Show branch label if user branched from this scene
        if (branchLabel) {
          const branchTag = document.createElement('span');
          branchTag.className = 'da-journey-map__preview-branch-tag';
          branchTag.textContent = branchLabel;
          sceneEl.appendChild(branchTag);
        }

        sceneEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onSceneNavigate) {
            this.onSceneNavigate(scene.id);
          } else {
            this.onNavigate?.(act.number);
          }
          this.hide();
        });

        sceneList.appendChild(sceneEl);
      }

      chapterEl.appendChild(sceneList);
      preview.appendChild(chapterEl);
    }

    // Story 26.11: Key figures section
    if (node?.keyFigures && node.keyFigures.length > 0) {
      const figuresSection = document.createElement('div');
      figuresSection.className = 'da-journey-map__preview-figures';

      const figuresLabel = document.createElement('span');
      figuresLabel.className = 'da-journey-map__preview-section-label';
      figuresLabel.textContent = 'Key Figures:';

      const figuresList = document.createElement('span');
      figuresList.className = 'da-journey-map__preview-figures-list';
      figuresList.textContent = node.keyFigures.join(', ');

      figuresSection.appendChild(figuresLabel);
      figuresSection.appendChild(figuresList);
      preview.appendChild(figuresSection);
    }

    // Story 26.11: Key inventions as pill badges
    if (node?.keyInventions && node.keyInventions.length > 0) {
      const inventionsSection = document.createElement('div');
      inventionsSection.className = 'da-journey-map__preview-inventions';

      const inventionsLabel = document.createElement('span');
      inventionsLabel.className = 'da-journey-map__preview-section-label';
      inventionsLabel.textContent = 'Key Inventions:';

      const pillsContainer = document.createElement('div');
      pillsContainer.className = 'da-journey-map__preview-pills';

      for (const invention of node.keyInventions) {
        const pill = document.createElement('span');
        pill.className = 'da-journey-map__preview-pill';
        pill.textContent = invention;
        pillsContainer.appendChild(pill);
      }

      inventionsSection.appendChild(inventionsLabel);
      inventionsSection.appendChild(pillsContainer);
      preview.appendChild(inventionsSection);
    }

    // Story 26.11: "View Era Details" button
    if (node) {
      const detailBtn = document.createElement('button');
      detailBtn.type = 'button';
      detailBtn.className = 'da-journey-map__preview-detail-btn';
      detailBtn.textContent = 'View Era Details';
      detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissPreview();
        this.showEraDetail(node);
      });
      preview.appendChild(detailBtn);
    }

    return preview;
  }

  // =========================================================================
  // Story 26.11: Era Detail Zoom View
  // =========================================================================

  /**
   * Show a full era detail view within the journey map modal.
   * Hides the timeline children and displays a detailed panel.
   */
  private showEraDetail(node: JourneyNode): void {
    // Guard: clean up any existing detail view first
    if (this.eraDetailView) {
      this.hideEraDetail();
    }

    const content = this.overlay?.querySelector('.da-journey-map__content');
    if (!content) return;

    // Hide all existing children (tabs, panels, etc.) except the header
    const children = Array.from(content.children) as HTMLElement[];
    for (const child of children) {
      if (!child.classList.contains('da-journey-map__header')) {
        child.style.display = 'none';
      }
    }

    // Create era detail view
    const detail = document.createElement('div');
    detail.className = 'da-journey-map__era-detail';
    detail.setAttribute('role', 'region');
    detail.setAttribute('aria-label', `Era details: ${node.title}`);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'da-journey-map__era-detail-back';
    backBtn.textContent = '\u2190 Back to Timeline';
    backBtn.addEventListener('click', () => {
      this.hideEraDetail();
    });
    detail.appendChild(backBtn);

    // Header with icon, title, and era
    const header = document.createElement('div');
    header.className = 'da-journey-map__era-detail-header';

    const icon = document.createElement('span');
    icon.className = 'da-journey-map__era-detail-icon';
    icon.textContent = node.icon;

    const title = document.createElement('h3');
    title.className = 'da-journey-map__era-detail-title';
    title.id = 'da-journey-map-era-detail-title';
    title.textContent = `Act ${node.actNumber}: ${node.title}`;

    const era = document.createElement('span');
    era.className = 'da-journey-map__era-detail-era';
    era.textContent = node.era;

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(era);
    detail.appendChild(header);

    // Update modal aria-labelledby to point to era detail title
    if (this.overlay) {
      this.overlay.setAttribute('aria-labelledby', 'da-journey-map-era-detail-title');
    }

    // Key figures section
    if (node.keyFigures && node.keyFigures.length > 0) {
      const section = document.createElement('div');
      section.className = 'da-journey-map__era-detail-section';

      const sectionTitle = document.createElement('h4');
      sectionTitle.className = 'da-journey-map__era-detail-section-title';
      sectionTitle.textContent = 'Key Figures';
      section.appendChild(sectionTitle);

      const figuresList = document.createElement('div');
      figuresList.className = 'da-journey-map__era-detail-figures';

      for (const figure of node.keyFigures) {
        const figureEl = document.createElement('div');
        figureEl.className = 'da-journey-map__era-detail-figure';
        figureEl.textContent = figure;
        figuresList.appendChild(figureEl);
      }

      section.appendChild(figuresList);
      detail.appendChild(section);
    }

    // Key inventions section
    if (node.keyInventions && node.keyInventions.length > 0) {
      const section = document.createElement('div');
      section.className = 'da-journey-map__era-detail-section';

      const sectionTitle = document.createElement('h4');
      sectionTitle.className = 'da-journey-map__era-detail-section-title';
      sectionTitle.textContent = 'Key Inventions';
      section.appendChild(sectionTitle);

      const inventionsList = document.createElement('div');
      inventionsList.className = 'da-journey-map__era-detail-inventions';

      for (const invention of node.keyInventions) {
        const inventionEl = document.createElement('div');
        inventionEl.className = 'da-journey-map__era-detail-invention';
        inventionEl.textContent = invention;
        inventionsList.appendChild(inventionEl);
      }

      section.appendChild(inventionsList);
      detail.appendChild(section);
    }

    // Branch points section (if applicable)
    if (node.branchPoints && node.branchPoints.length > 0) {
      const section = document.createElement('div');
      section.className = 'da-journey-map__era-detail-section';

      const sectionTitle = document.createElement('h4');
      sectionTitle.className = 'da-journey-map__era-detail-section-title';
      sectionTitle.textContent = 'Branch Points';
      section.appendChild(sectionTitle);

      const branchesList = document.createElement('div');
      branchesList.className = 'da-journey-map__era-detail-branches';

      for (const branchLabel of node.branchPoints) {
        // Story 26.12: Make branches navigable if user has taken them
        const branchSceneId = this.findBranchSceneId(branchLabel);
        const branchEl = document.createElement(branchSceneId ? 'button' : 'div');
        branchEl.className = 'da-journey-map__era-detail-branch';
        if (branchSceneId) {
          branchEl.classList.add('da-journey-map__era-detail-branch--navigable');
          (branchEl as HTMLButtonElement).type = 'button';
          branchEl.addEventListener('click', () => {
            if (this.onSceneNavigate) {
              this.onSceneNavigate(branchSceneId);
            }
            this.hide();
          });
        }
        branchEl.textContent = branchLabel;
        branchesList.appendChild(branchEl);
      }

      section.appendChild(branchesList);
      detail.appendChild(section);
    }

    // Story 26.13: Skip warning for locked/upcoming eras (before Enter button)
    if (node.status === 'locked' || node.status === 'upcoming') {
      const skipWarning = document.createElement('div');
      skipWarning.className = 'da-journey-map__era-detail-skip-warning';
      skipWarning.textContent = 'Jumping here will skip earlier content. You can always return later.';
      detail.appendChild(skipWarning);
    }

    // "Enter This Era" button — Story 26.13: always shown (open doors)
    const enterBtn = document.createElement('button');
    enterBtn.type = 'button';
    enterBtn.className = 'da-journey-map__era-detail-go';
    enterBtn.textContent = `Enter ${node.title} \u2192`;
    enterBtn.addEventListener('click', () => {
      this.onNavigate?.(node.actNumber);
      this.hide();
    });
    detail.appendChild(enterBtn);

    content.appendChild(detail);
    this.eraDetailView = detail;

    // Focus back button for keyboard navigation
    requestAnimationFrame(() => {
      if (this.eraDetailView) {
        backBtn.focus();
      }
    });
  }

  /**
   * Hide the era detail view and restore the timeline.
   */
  private hideEraDetail(): void {
    if (!this.eraDetailView) return;

    const content = this.overlay?.querySelector('.da-journey-map__content');
    if (content) {
      // Restore hidden children
      const children = Array.from(content.children) as HTMLElement[];
      for (const child of children) {
        if (child !== this.eraDetailView && !child.classList.contains('da-journey-map__header')) {
          child.style.display = '';
        }
      }
    }

    // Restore original aria-labelledby
    if (this.overlay) {
      this.overlay.setAttribute('aria-labelledby', 'da-journey-map-title');
    }

    this.eraDetailView.remove();
    this.eraDetailView = null;
  }

  /**
   * Story 26.12: Find the scene ID for a branch by its label.
   * Reverses the takenBranches map (sceneId → label) to find the sceneId.
   */
  private findBranchSceneId(branchLabel: string): string | null {
    if (!this.takenBranches) return null;
    for (const [sceneId, label] of this.takenBranches) {
      if (label === branchLabel) return sceneId;
    }
    return null;
  }

  // Code Review Fix M6: formatSceneType extracted to @story/scene-utils

  private createConnector(prev: JourneyNode, next: JourneyNode): HTMLElement {
    const connector = document.createElement('div');
    connector.className = 'da-journey-map__connector';

    // Connector style based on the relationship between adjacent nodes
    if (prev.status === 'completed' && (next.status === 'completed' || next.status === 'current')) {
      connector.classList.add('da-journey-map__connector--solid');
    } else if (next.status === 'upcoming') {
      connector.classList.add('da-journey-map__connector--dashed');
    } else {
      connector.classList.add('da-journey-map__connector--dotted');
    }

    return connector;
  }

  // =========================================================================
  // Focus management and cleanup
  // =========================================================================

  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      this.previouslyFocusedElement instanceof HTMLElement
    ) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  private removeOverlay(): void {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    this.destroyChildComponents();
    this.eraDetailView = null;
    this.activePreview = null;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.tabPanels.clear();
    this.tabButtons.clear();
  }

  private destroyChildComponents(): void {
    if (this.worldMapView) {
      this.worldMapView.destroy();
      this.worldMapView = null;
    }
    if (this.artifactGallery) {
      this.artifactGallery.destroy();
      this.artifactGallery = null;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      // Story 26.11: Step back from era detail before closing modal
      if (this.eraDetailView) {
        this.hideEraDetail();
      } else {
        this.hide();
      }
    } else if (e.key === 'Tab' && this.overlay) {
      // Focus trap: keep focus within the journey map
      const focusableElements = this.overlay.querySelectorAll(
        'button, [role="button"][tabindex="0"]',
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
}
