// src/progress/ActCompletionDetector.test.ts
// Tests for ActCompletionDetector act transition detection service
// Story 19.2: Track Act Completion

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActCompletionDetector } from './ActCompletionDetector';
import { ActCompletionStorage } from './ActCompletionStorage';
import type { StoryActSummary } from './types';

const TEST_STORAGE_KEY = 'test-act-completion-detector';

/** Helper: create act summaries for testing */
function createActSummaries(): StoryActSummary[] {
  return [
    { number: 0, title: 'Pre-history', era: '3000 BC - 1840s' },
    { number: 1, title: 'Electromechanical', era: '1890s - 1945' },
    { number: 2, title: 'Vacuum Tubes', era: '1945 - 1955' },
    { number: 3, title: 'Transistors', era: '1955 - 1970' },
    { number: 4, title: 'First Microprocessor', era: '1971' },
    { number: 5, title: '8-bit Era', era: '1974-1978' },
    { number: 6, title: '16-bit Era', era: '1978-1985' },
    { number: 7, title: '32-bit Era', era: '1985-1995' },
    { number: 8, title: 'Pipelined', era: '1989-1995' },
    { number: 9, title: 'Superscalar', era: '1995+' },
    { number: 10, title: 'Future Computing', era: '2015+' },
  ];
}

describe('ActCompletionDetector', () => {
  let storage: ActCompletionStorage;
  let detector: ActCompletionDetector;
  let acts: StoryActSummary[];

  beforeEach(() => {
    localStorage.clear();
    storage = new ActCompletionStorage(TEST_STORAGE_KEY);
    detector = new ActCompletionDetector(storage);
    acts = createActSummaries();
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  it('detects completion when act number increases by 1', () => {
    const results = detector.detect(0, 1, acts);
    expect(results).toHaveLength(1);
    expect(results[0].actNumber).toBe(0);
    expect(results[0].actId).toBe('act-0');
  });

  it('returns empty array when act number stays same', () => {
    const results = detector.detect(2, 2, acts);
    expect(results).toEqual([]);
  });

  it('returns empty array when act number decreases (going back)', () => {
    const results = detector.detect(3, 1, acts);
    expect(results).toEqual([]);
  });

  it('does NOT re-detect if act already completed', () => {
    // Manually add act-0 as completed
    storage.addCompletion({
      actNumber: 0,
      actId: 'act-0',
      timestamp: 1600000000000,
      actTitle: 'Pre-history',
      era: '3000 BC - 1840s',
    });

    const results = detector.detect(0, 1, acts);
    expect(results).toEqual([]);
  });

  it('includes correct act title from act summaries', () => {
    const results = detector.detect(2, 3, acts);
    expect(results).toHaveLength(1);
    expect(results[0].actTitle).toBe('Vacuum Tubes');
  });

  it('includes correct era from act summaries', () => {
    const results = detector.detect(4, 5, acts);
    expect(results).toHaveLength(1);
    expect(results[0].era).toBe('1971');
  });

  it('includes correct timestamp', () => {
    const results = detector.detect(0, 1, acts);
    expect(results).toHaveLength(1);
    expect(results[0].timestamp).toBe(1700000000000);
  });

  it('returns empty array when previousActNumber is negative', () => {
    const results = detector.detect(-1, 0, acts);
    expect(results).toEqual([]);
  });

  it('uses fallback title when act not found in summaries', () => {
    const results = detector.detect(0, 1, []); // Empty summaries
    expect(results).toHaveLength(1);
    expect(results[0].actTitle).toBe('Act 0');
    expect(results[0].era).toBe('Unknown');
  });

  it('detects all intermediate completions for multi-act jumps', () => {
    const results = detector.detect(1, 4, acts);
    expect(results).toHaveLength(3);
    expect(results[0].actNumber).toBe(1);
    expect(results[0].actId).toBe('act-1');
    expect(results[0].actTitle).toBe('Electromechanical');
    expect(results[1].actNumber).toBe(2);
    expect(results[1].actId).toBe('act-2');
    expect(results[1].actTitle).toBe('Vacuum Tubes');
    expect(results[2].actNumber).toBe(3);
    expect(results[2].actId).toBe('act-3');
    expect(results[2].actTitle).toBe('Transistors');
  });

  it('skips already-completed acts in multi-act jumps', () => {
    // Act 2 already completed
    storage.addCompletion({
      actNumber: 2,
      actId: 'act-2',
      timestamp: 1600000000000,
      actTitle: 'Vacuum Tubes',
      era: '1945 - 1955',
    });

    const results = detector.detect(1, 4, acts);
    expect(results).toHaveLength(2);
    expect(results[0].actNumber).toBe(1);
    expect(results[1].actNumber).toBe(3);
  });
});
