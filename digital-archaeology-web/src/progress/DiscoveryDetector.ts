// src/progress/DiscoveryDetector.ts
// Source code analysis service for detecting first-time discoveries
// Story 19.1: Track First-Time Discoveries

import type { LabStage } from '../config/stageConfig';
import type { Discovery, DiscoveryType } from './types';
import type { DiscoveryStorage } from './DiscoveryStorage';

/** Mnemonic patterns for each instruction-based discovery type */
const SUBROUTINE_PATTERN = /\b(CALL|RET|JSR|RTS)\b/i;
const INTERRUPT_PATTERN = /\b(INT|RTI|RETI|IRET)\b/i;
const STACK_PATTERN = /\b(PUSH|POP|PUSHA|POPA)\b/i;

/** Map of LabStage to corresponding first-stage discovery type */
const STAGE_DISCOVERY_MAP: Partial<Record<LabStage, DiscoveryType>> = {
  micro4: 'first-stage-micro4',
  micro8: 'first-stage-micro8',
  micro16: 'first-stage-micro16',
};

/**
 * Service that analyzes source code after successful assembly
 * to detect first-time discoveries.
 */
export class DiscoveryDetector {
  private storage: DiscoveryStorage;

  constructor(storage: DiscoveryStorage) {
    this.storage = storage;
  }

  /**
   * Detect new discoveries from assembled source code.
   * Returns only discoveries that have NOT been previously earned.
   *
   * @param source - The assembly source code text
   * @param stage - The CPU stage the program was assembled for
   * @param experimentationMode - Whether experimentation mode was active
   * @returns Array of newly detected discoveries (empty if none)
   */
  detect(source: string, stage: LabStage, experimentationMode: boolean): Discovery[] {
    const timestamp = Date.now();
    const newDiscoveries: Discovery[] = [];

    // Load profile once to avoid redundant localStorage reads per check
    const earnedTypes = new Set(
      (this.storage.loadProfile()?.discoveries ?? []).map(d => d.type),
    );

    // Strip comments before scanning for mnemonics
    const strippedSource = source.replace(/;.*/g, '');

    // Check first-assembly (any successful assembly)
    if (!earnedTypes.has('first-assembly')) {
      newDiscoveries.push(this.createDiscovery('first-assembly', timestamp, stage, experimentationMode));
    }

    // Check first-stage-* (first assembly on this specific stage)
    const stageDiscovery = STAGE_DISCOVERY_MAP[stage];
    if (stageDiscovery && !earnedTypes.has(stageDiscovery)) {
      newDiscoveries.push(this.createDiscovery(stageDiscovery, timestamp, stage, experimentationMode));
    }

    // Check first-subroutine (CALL/RET/JSR/RTS in source)
    if (!earnedTypes.has('first-subroutine') && SUBROUTINE_PATTERN.test(strippedSource)) {
      newDiscoveries.push(this.createDiscovery('first-subroutine', timestamp, stage, experimentationMode));
    }

    // Check first-interrupt (INT/RTI/RETI/IRET in source)
    if (!earnedTypes.has('first-interrupt') && INTERRUPT_PATTERN.test(strippedSource)) {
      newDiscoveries.push(this.createDiscovery('first-interrupt', timestamp, stage, experimentationMode));
    }

    // Check first-stack (PUSH/POP/PUSHA/POPA in source)
    if (!earnedTypes.has('first-stack') && STACK_PATTERN.test(strippedSource)) {
      newDiscoveries.push(this.createDiscovery('first-stack', timestamp, stage, experimentationMode));
    }

    return newDiscoveries;
  }

  private createDiscovery(
    type: DiscoveryType,
    timestamp: number,
    stage: LabStage,
    experimentationMode: boolean,
  ): Discovery {
    return { type, timestamp, stage, experimentationMode };
  }
}
