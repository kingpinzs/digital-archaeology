// src/progress/JourneyMap.test.ts
// Tests for JourneyMap modal UI component
// Story 19.4: Create Progress Visualization

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JourneyMap } from './JourneyMap';
import type { JourneyMapData, JourneyNode } from './types';

/** Helper to build a JourneyNode */
function makeNode(
  actNumber: number,
  status: JourneyNode['status'],
  title = `Act ${actNumber}`,
  era = `Era ${actNumber}`,
  icon = '\u{1F3DB}',
  cpuStage = 'mechanical',
  extras?: { keyFigures?: readonly string[]; keyInventions?: readonly string[]; branchPoints?: readonly string[] },
): JourneyNode {
  return { actNumber, title, era, icon, cpuStage, status, ...extras };
}

/** Helper to create full 11-node data with specified completed/current */
function makeData(
  currentActNumber: number,
  completedCount: number,
): JourneyMapData {
  const nodes: JourneyNode[] = [];
  for (let i = 0; i < 11; i++) {
    let status: JourneyNode['status'] = 'locked';
    if (i < completedCount) status = 'completed';
    else if (i === currentActNumber) status = 'current';
    else if (i === currentActNumber + 1) status = 'upcoming';
    nodes.push(makeNode(i, status, `Act Title ${i}`, `Era ${i}`));
  }
  return { nodes, totalActs: 11, completedCount, currentActNumber };
}

describe('JourneyMap', () => {
  let journeyMap: JourneyMap;
  let container: HTMLElement;
  let onNavigate: ReturnType<typeof vi.fn<(actNumber: number) => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    journeyMap = new JourneyMap();
    journeyMap.mount(container);
    onNavigate = vi.fn<(actNumber: number) => void>();
  });

  afterEach(() => {
    journeyMap.destroy();
    container.remove();
    vi.useRealTimers();
  });

  // Task 8.1: mount/show creates modal overlay with 11 act nodes
  it('should create modal overlay with 11 act nodes on show()', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const overlay = container.querySelector('.da-journey-map');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');

    const nodes = container.querySelectorAll('.da-journey-map__node');
    expect(nodes).toHaveLength(11);
  });

  // Task 8.2: completed nodes have --completed class and checkmark
  it('should add --completed class and checkmark to completed nodes', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const completedNodes = container.querySelectorAll('.da-journey-map__node--completed');
    expect(completedNodes).toHaveLength(3);

    // Each completed node should have a checkmark
    for (const node of completedNodes) {
      const check = node.querySelector('.da-journey-map__node-check');
      expect(check).not.toBeNull();
      expect(check?.textContent).toBe('\u{2713}');
    }
  });

  // Task 8.3: current node has --current class
  it('should add --current class to current node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const currentNodes = container.querySelectorAll('.da-journey-map__node--current');
    expect(currentNodes).toHaveLength(1);
    expect((currentNodes[0] as HTMLElement).dataset.actNumber).toBe('3');
  });

  // Task 8.4: upcoming nodes have --upcoming class
  it('should add --upcoming class to upcoming node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const upcomingNodes = container.querySelectorAll('.da-journey-map__node--upcoming');
    expect(upcomingNodes).toHaveLength(1);
    expect((upcomingNodes[0] as HTMLElement).dataset.actNumber).toBe('4');
  });

  // Task 8.5: Story 26.13 — locked nodes have --locked class but are still clickable
  it('should add --locked class but remain clickable (open doors)', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const lockedNodes = container.querySelectorAll('.da-journey-map__node--locked');
    expect(lockedNodes).toHaveLength(6); // Acts 5-10

    for (const node of lockedNodes) {
      // Story 26.13: locked nodes are navigable — no aria-disabled
      expect(node.getAttribute('role')).toBe('button');
      expect(node.getAttribute('tabindex')).toBe('0');
    }
  });

  // Task 8.6: clicking completed node calls onNavigate with correct actNumber
  it('should call onNavigate when clicking a completed node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const completedNode = container.querySelector('[data-act-number="1"]') as HTMLElement;
    expect(completedNode).not.toBeNull();
    completedNode.click();

    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it('should call onNavigate when clicking the current node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const currentNode = container.querySelector('[data-act-number="3"]') as HTMLElement;
    currentNode.click();

    expect(onNavigate).toHaveBeenCalledWith(3);
  });

  // Review F5: Enter/Space key navigation on navigable nodes
  it('should call onNavigate when pressing Enter on a completed node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const completedNode = container.querySelector('[data-act-number="1"]') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    completedNode.dispatchEvent(event);

    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it('should call onNavigate when pressing Space on a current node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const currentNode = container.querySelector('[data-act-number="3"]') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    currentNode.dispatchEvent(event);

    expect(onNavigate).toHaveBeenCalledWith(3);
  });

  // Story 26.13: clicking locked/upcoming nodes opens preview (open doors)
  it('should open preview when clicking a locked node (open doors)', () => {
    const data = makeData(3, 3);
    const storyActs = [{ id: 'act-7', number: 7, title: 'Act 7', description: '', era: 'Era 7', cpuStage: 'micro32' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '1990', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

    journeyMap.show({
      journeyData: data,
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 3,
      onNavigate,
      onPinLocation: () => {},
      onUnpinLocation: () => {},
      onCollectArtifact: () => {},
      storyActs,
    });

    const lockedNode = container.querySelector('[data-act-number="7"]') as HTMLElement;
    lockedNode.click();

    // Preview should open with skip warning
    const preview = container.querySelector('.da-journey-map__preview');
    expect(preview).not.toBeNull();
    const skipWarning = container.querySelector('.da-journey-map__preview-skip-warning');
    expect(skipWarning).not.toBeNull();
  });

  it('should open preview when clicking an upcoming node (open doors)', () => {
    const data = makeData(3, 3);
    const storyActs = [{ id: 'act-4', number: 4, title: 'Act 4', description: '', era: 'Era 4', cpuStage: 'micro4' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '1975', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

    journeyMap.show({
      journeyData: data,
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 3,
      onNavigate,
      onPinLocation: () => {},
      onUnpinLocation: () => {},
      onCollectArtifact: () => {},
      storyActs,
    });

    const upcomingNode = container.querySelector('[data-act-number="4"]') as HTMLElement;
    upcomingNode.click();

    const preview = container.querySelector('.da-journey-map__preview');
    expect(preview).not.toBeNull();
    const skipWarning = container.querySelector('.da-journey-map__preview-skip-warning');
    expect(skipWarning).not.toBeNull();
  });

  // Task 8.8: Escape key closes modal
  it('should close modal on Escape key', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    // Should add exiting class
    const overlay = container.querySelector('.da-journey-map');
    expect(overlay?.classList.contains('da-journey-map--exiting')).toBe(true);

    // After timeout, overlay should be removed
    vi.advanceTimersByTime(300);
    expect(container.querySelector('.da-journey-map')).toBeNull();
  });

  // Task 8.9: close button click closes modal
  it('should close modal when close button is clicked', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const closeBtn = container.querySelector('.da-journey-map__close') as HTMLElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();

    vi.advanceTimersByTime(300);
    expect(container.querySelector('.da-journey-map')).toBeNull();
  });

  // Task 8.10: backdrop click closes modal
  it('should close modal when backdrop is clicked', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const backdrop = container.querySelector('.da-journey-map__backdrop') as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.click();

    vi.advanceTimersByTime(300);
    expect(container.querySelector('.da-journey-map')).toBeNull();
  });

  // Task 8.11: focus restoration after close
  it('should restore focus after close', () => {
    // Create and focus a button before opening
    const triggerBtn = document.createElement('button');
    triggerBtn.textContent = 'Open Map';
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();

    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    // Close the map
    journeyMap.hide();
    vi.advanceTimersByTime(300);

    expect(document.activeElement).toBe(triggerBtn);
    triggerBtn.remove();
  });

  // Task 8.12: show() with empty completions (all locked except current)
  it('should handle empty completions correctly', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const currentNodes = container.querySelectorAll('.da-journey-map__node--current');
    expect(currentNodes).toHaveLength(1);
    expect((currentNodes[0] as HTMLElement).dataset.actNumber).toBe('0');

    const completedNodes = container.querySelectorAll('.da-journey-map__node--completed');
    expect(completedNodes).toHaveLength(0);
  });

  // Task 8.13: show() with all completions (all highlighted)
  it('should handle all completions correctly', () => {
    const data = makeData(10, 11); // All 11 completed
    journeyMap.show(data, onNavigate);

    const completedNodes = container.querySelectorAll('.da-journey-map__node--completed');
    expect(completedNodes).toHaveLength(11);
  });

  // Task 8.14: completion counter displays "X / 11 Complete"
  it('should display completion counter with correct counts', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const counter = container.querySelector('.da-journey-map__counter');
    expect(counter?.textContent).toBe('3 / 11 Complete');
  });

  it('should display 0 / 11 Complete for empty data', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const counter = container.querySelector('.da-journey-map__counter');
    expect(counter?.textContent).toBe('0 / 11 Complete');
  });

  // Task 8.15: destroy() cleans up DOM and event listeners
  it('should clean up DOM and event listeners on destroy()', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    journeyMap.destroy();

    expect(container.querySelector('.da-journey-map')).toBeNull();

    // Dispatching Escape should not cause errors
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);
  });

  // Task 8.16: hide() adds --exiting class and removes overlay after 300ms
  it('should add --exiting class and remove overlay after 300ms', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    journeyMap.hide();

    const overlay = container.querySelector('.da-journey-map');
    expect(overlay?.classList.contains('da-journey-map--exiting')).toBe(true);

    // Still present before timeout
    expect(container.querySelector('.da-journey-map')).not.toBeNull();

    vi.advanceTimersByTime(300);
    expect(container.querySelector('.da-journey-map')).toBeNull();
  });

  // Task 8.17: double-invocation guard on hide()
  it('should guard against double-invocation of hide()', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    journeyMap.hide();
    journeyMap.hide(); // Second call should be ignored

    // Only one exit timeout should be active
    vi.advanceTimersByTime(300);
    expect(container.querySelector('.da-journey-map')).toBeNull();
  });

  // Additional: connectors between nodes
  it('should create connectors between nodes', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    // Should have 10 connectors (between 11 nodes)
    const connectors = container.querySelectorAll('.da-journey-map__connector');
    expect(connectors).toHaveLength(10);
  });

  it('should use solid connector between completed nodes', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const connectors = container.querySelectorAll('.da-journey-map__connector');
    // Connectors 0-1 (between completed 0-1 and 1-2) should be solid
    expect(connectors[0].classList.contains('da-journey-map__connector--solid')).toBe(true);
    expect(connectors[1].classList.contains('da-journey-map__connector--solid')).toBe(true);
  });

  // Navigable nodes should have role="button" and tabindex
  // Story 26.13: ALL nodes have role="button" and tabindex (open doors)
  it('should set role="button" and tabindex on ALL nodes (open doors)', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    // All nodes are navigable
    for (let i = 0; i < 11; i++) {
      const node = container.querySelector(`[data-act-number="${i}"]`);
      expect(node?.getAttribute('role')).toBe('button');
      expect(node?.getAttribute('tabindex')).toBe('0');
    }
  });

  // Each node displays title and era
  it('should display title and era for each node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const node0 = container.querySelector('[data-act-number="0"]');
    const title = node0?.querySelector('.da-journey-map__node-title');
    const era = node0?.querySelector('.da-journey-map__node-era');
    expect(title?.textContent).toBe('Act Title 0');
    expect(era?.textContent).toBe('Era 0');
  });

  // show() replaces existing overlay
  it('should replace existing overlay when show() is called again', () => {
    const data1 = makeData(0, 0);
    journeyMap.show(data1, onNavigate);

    const data2 = makeData(5, 5);
    journeyMap.show(data2, onNavigate);

    const overlays = container.querySelectorAll('.da-journey-map');
    expect(overlays).toHaveLength(1);

    const counter = container.querySelector('.da-journey-map__counter');
    expect(counter?.textContent).toBe('5 / 11 Complete');
  });

  // =========================================================================
  // Tabbed interface tests (Collectible Locations & Artifacts)
  // =========================================================================

  it('should render tab bar with three tabs', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const tabs = container.querySelectorAll('.da-journey-map__tab');
    expect(tabs).toHaveLength(3);
  });

  it('should default to timeline tab as active', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const activeTab = container.querySelector('.da-journey-map__tab--active');
    expect(activeTab?.textContent).toContain('Timeline');
  });

  it('should render three tab panels', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const panels = container.querySelectorAll('.da-journey-map__panel');
    expect(panels).toHaveLength(3);
  });

  it('should show timeline panel and hide others by default', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const timelinePanel = container.querySelector('#da-journey-map-panel-timeline');
    const worldMapPanel = container.querySelector('#da-journey-map-panel-world-map');
    const artifactsPanel = container.querySelector('#da-journey-map-panel-artifacts');

    expect(timelinePanel?.classList.contains('da-journey-map__panel--hidden')).toBe(false);
    expect(worldMapPanel?.classList.contains('da-journey-map__panel--hidden')).toBe(true);
    expect(artifactsPanel?.classList.contains('da-journey-map__panel--hidden')).toBe(true);
  });

  it('should switch to world map tab when clicked', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const worldMapTab = Array.from(container.querySelectorAll('.da-journey-map__tab'))
      .find(t => t.textContent?.includes('World Map')) as HTMLElement;
    worldMapTab?.click();

    const worldMapPanel = container.querySelector('#da-journey-map-panel-world-map');
    expect(worldMapPanel?.classList.contains('da-journey-map__panel--hidden')).toBe(false);

    const timelinePanel = container.querySelector('#da-journey-map-panel-timeline');
    expect(timelinePanel?.classList.contains('da-journey-map__panel--hidden')).toBe(true);
  });

  it('should switch to artifacts tab when clicked', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const artifactsTab = Array.from(container.querySelectorAll('.da-journey-map__tab'))
      .find(t => t.textContent?.includes('Artifacts')) as HTMLElement;
    artifactsTab?.click();

    const artifactsPanel = container.querySelector('#da-journey-map-panel-artifacts');
    expect(artifactsPanel?.classList.contains('da-journey-map__panel--hidden')).toBe(false);
  });

  it('should update aria-selected on tab switch', () => {
    const data = makeData(0, 0);
    journeyMap.show(data, onNavigate);

    const worldMapTab = Array.from(container.querySelectorAll('.da-journey-map__tab'))
      .find(t => t.textContent?.includes('World Map')) as HTMLElement;
    worldMapTab?.click();

    expect(worldMapTab?.getAttribute('aria-selected')).toBe('true');

    const timelineTab = Array.from(container.querySelectorAll('.da-journey-map__tab'))
      .find(t => t.textContent?.includes('Timeline')) as HTMLElement;
    expect(timelineTab?.getAttribute('aria-selected')).toBe('false');
  });

  it('should support extended show() with options object', () => {
    journeyMap.show({
      journeyData: makeData(0, 0),
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 0,
      onNavigate: onNavigate,
      onPinLocation: vi.fn(),
      onUnpinLocation: vi.fn(),
      onCollectArtifact: vi.fn(),
      initialTab: 'world-map',
    });

    const worldMapPanel = container.querySelector('#da-journey-map-panel-world-map');
    expect(worldMapPanel?.classList.contains('da-journey-map__panel--hidden')).toBe(false);
  });

  it('should open to specified initial tab', () => {
    journeyMap.show({
      journeyData: makeData(0, 0),
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 0,
      onNavigate: onNavigate,
      onPinLocation: vi.fn(),
      onUnpinLocation: vi.fn(),
      onCollectArtifact: vi.fn(),
      initialTab: 'artifacts',
    });

    const artifactsPanel = container.querySelector('#da-journey-map-panel-artifacts');
    expect(artifactsPanel?.classList.contains('da-journey-map__panel--hidden')).toBe(false);
  });

  it('should render world map SVG in world map panel', () => {
    journeyMap.show({
      journeyData: makeData(0, 0),
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 0,
      onNavigate: onNavigate,
      onPinLocation: vi.fn(),
      onUnpinLocation: vi.fn(),
      onCollectArtifact: vi.fn(),
      initialTab: 'world-map',
    });

    const worldMapPanel = container.querySelector('#da-journey-map-panel-world-map');
    expect(worldMapPanel?.querySelector('.da-world-map')).not.toBeNull();
  });

  it('should render artifact gallery in artifacts panel', () => {
    journeyMap.show({
      journeyData: makeData(0, 0),
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 0,
      onNavigate: onNavigate,
      onPinLocation: vi.fn(),
      onUnpinLocation: vi.fn(),
      onCollectArtifact: vi.fn(),
      initialTab: 'artifacts',
    });

    const artifactsPanel = container.querySelector('#da-journey-map-panel-artifacts');
    expect(artifactsPanel?.querySelector('.da-artifact-gallery')).not.toBeNull();
  });

  it('should clean up child components on destroy', () => {
    journeyMap.show({
      journeyData: makeData(0, 0),
      collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
      currentActNumber: 0,
      onNavigate: onNavigate,
      onPinLocation: vi.fn(),
      onUnpinLocation: vi.fn(),
      onCollectArtifact: vi.fn(),
    });

    journeyMap.destroy();

    expect(container.querySelector('.da-world-map')).toBeNull();
    expect(container.querySelector('.da-artifact-gallery')).toBeNull();
  });

  it('backward compatibility: old 2-arg show() still works', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    // Should still create tabs
    const tabs = container.querySelectorAll('.da-journey-map__tab');
    expect(tabs).toHaveLength(3);

    // Should still render 11 nodes in timeline
    const nodes = container.querySelectorAll('.da-journey-map__node');
    expect(nodes).toHaveLength(11);
  });

  // =========================================================================
  // Story 26.6: Timeline Visualization Interface
  // =========================================================================

  describe('golden path label (Story 26.6)', () => {
    it('should render "The Golden Path" label in timeline panel', () => {
      const data = makeData(3, 3);
      journeyMap.show(data, onNavigate);

      const label = container.querySelector('.da-journey-map__golden-path-label');
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe('The Golden Path');
    });

    it('should place golden path label before the timeline', () => {
      const data = makeData(3, 3);
      journeyMap.show(data, onNavigate);

      const panel = container.querySelector('#da-journey-map-panel-timeline');
      const label = panel?.querySelector('.da-journey-map__golden-path-label');
      const timeline = panel?.querySelector('.da-journey-map__timeline');
      // Label should come before timeline in DOM
      expect(label).not.toBeNull();
      expect(timeline).not.toBeNull();
      const children = Array.from(panel?.children ?? []);
      expect(children.indexOf(label!)).toBeLessThan(children.indexOf(timeline!));
    });
  });

  describe('timeline hover preview (Story 26.6)', () => {
    const mockActs = [
      {
        id: 'act-0', number: 0, title: 'Genesis', description: 'Desc',
        era: '1940', cpuStage: 'mechanical' as const,
        chapters: [
          {
            id: 'ch-0-1', number: 1, title: 'Dawn', subtitle: 'Sub', year: '1940',
            scenes: [
              { id: 'scene-0-1-1', type: 'narrative' as const, nextScene: 'scene-0-1-2' },
              { id: 'scene-0-1-2', type: 'choice' as const },
            ],
          },
        ],
      },
      {
        id: 'act-1', number: 1, title: 'Transistor', description: 'Desc',
        era: '1950', cpuStage: 'mechanical' as const,
        chapters: [
          {
            id: 'ch-1-1', number: 1, title: 'Revolution', subtitle: 'Sub', year: '1950',
            scenes: [
              { id: 'scene-1-1-1', type: 'narrative' as const },
              { id: 'scene-1-1-2', type: 'dialogue' as const },
              { id: 'scene-1-1-3', type: 'challenge' as const },
            ],
          },
        ],
      },
    ];

    function showWithPreviewData(
      opts: { visitedScenes?: Set<string>; currentSceneId?: string; onSceneNavigate?: (id: string) => void } = {},
    ) {
      journeyMap.show({
        journeyData: makeData(1, 1), // Act 0 completed, Act 1 current
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 1,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        storyActs: mockActs,
        visitedScenes: opts.visitedScenes,
        currentSceneId: opts.currentSceneId,
        onSceneNavigate: opts.onSceneNavigate,
      });
    }

    it('should show preview tooltip when clicking a completed node with storyActs', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const preview = container.querySelector('.da-journey-map__preview');
      expect(preview).not.toBeNull();
    });

    it('should show act title in preview header', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const title = container.querySelector('.da-journey-map__preview-title');
      expect(title?.textContent).toBe('Act 0: Genesis');
    });

    it('should show "Go →" button in preview', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const goBtn = container.querySelector('.da-journey-map__preview-go');
      expect(goBtn).not.toBeNull();
      expect(goBtn?.textContent).toBe('Go \u2192');
    });

    it('should show chapter titles in preview', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const chapterTitle = container.querySelector('.da-journey-map__preview-chapter-title');
      expect(chapterTitle?.textContent).toBe('Ch 1: Dawn');
    });

    it('should show scene buttons in preview', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const scenes = container.querySelectorAll('.da-journey-map__preview-scene');
      expect(scenes).toHaveLength(2); // 2 scenes in act 0
    });

    it('should format scene types correctly', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const labels = container.querySelectorAll('.da-journey-map__preview-scene-label');
      expect(labels[0]?.textContent).toBe('Story');       // narrative → Story
      expect(labels[1]?.textContent).toBe('Branch Point'); // choice → Branch Point
    });

    it('should mark choice scenes as branch points', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const branchScenes = container.querySelectorAll('.da-journey-map__preview-scene--branch');
      expect(branchScenes).toHaveLength(1); // Only the choice scene
    });

    it('should mark visited scenes', () => {
      showWithPreviewData({
        visitedScenes: new Set(['scene-0-1-1']),
      });

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const visitedScenes = container.querySelectorAll('.da-journey-map__preview-scene--visited');
      expect(visitedScenes).toHaveLength(1);
    });

    it('should mark current scene', () => {
      showWithPreviewData({
        currentSceneId: 'scene-0-1-2',
      });

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const currentScenes = container.querySelectorAll('.da-journey-map__preview-scene--current');
      expect(currentScenes).toHaveLength(1);
    });

    it('should call onSceneNavigate when a scene is clicked in preview', () => {
      const onSceneNavigate = vi.fn();
      showWithPreviewData({ onSceneNavigate });

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const scenes = container.querySelectorAll('.da-journey-map__preview-scene');
      (scenes[0] as HTMLElement).click();

      expect(onSceneNavigate).toHaveBeenCalledWith('scene-0-1-1');
    });

    it('should dismiss preview and navigate on second click of same node', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click(); // First click → show preview
      expect(container.querySelector('.da-journey-map__preview')).not.toBeNull();

      node0.click(); // Second click → navigate
      expect(onNavigate).toHaveBeenCalledWith(0);
    });

    it('should dismiss preview when clicking timeline background', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();
      expect(container.querySelector('.da-journey-map__preview')).not.toBeNull();

      // Click the timeline container itself
      const timeline = container.querySelector('.da-journey-map__timeline') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: timeline });
      timeline.dispatchEvent(event);

      expect(container.querySelector('.da-journey-map__preview')).toBeNull();
    });

    it('should replace old preview when clicking a different node', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();
      expect(container.querySelector('.da-journey-map__preview-title')?.textContent).toBe('Act 0: Genesis');

      const node1 = container.querySelector('[data-act-number="1"]') as HTMLElement;
      node1.click();
      expect(container.querySelector('.da-journey-map__preview-title')?.textContent).toBe('Act 1: Transistor');

      // Only one preview should exist
      expect(container.querySelectorAll('.da-journey-map__preview')).toHaveLength(1);
    });

    it('should navigate via Go button in preview', () => {
      showWithPreviewData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const goBtn = container.querySelector('.da-journey-map__preview-go') as HTMLElement;
      goBtn.click();

      expect(onNavigate).toHaveBeenCalledWith(0);
    });

    it('should fall back to onNavigate when no storyActs provided', () => {
      // Old-style call without storyActs
      journeyMap.show(makeData(3, 3), onNavigate);

      const node1 = container.querySelector('[data-act-number="1"]') as HTMLElement;
      node1.click();

      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it('should fall back to onNavigate for scenes when onSceneNavigate not provided', () => {
      showWithPreviewData(); // No onSceneNavigate

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const scenes = container.querySelectorAll('.da-journey-map__preview-scene');
      (scenes[0] as HTMLElement).click();

      // Should fall back to act-level navigate
      expect(onNavigate).toHaveBeenCalledWith(0);
    });
  });

  // =========================================================================
  // Story 26.7: Alternate Timeline Branches
  // =========================================================================

  describe('branch badge (Story 26.7)', () => {
    it('should show branch badge when activeBranchLabel is set', () => {
      journeyMap.show({
        journeyData: makeData(1, 1),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 1,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        activeBranchLabel: 'Stack Machine Path',
      });

      const badge = container.querySelector('.da-journey-map__branch-badge');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toContain('Stack Machine Path');
    });

    it('should not show branch badge when activeBranchLabel is null', () => {
      journeyMap.show({
        journeyData: makeData(1, 1),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 1,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        activeBranchLabel: null,
      });

      const badge = container.querySelector('.da-journey-map__branch-badge');
      expect(badge).toBeNull();
    });

    it('should not show branch badge with old 2-arg API', () => {
      journeyMap.show(makeData(1, 1), onNavigate);

      const badge = container.querySelector('.da-journey-map__branch-badge');
      expect(badge).toBeNull();
    });

    it('should still show golden path label alongside branch badge', () => {
      journeyMap.show({
        journeyData: makeData(1, 1),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 1,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        activeBranchLabel: 'What If Path',
      });

      const label = container.querySelector('.da-journey-map__golden-path-label');
      expect(label?.textContent).toContain('The Golden Path');
      expect(label?.textContent).toContain('What If Path');
    });
  });

  describe('branch indicators on nodes (Story 26.7)', () => {
    it('should show branch indicator on nodes in branchActNumbers', () => {
      journeyMap.show({
        journeyData: makeData(3, 3),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 3,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        branchActNumbers: new Set([1, 2]),
      });

      const node1 = container.querySelector('[data-act-number="1"]');
      const indicator1 = node1?.querySelector('.da-journey-map__branch-indicator');
      expect(indicator1).not.toBeNull();

      const node2 = container.querySelector('[data-act-number="2"]');
      const indicator2 = node2?.querySelector('.da-journey-map__branch-indicator');
      expect(indicator2).not.toBeNull();
    });

    it('should not show branch indicator on nodes not in branchActNumbers', () => {
      journeyMap.show({
        journeyData: makeData(3, 3),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 3,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        branchActNumbers: new Set([1]),
      });

      const node0 = container.querySelector('[data-act-number="0"]');
      expect(node0?.querySelector('.da-journey-map__branch-indicator')).toBeNull();

      const node3 = container.querySelector('[data-act-number="3"]');
      expect(node3?.querySelector('.da-journey-map__branch-indicator')).toBeNull();
    });

    it('should not show branch indicators when branchActNumbers not provided', () => {
      journeyMap.show(makeData(3, 3), onNavigate);

      const indicators = container.querySelectorAll('.da-journey-map__branch-indicator');
      expect(indicators).toHaveLength(0);
    });

    it('should set aria-label on branch indicator', () => {
      journeyMap.show({
        journeyData: makeData(3, 3),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 3,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        branchActNumbers: new Set([0]),
      });

      const indicator = container.querySelector('.da-journey-map__branch-indicator');
      expect(indicator?.getAttribute('aria-label')).toBe('Contains alternate timeline branch');
    });
  });

  describe('branch-aware scene preview (Story 26.7)', () => {
    const mockActsWithBranch = [
      {
        id: 'act-0', number: 0, title: 'Genesis', description: 'Desc',
        era: '1940', cpuStage: 'mechanical' as const,
        chapters: [
          {
            id: 'ch-0-1', number: 1, title: 'Dawn', subtitle: 'Sub', year: '1940',
            scenes: [
              { id: 'scene-0-1-1', type: 'narrative' as const, nextScene: 'scene-0-1-2' },
              { id: 'scene-0-1-2', type: 'choice' as const },
              { id: 'scene-0-1-3', type: 'narrative' as const },
            ],
          },
        ],
      },
    ];

    function showWithBranchData(
      opts: {
        takenBranches?: Map<string, string>;
        branchActNumbers?: Set<number>;
        activeBranchLabel?: string | null;
      } = {},
    ) {
      journeyMap.show({
        journeyData: makeData(1, 1),
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 1,
        onNavigate,
        onPinLocation: vi.fn(),
        onUnpinLocation: vi.fn(),
        onCollectArtifact: vi.fn(),
        storyActs: mockActsWithBranch,
        takenBranches: opts.takenBranches,
        branchActNumbers: opts.branchActNumbers,
        activeBranchLabel: opts.activeBranchLabel,
      });
    }

    it('should show branch tag on scenes in takenBranches map', () => {
      showWithBranchData({
        takenBranches: new Map([['scene-0-1-2', 'Stack Machine Path']]),
      });

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const branchTags = container.querySelectorAll('.da-journey-map__preview-branch-tag');
      expect(branchTags).toHaveLength(1);
      expect(branchTags[0]?.textContent).toBe('Stack Machine Path');
    });

    it('should add --branched class to scenes in takenBranches', () => {
      showWithBranchData({
        takenBranches: new Map([['scene-0-1-2', 'Alt Path']]),
      });

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const branchedScenes = container.querySelectorAll('.da-journey-map__preview-scene--branched');
      expect(branchedScenes).toHaveLength(1);
    });

    it('should not show branch tags when takenBranches not provided', () => {
      showWithBranchData();

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const branchTags = container.querySelectorAll('.da-journey-map__preview-branch-tag');
      expect(branchTags).toHaveLength(0);
    });

    it('should not add --branched class to non-branched scenes', () => {
      showWithBranchData({
        takenBranches: new Map([['scene-0-1-2', 'Alt Path']]),
      });

      const node0 = container.querySelector('[data-act-number="0"]') as HTMLElement;
      node0.click();

      const scenes = container.querySelectorAll('.da-journey-map__preview-scene');
      // First scene (narrative) should NOT have --branched
      expect(scenes[0]?.classList.contains('da-journey-map__preview-scene--branched')).toBe(false);
      // Second scene (choice) should have --branched
      expect(scenes[1]?.classList.contains('da-journey-map__preview-scene--branched')).toBe(true);
      // Third scene (narrative) should NOT have --branched
      expect(scenes[2]?.classList.contains('da-journey-map__preview-scene--branched')).toBe(false);
    });

    it('should clean up branch state on destroy', () => {
      showWithBranchData({
        activeBranchLabel: 'Test Branch',
        branchActNumbers: new Set([0]),
        takenBranches: new Map([['scene-0-1-2', 'Test']]),
      });

      journeyMap.destroy();

      // Clean up old container before re-creating
      container.remove();

      // Re-mount and show without branch data
      container = document.createElement('div');
      document.body.appendChild(container);
      journeyMap = new JourneyMap();
      journeyMap.mount(container);
      journeyMap.show(makeData(1, 1), onNavigate);

      expect(container.querySelector('.da-journey-map__branch-badge')).toBeNull();
      expect(container.querySelectorAll('.da-journey-map__branch-indicator')).toHaveLength(0);
    });
  });

  // =========================================================================
  // Story 26.11: Key Figures, Inventions, and Era Detail View
  // =========================================================================
  describe('Story 26.11: Preview figures and inventions', () => {
    it('should show key figures in preview when node has keyFigures', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage', 'Ada Lovelace'],
        keyInventions: ['Abacus'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      // Click node to show preview
      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();

      const figuresList = container.querySelector('.da-journey-map__preview-figures-list');
      expect(figuresList?.textContent).toContain('Babbage');
      expect(figuresList?.textContent).toContain('Ada Lovelace');
    });

    it('should show inventions as pills in preview', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyInventions: ['Abacus', 'Boolean Logic'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();

      const pills = container.querySelectorAll('.da-journey-map__preview-pill');
      expect(pills).toHaveLength(2);
      expect(pills[0].textContent).toBe('Abacus');
      expect(pills[1].textContent).toBe('Boolean Logic');
    });

    it('should not show figures section when node has no keyFigures', () => {
      const nodes = [makeNode(0, 'completed')];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Act 0', description: '', era: 'Era 0', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '1970', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();

      expect(container.querySelector('.da-journey-map__preview-figures')).toBeNull();
    });

    it('should render "View Era Details" button in preview', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();

      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn');
      expect(detailBtn).not.toBeNull();
      expect(detailBtn?.textContent).toBe('View Era Details');
    });
  });

  describe('Story 26.11: Era detail view', () => {
    it('should render era detail view when "View Era Details" is clicked', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
        keyInventions: ['Abacus'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      // Click node to show preview
      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();

      // Click "View Era Details" button
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      const eraDetail = container.querySelector('.da-journey-map__era-detail');
      expect(eraDetail).not.toBeNull();

      const title = container.querySelector('.da-journey-map__era-detail-title');
      expect(title?.textContent).toContain('Pre-history');

      const figures = container.querySelectorAll('.da-journey-map__era-detail-figure');
      expect(figures).toHaveLength(1);
      expect(figures[0].textContent).toBe('Babbage');

      const inventions = container.querySelectorAll('.da-journey-map__era-detail-invention');
      expect(inventions).toHaveLength(1);
      expect(inventions[0].textContent).toBe('Abacus');
    });

    it('should return to timeline when back button is clicked in era detail', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      expect(container.querySelector('.da-journey-map__era-detail')).not.toBeNull();

      // Click back button
      const backBtn = container.querySelector('.da-journey-map__era-detail-back') as HTMLElement;
      backBtn?.click();

      expect(container.querySelector('.da-journey-map__era-detail')).toBeNull();
    });

    it('should step back from era detail on Escape instead of closing modal', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      expect(container.querySelector('.da-journey-map__era-detail')).not.toBeNull();

      // Press Escape — should hide era detail, NOT close modal
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(container.querySelector('.da-journey-map__era-detail')).toBeNull();
      // Modal should still be present
      expect(container.querySelector('.da-journey-map')).not.toBeNull();
    });

    it('should render enter button for navigable nodes', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      const enterBtn = container.querySelector('.da-journey-map__era-detail-go');
      expect(enterBtn).not.toBeNull();
      expect(enterBtn?.textContent).toContain('Pre-history');
    });

    // Story 26.13: Enter button shown for locked/upcoming nodes (open doors)
    it('should render enter button and skip warning for locked nodes', () => {
      const nodes = [
        makeNode(0, 'current', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical'),
        makeNode(1, 'locked', 'Relay Era', '1940', '\u{26A1}', 'relay'),
      ];
      const data: JourneyMapData = { nodes, totalActs: 2, completedCount: 0, currentActNumber: 0 };
      const storyActs = [
        { id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-0', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-0-1', type: 'narrative' as const }] }] },
        { id: 'act-1', number: 1, title: 'Relay Era', description: '', era: '1940', cpuStage: 'relay' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '1940', scenes: [{ id: 'scene-1-1', type: 'narrative' as const }] }] },
      ];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
      });

      // Click on the locked node
      const lockedNode = container.querySelector('.da-journey-map__node--locked') as HTMLElement;
      lockedNode?.click();
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      // Enter button should be present
      const enterBtn = container.querySelector('.da-journey-map__era-detail-go');
      expect(enterBtn).not.toBeNull();
      expect(enterBtn?.textContent).toContain('Relay Era');

      // Skip warning should be present
      const skipWarning = container.querySelector('.da-journey-map__era-detail-skip-warning');
      expect(skipWarning).not.toBeNull();
      expect(skipWarning?.textContent).toContain('skip earlier content');
    });
  });

  // =========================================================================
  // Story 26.12: Navigable branches in era detail
  // =========================================================================
  describe('Story 26.12: Navigable branch points', () => {
    it('should make taken branches navigable buttons in era detail', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
        branchPoints: ['What if relays?'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      const takenBranches = new Map<string, string>();
      takenBranches.set('scene-branch-1', 'What if relays?');

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
        takenBranches,
      });

      // Open preview then era detail
      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      const navigableBranch = container.querySelector('.da-journey-map__era-detail-branch--navigable');
      expect(navigableBranch).not.toBeNull();
      expect(navigableBranch?.tagName).toBe('BUTTON');
      expect(navigableBranch?.textContent).toBe('What if relays?');
    });

    it('should render non-taken branches as non-navigable divs', () => {
      const nodes = [makeNode(0, 'completed', 'Pre-history', '3000 BC', '\u{1F3DB}', 'mechanical', {
        keyFigures: ['Babbage'],
        branchPoints: ['What if relays?'],
      })];
      const data: JourneyMapData = { nodes, totalActs: 1, completedCount: 1, currentActNumber: 0 };
      const storyActs = [{ id: 'act-0', number: 0, title: 'Pre-history', description: '', era: '3000 BC', cpuStage: 'mechanical' as const, chapters: [{ id: 'ch-1', number: 1, title: 'Ch1', subtitle: '', year: '3000 BC', scenes: [{ id: 'scene-1', type: 'narrative' as const }] }] }];

      journeyMap.show({
        journeyData: data,
        collectibleProfile: { pinnedLocations: [], collectedArtifacts: [], version: 1 },
        currentActNumber: 0,
        onNavigate,
        onPinLocation: () => {},
        onUnpinLocation: () => {},
        onCollectArtifact: () => {},
        storyActs,
        // No takenBranches — the branch is not navigable
      });

      const nodeEl = container.querySelector('.da-journey-map__node--completed') as HTMLElement;
      nodeEl?.click();
      const detailBtn = container.querySelector('.da-journey-map__preview-detail-btn') as HTMLElement;
      detailBtn?.click();

      const branch = container.querySelector('.da-journey-map__era-detail-branch');
      expect(branch).not.toBeNull();
      expect(branch?.tagName).toBe('DIV');
      expect(container.querySelector('.da-journey-map__era-detail-branch--navigable')).toBeNull();
    });
  });
});
