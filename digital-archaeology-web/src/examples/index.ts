// src/examples/index.ts
// Public exports for examples module

export type {
  ExampleCategory,
  ExampleProgram,
  ExampleBrowserCallbacks,
  ExampleDifficulty,
} from './types';

export { CATEGORY_LABELS, CATEGORY_ORDER, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from './types';

export {
  EXAMPLE_PROGRAMS,
  getProgramsByCategory,
  findProgramByFilename,
} from './exampleMetadata';

export { ExampleBrowser } from './ExampleBrowser';
export { ExampleTooltip } from './ExampleTooltip';

export { loadExampleProgram, checkProgramExists } from './ExampleLoader';
