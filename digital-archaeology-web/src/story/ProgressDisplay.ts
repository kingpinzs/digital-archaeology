// src/story/ProgressDisplay.ts
// Type definitions for progress display components
// Story 10.16: Display Era Badge and Progress

/**
 * Represents the progress state of a single act.
 */
export interface ActProgress {
  /** Act number (1-5) */
  actNumber: number;
  /** Whether the act has been completed */
  isCompleted: boolean;
  /** Whether this is the current act */
  isCurrent: boolean;
}

/**
 * Data structure for rendering progress dots.
 */
export interface ProgressDisplayData {
  /** Array of act progress states */
  acts: ActProgress[];
  /** The current act number (1-5) */
  currentActNumber: number;
  /** Total number of acts */
  totalActs: number;
}

/**
 * Creates a ProgressDisplayData from current act number.
 * Assumes acts before currentActNumber are completed.
 * @param currentActNumber - Current act (1-based)
 * @param totalActs - Total number of acts (default 5)
 */
export function createProgressDisplayData(
  currentActNumber: number,
  totalActs: number = 5
): ProgressDisplayData {
  const acts: ActProgress[] = [];

  for (let i = 1; i <= totalActs; i++) {
    acts.push({
      actNumber: i,
      isCompleted: i < currentActNumber,
      isCurrent: i === currentActNumber,
    });
  }

  return {
    acts,
    currentActNumber,
    totalActs,
  };
}
