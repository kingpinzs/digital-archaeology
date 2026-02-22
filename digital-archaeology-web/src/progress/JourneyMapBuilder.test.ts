// src/progress/JourneyMapBuilder.test.ts
// Tests for JourneyMapBuilder data builder
// Story 19.4: Create Progress Visualization

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JourneyMapBuilder } from './JourneyMapBuilder';
import { ActCompletionStorage } from './ActCompletionStorage';
import { ACT_COMPLETION_METADATA } from './types';
import type { ActCompletionType } from './types';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

const TEST_STORAGE_KEY = 'test-journey-map-builder';

describe('JourneyMapBuilder', () => {
  let storage: ActCompletionStorage;
  let builder: JourneyMapBuilder;

  beforeEach(() => {
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    vi.clearAllMocks();

    storage = new ActCompletionStorage(TEST_STORAGE_KEY);
    builder = new JourneyMapBuilder(storage);
  });

  // Task 7.1: build() with no completions → act 0 current, all others locked
  it('should set act 0 as current and all others locked when no completions exist', () => {
    const data = builder.build(0);

    expect(data.nodes).toHaveLength(11);
    expect(data.totalActs).toBe(11);
    expect(data.completedCount).toBe(0);
    expect(data.currentActNumber).toBe(0);

    expect(data.nodes[0].status).toBe('current');
    expect(data.nodes[1].status).toBe('upcoming');
    for (let i = 2; i < 11; i++) {
      expect(data.nodes[i].status).toBe('locked');
    }
  });

  // Task 7.2: build() with 3 completed acts → 3 completed, 1 current, 1 upcoming, rest locked
  it('should correctly assign statuses with 3 completed acts', () => {
    // Complete acts 0, 1, 2
    storage.addCompletion({ actNumber: 0, actId: 'act-0', timestamp: 1000, actTitle: 'Pre-history', era: '3000 BC - 1840s' });
    storage.addCompletion({ actNumber: 1, actId: 'act-1', timestamp: 2000, actTitle: 'Electromechanical', era: '1890s - 1945' });
    storage.addCompletion({ actNumber: 2, actId: 'act-2', timestamp: 3000, actTitle: 'Vacuum Tubes', era: '1945 - 1955' });

    const data = builder.build(3); // Current act is 3

    expect(data.completedCount).toBe(3);
    expect(data.nodes[0].status).toBe('completed');
    expect(data.nodes[1].status).toBe('completed');
    expect(data.nodes[2].status).toBe('completed');
    expect(data.nodes[3].status).toBe('current');
    expect(data.nodes[4].status).toBe('upcoming');
    expect(data.nodes[5].status).toBe('locked');
    expect(data.nodes[6].status).toBe('locked');
    expect(data.nodes[7].status).toBe('locked');
    expect(data.nodes[8].status).toBe('locked');
    expect(data.nodes[9].status).toBe('locked');
    expect(data.nodes[10].status).toBe('locked');
  });

  // Task 7.3: build() with all acts completed → all 11 completed, completedCount = 11
  it('should mark all nodes completed when all acts are done', () => {
    for (let i = 0; i < 11; i++) {
      const actId = `act-${i}` as ActCompletionType;
      const meta = ACT_COMPLETION_METADATA[actId];
      storage.addCompletion({
        actNumber: i,
        actId,
        timestamp: 1000 * (i + 1),
        actTitle: meta.title,
        era: meta.era,
      });
    }

    // When all acts are complete, current can be 10 (last act)
    const data = builder.build(10);

    expect(data.completedCount).toBe(11);
    for (let i = 0; i < 11; i++) {
      expect(data.nodes[i].status).toBe('completed');
    }
  });

  // Task 7.4: Node data integrity — each node has correct title, era, icon from ACT_COMPLETION_METADATA
  it('should populate each node with correct metadata from ACT_COMPLETION_METADATA', () => {
    const data = builder.build(0);

    for (let i = 0; i < 11; i++) {
      const actId = `act-${i}` as ActCompletionType;
      const meta = ACT_COMPLETION_METADATA[actId];
      const node = data.nodes[i];

      expect(node.actNumber).toBe(i);
      expect(node.title).toBe(meta.title);
      expect(node.era).toBe(meta.era);
      expect(node.icon).toBe(meta.icon);
    }
  });

  it('should assign correct cpuStage for each act', () => {
    const data = builder.build(0);
    const expectedStages = [
      'mechanical', 'relay', 'vacuum', 'transistor',
      'micro4', 'micro8', 'micro16', 'micro32',
      'micro32p', 'micro32s', 'future',
    ];

    for (let i = 0; i < 11; i++) {
      expect(data.nodes[i].cpuStage).toBe(expectedStages[i]);
    }
  });

  // Task 7.5: Status transitions — completed < current < upcoming < locked ordering
  it('should maintain status ordering: completed before current before upcoming before locked', () => {
    storage.addCompletion({ actNumber: 0, actId: 'act-0', timestamp: 1000, actTitle: 'Pre-history', era: '3000 BC - 1840s' });
    storage.addCompletion({ actNumber: 1, actId: 'act-1', timestamp: 2000, actTitle: 'Electromechanical', era: '1890s - 1945' });

    const data = builder.build(2);
    const statuses = data.nodes.map(n => n.status);

    // First group: completed
    expect(statuses[0]).toBe('completed');
    expect(statuses[1]).toBe('completed');
    // Then current
    expect(statuses[2]).toBe('current');
    // Then upcoming
    expect(statuses[3]).toBe('upcoming');
    // Then all locked
    for (let i = 4; i < 11; i++) {
      expect(statuses[i]).toBe('locked');
    }
  });

  // Task 7.6: Edge case — currentActNumber at boundaries
  it('should handle currentActNumber = 0 (first act, no upcoming before it)', () => {
    const data = builder.build(0);

    expect(data.nodes[0].status).toBe('current');
    expect(data.nodes[1].status).toBe('upcoming');
    for (let i = 2; i < 11; i++) {
      expect(data.nodes[i].status).toBe('locked');
    }
  });

  it('should handle currentActNumber = 10 (last act, no upcoming after it)', () => {
    // Complete acts 0-9 first
    for (let i = 0; i < 10; i++) {
      const actId = `act-${i}` as ActCompletionType;
      const meta = ACT_COMPLETION_METADATA[actId];
      storage.addCompletion({
        actNumber: i,
        actId,
        timestamp: 1000 * (i + 1),
        actTitle: meta.title,
        era: meta.era,
      });
    }

    const data = builder.build(10);

    for (let i = 0; i < 10; i++) {
      expect(data.nodes[i].status).toBe('completed');
    }
    expect(data.nodes[10].status).toBe('current');
    // No upcoming beyond act 10 — act 11 doesn't exist
  });

  it('should always produce exactly 11 nodes', () => {
    const data = builder.build(5);
    expect(data.nodes).toHaveLength(11);
  });

  it('should return totalActs = 11', () => {
    const data = builder.build(0);
    expect(data.totalActs).toBe(11);
  });

  // Story 26.11: Key Figures and Key Inventions
  describe('Story 26.11: Historical data', () => {
    it('should populate keyFigures for every node', () => {
      const data = builder.build(0);
      for (const node of data.nodes) {
        expect(node.keyFigures).toBeDefined();
        expect(node.keyFigures!.length).toBeGreaterThan(0);
      }
    });

    it('should populate keyInventions for every node', () => {
      const data = builder.build(0);
      for (const node of data.nodes) {
        expect(node.keyInventions).toBeDefined();
        expect(node.keyInventions!.length).toBeGreaterThan(0);
      }
    });

    it('should return readonly arrays', () => {
      const data = builder.build(0);
      const node = data.nodes[0];
      expect(Array.isArray(node.keyFigures)).toBe(true);
      expect(Array.isArray(node.keyInventions)).toBe(true);
    });

    it('should include well-known figures for Act 0 (Pre-history)', () => {
      const data = builder.build(0);
      const act0 = data.nodes[0];
      expect(act0.keyFigures).toContain('Babbage');
      expect(act0.keyFigures).toContain('Ada Lovelace');
    });

    it('should include Intel 4004 in Act 4 inventions', () => {
      const data = builder.build(0);
      const act4 = data.nodes[4];
      expect(act4.keyInventions).toContain('Intel 4004');
      expect(act4.keyInventions).toContain('Microprocessor');
    });

    it('should include von Neumann and Grace Hopper in Act 2', () => {
      const data = builder.build(0);
      const act2 = data.nodes[2];
      expect(act2.keyFigures).toContain('John von Neumann');
      expect(act2.keyFigures).toContain('Grace Hopper');
    });
  });
});
