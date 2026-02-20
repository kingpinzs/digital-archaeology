// src/progress/JourneyMapBuilder.ts
// Data builder for journey map visualization
// Story 19.4: Create Progress Visualization

import type { ActCompletionType, JourneyMapData, JourneyNode, JourneyNodeStatus } from './types';
import { ACT_COMPLETION_METADATA } from './types';
import { ActCompletionStorage } from './ActCompletionStorage';

/** Total number of acts in the story (Act 0 through Act 10) */
const TOTAL_ACTS = 11;

/** Mapping from act number (0-10) to CpuStage string — tuple enforces exactly 11 entries at compile time */
const ACT_CPU_STAGES: readonly [string, string, string, string, string, string, string, string, string, string, string] = [
  'mechanical',   // Act 0
  'relay',        // Act 1
  'vacuum',       // Act 2
  'transistor',   // Act 3
  'micro4',       // Act 4
  'micro8',       // Act 5
  'micro16',      // Act 6
  'micro32',      // Act 7
  'micro32p',     // Act 8
  'micro32s',     // Act 9
  'future',       // Act 10
];

/**
 * Builds JourneyMapData from act completion state.
 * Pure data builder — reads ActCompletionStorage and maps to JourneyNode array.
 */
export class JourneyMapBuilder {
  private readonly storage: ActCompletionStorage;

  constructor(storage: ActCompletionStorage) {
    this.storage = storage;
  }

  /**
   * Build the journey map data for the current state.
   * @param currentActNumber - The user's current act (0-10)
   * @returns Complete JourneyMapData with all 11 nodes
   */
  build(currentActNumber: number): JourneyMapData {
    const completedActNumbers = new Set(this.storage.getCompletedActNumbers());
    const nodes: JourneyNode[] = [];

    for (let i = 0; i < TOTAL_ACTS; i++) {
      const actId = `act-${i}` as ActCompletionType;
      const metadata = ACT_COMPLETION_METADATA[actId];
      const status = this.resolveStatus(i, currentActNumber, completedActNumbers);

      nodes.push({
        actNumber: i,
        title: metadata.title,
        era: metadata.era,
        icon: metadata.icon,
        cpuStage: ACT_CPU_STAGES[i],
        status,
      });
    }

    return {
      nodes,
      totalActs: TOTAL_ACTS,
      completedCount: completedActNumbers.size,
      currentActNumber,
    };
  }

  /**
   * Determine the visual status for an act node.
   */
  private resolveStatus(
    actNumber: number,
    currentActNumber: number,
    completedActNumbers: Set<number>,
  ): JourneyNodeStatus {
    if (completedActNumbers.has(actNumber)) {
      return 'completed';
    }
    if (actNumber === currentActNumber) {
      return 'current';
    }
    if (actNumber === currentActNumber + 1) {
      return 'upcoming';
    }
    return 'locked';
  }
}
