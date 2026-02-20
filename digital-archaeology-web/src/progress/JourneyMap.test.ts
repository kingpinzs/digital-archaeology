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
): JourneyNode {
  return { actNumber, title, era, icon, cpuStage, status };
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

  // Task 8.5: locked nodes have --locked class and aria-disabled
  it('should add --locked class and aria-disabled to locked nodes', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const lockedNodes = container.querySelectorAll('.da-journey-map__node--locked');
    expect(lockedNodes).toHaveLength(6); // Acts 5-10

    for (const node of lockedNodes) {
      expect(node.getAttribute('aria-disabled')).toBe('true');
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

  // Task 8.7: clicking locked node does NOT call onNavigate
  it('should NOT call onNavigate when clicking a locked node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const lockedNode = container.querySelector('[data-act-number="7"]') as HTMLElement;
    lockedNode.click();

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('should NOT call onNavigate when clicking an upcoming node', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    const upcomingNode = container.querySelector('[data-act-number="4"]') as HTMLElement;
    upcomingNode.click();

    expect(onNavigate).not.toHaveBeenCalled();
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
  it('should set role="button" and tabindex on navigable nodes', () => {
    const data = makeData(3, 3);
    journeyMap.show(data, onNavigate);

    // Completed and current nodes are navigable
    const node0 = container.querySelector('[data-act-number="0"]');
    expect(node0?.getAttribute('role')).toBe('button');
    expect(node0?.getAttribute('tabindex')).toBe('0');

    const node3 = container.querySelector('[data-act-number="3"]');
    expect(node3?.getAttribute('role')).toBe('button');

    // Locked nodes should NOT have role="button"
    const node7 = container.querySelector('[data-act-number="7"]');
    expect(node7?.getAttribute('role')).toBeNull();
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
});
