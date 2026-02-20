// src/progress/StatisticsStorage.ts
// localStorage persistence service for runtime statistics
// Story 19.6: Create Statistics Dashboard

import type { LabStage } from '../config/stageConfig';
import type { RuntimeStatistics } from './types';
import { DEFAULT_RUNTIME_STATISTICS, isValidRuntimeStatistics } from './types';

/** Storage key for runtime statistics in localStorage */
export const STATISTICS_STORAGE_KEY = 'digital-archaeology-statistics';

/**
 * Service for persisting runtime statistics to localStorage.
 * Follows the DiscoveryStorage pattern with type guards and error handling.
 * Each increment method loads, mutates, saves in a single call.
 * No caching — always reads fresh from localStorage.
 */
export class StatisticsStorage {
  private storageKey: string;

  constructor(storageKey: string = STATISTICS_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load runtime statistics from localStorage.
   * Returns null if no valid data is found.
   */
  loadStatistics(): RuntimeStatistics | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (isValidRuntimeStatistics(parsed)) {
        return parsed;
      }
      console.warn('Invalid runtime statistics in localStorage, clearing...');
      this.clearStatistics();
      return null;
    } catch (error) {
      console.error('Failed to load runtime statistics:', error);
      return null;
    }
  }

  /**
   * Save runtime statistics to localStorage.
   * Silently fails if localStorage is unavailable.
   */
  saveStatistics(stats: RuntimeStatistics): void {
    try {
      const serialized = JSON.stringify(stats);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save runtime statistics:', error);
    }
  }

  /**
   * Get statistics or defaults.
   * Convenience method that never returns null.
   */
  getStatisticsOrDefault(): RuntimeStatistics {
    return this.loadStatistics() ?? { ...DEFAULT_RUNTIME_STATISTICS, timePerStage: { ...DEFAULT_RUNTIME_STATISTICS.timePerStage } };
  }

  /**
   * Increment the programs assembled counter.
   */
  incrementPrograms(): void {
    const stats = this.getStatisticsOrDefault();
    this.saveStatistics({
      ...stats,
      programsAssembled: stats.programsAssembled + 1,
    });
  }

  /**
   * Add to the instructions executed counter.
   */
  addInstructionsExecuted(count: number): void {
    const stats = this.getStatisticsOrDefault();
    this.saveStatistics({
      ...stats,
      instructionsExecuted: stats.instructionsExecuted + count,
    });
  }

  /**
   * Increment the errors encountered counter.
   */
  incrementErrors(): void {
    const stats = this.getStatisticsOrDefault();
    this.saveStatistics({
      ...stats,
      errorsEncountered: stats.errorsEncountered + 1,
    });
  }

  /**
   * Add time spent on a specific stage.
   */
  addStageTime(stage: LabStage, milliseconds: number): void {
    const stats = this.getStatisticsOrDefault();
    this.saveStatistics({
      ...stats,
      timePerStage: {
        ...stats.timePerStage,
        [stage]: stats.timePerStage[stage] + milliseconds,
      },
    });
  }

  /**
   * Add to the total session time.
   */
  addSessionTime(milliseconds: number): void {
    const stats = this.getStatisticsOrDefault();
    this.saveStatistics({
      ...stats,
      totalSessionTime: stats.totalSessionTime + milliseconds,
    });
  }

  /**
   * Clear runtime statistics from localStorage.
   */
  clearStatistics(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear runtime statistics:', error);
    }
  }
}
