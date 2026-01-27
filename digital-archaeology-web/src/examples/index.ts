// src/examples/index.ts
// Public exports for examples module

export type {
  ExampleCategory,
  ExampleProgram,
  ExampleBrowserCallbacks,
} from './types';

export { CATEGORY_LABELS, CATEGORY_ORDER } from './types';

export {
  EXAMPLE_PROGRAMS,
  getProgramsByCategory,
  findProgramByFilename,
} from './exampleMetadata';

export { ExampleBrowser } from './ExampleBrowser';

export { loadExampleProgram, checkProgramExists } from './ExampleLoader';
