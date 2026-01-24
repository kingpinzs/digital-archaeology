// Barrel export for debugger module
// Step controls, breakpoints, state inspection

export { RegisterView } from './RegisterView';
export type { RegisterViewState, RegisterViewOptions } from './RegisterView';

export { FlagsView } from './FlagsView';
export type { FlagsViewState, FlagsViewOptions } from './FlagsView';

export { MemoryView } from './MemoryView';
export type { MemoryViewState, MemoryViewOptions } from './MemoryView';

export { BreakpointsView } from './BreakpointsView';
export type { BreakpointsViewState, BreakpointsViewOptions, BreakpointEntry } from './BreakpointsView';

// Story 5.10: Rich runtime error display
export { RuntimeErrorPanel } from './RuntimeErrorPanel';
export type { RuntimeErrorPanelState, RuntimeErrorPanelOptions } from './RuntimeErrorPanel';

// Re-export RuntimeErrorContext from emulator module for convenience
export type { RuntimeErrorContext } from '@emulator/index';
