// src/examples/types.ts
// Type definitions for example programs feature

/**
 * Categories for grouping example programs.
 */
export type ExampleCategory = 'arithmetic' | 'loops' | 'algorithms' | 'bitwise' | 'reference';

/**
 * Difficulty level for learners.
 */
export type ExampleDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Metadata for a single example program.
 */
export interface ExampleProgram {
  /** Filename without path (e.g., "add.asm") */
  filename: string;
  /** Display name (e.g., "Add Two Numbers") */
  name: string;
  /** Category for grouping */
  category: ExampleCategory;
  /** Brief description shown in tooltip */
  description: string;
  /** Concepts this program demonstrates */
  concepts: string[];
  /** Difficulty level for learners */
  difficulty: ExampleDifficulty;
}

/**
 * Callbacks for ExampleBrowser component.
 */
export interface ExampleBrowserCallbacks {
  /** Called when user selects a program */
  onSelect: (program: ExampleProgram) => void;
  /** Called when browser is closed */
  onClose: () => void;
}

/**
 * Display labels for categories.
 */
export const CATEGORY_LABELS: Record<ExampleCategory, string> = {
  arithmetic: 'Arithmetic',
  loops: 'Loops',
  algorithms: 'Algorithms',
  bitwise: 'Bitwise',
  reference: 'Reference',
};

/**
 * Order for displaying categories in the browser.
 */
export const CATEGORY_ORDER: ExampleCategory[] = [
  'arithmetic',
  'loops',
  'algorithms',
  'bitwise',
  'reference',
];

/**
 * Display labels for difficulty levels.
 */
export const DIFFICULTY_LABELS: Record<ExampleDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/**
 * CSS variable names for difficulty level colors.
 */
export const DIFFICULTY_COLORS: Record<ExampleDifficulty, string> = {
  beginner: 'var(--da-success)',
  intermediate: 'var(--da-warning)',
  advanced: 'var(--da-error)',
};
