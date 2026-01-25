// src/story/ProgressDisplay.ts
// Type definitions for progress display components
// Story 10.16: Display Era Badge and Progress

/**
 * Represents the progress state of a single act.
 */
export interface ActProgress {
  /** Act number (0-10 for 11 acts) */
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
  /** The current act number (0-10) */
  currentActNumber: number;
  /** Total number of acts */
  totalActs: number;
}

/**
 * Creates a ProgressDisplayData from current act number.
 * Assumes acts before currentActNumber are completed.
 * @param currentActNumber - Current act (0-based, acts are numbered 0-10)
 * @param totalActs - Total number of acts (default 11 for acts 0-10)
 */
export function createProgressDisplayData(
  currentActNumber: number,
  totalActs: number = 11
): ProgressDisplayData {
  const acts: ActProgress[] = [];

  // Acts are numbered 0 to totalActs-1 (0-indexed)
  for (let i = 0; i < totalActs; i++) {
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
