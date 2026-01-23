# State Management Guide

**Action Item #5 from Epic 3 Retrospective**

This guide documents state management patterns used in Digital Archaeology.

## State Categories

### 1. Component State (Local)

State that belongs to a single component and doesn't need to be shared.

```typescript
class Editor {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private disposables: Array<{ dispose: () => void }> = [];
}
```

### 2. Application State (Shared)

State that multiple components need to access or modify.

```typescript
class App {
  // Execution state
  private isRunning = false;
  private executionSpeed = 60;

  // Assembly state
  private hasValidAssembly = false;
  private currentBinary: Uint8Array | null = null;

  // UI state
  private currentMode: 'lab' | 'story' = 'lab';
}
```

### 3. Derived State

State computed from other state values.

```typescript
// Toolbar button enabled state is derived from multiple values
const canRun = hasValidAssembly && !isRunning;
const canPause = isRunning;
const canStep = hasValidAssembly && !isRunning;
```

## Boolean Flag Pattern

When adding boolean flags, plan ALL reset points upfront:

### Reset Point Checklist

| Reset Point | When | Example |
|-------------|------|---------|
| `mount()` | Component initialization | `this.isRunning = false;` |
| `destroy()` | Component cleanup | `this.isRunning = false;` |
| Success path | After successful operation | `this.hasValidAssembly = true;` |
| Error path | After failed operation | `this.hasValidAssembly = false;` |
| User action | Reset/clear button | `this.hasValidAssembly = false;` |

### Example: `hasValidAssembly` Flag

```typescript
class App {
  private hasValidAssembly = false;

  mount(): void {
    this.hasValidAssembly = false;  // Reset on mount
  }

  destroy(): void {
    this.hasValidAssembly = false;  // Reset on destroy
  }

  async handleAssemble(): Promise<void> {
    try {
      const result = await this.assemblerBridge.assemble(source);
      if (result.success) {
        this.hasValidAssembly = true;  // Success path
      } else {
        this.hasValidAssembly = false;  // Error in result
      }
    } catch (error) {
      this.hasValidAssembly = false;  // Exception path
    }
  }

  handleEditorChange(): void {
    this.hasValidAssembly = false;  // Code changed
  }
}
```

## State Update Pattern

When state changes, update all dependent UI elements:

```typescript
private updateToolbarState(): void {
  this.toolbar?.updateState({
    canAssemble: true,
    canRun: this.hasValidAssembly && !this.isRunning,
    canPause: this.isRunning,
    canStep: this.hasValidAssembly && !this.isRunning,
    canReset: this.hasValidAssembly,
    isRunning: this.isRunning,
    speed: this.executionSpeed,
  });
}
```

## Subscription Pattern (Pub/Sub)

For decoupled state updates, use the subscription pattern:

```typescript
// Bridge provides subscription methods
const unsubscribe = bridge.onStateUpdate((state: CPUState) => {
  updateRegisterDisplay(state);
  updateMemoryView(state);
  updateStatusBar(state);
});

// Clean up on destroy
destroy(): void {
  unsubscribe();
}
```

## State Machine Pattern

For complex state transitions (like execution states):

```typescript
type ExecutionState = 'idle' | 'running' | 'paused' | 'halted' | 'error';

const transitions: Record<ExecutionState, ExecutionState[]> = {
  idle: ['running'],
  running: ['paused', 'halted', 'error'],
  paused: ['running', 'idle'],
  halted: ['idle'],
  error: ['idle'],
};

function canTransition(from: ExecutionState, to: ExecutionState): boolean {
  return transitions[from].includes(to);
}
```

## Anti-Patterns to Avoid

### 1. Forgetting Reset Points

```typescript
// BAD: Missing reset in catch block
async handleAssemble(): Promise<void> {
  try {
    const result = await this.assemblerBridge.assemble(source);
    this.hasValidAssembly = result.success;
  } catch (error) {
    // hasValidAssembly not reset! Stale state persists.
    this.showError(error);
  }
}
```

### 2. Inconsistent State

```typescript
// BAD: Button state doesn't match actual state
this.isRunning = true;
this.toolbar.updateState({ canRun: true });  // Should be false!
```

### 3. Derived State Not Updated

```typescript
// BAD: Only updating one dependent element
this.hasValidAssembly = true;
this.toolbar.updateState({ canRun: true });
// Forgot to update: status bar, menu items, etc.
```

## Testing State Changes

```typescript
describe('Assembly state', () => {
  it('should reset hasValidAssembly on destroy', async () => {
    const app = new App();
    await app.mount(container);

    // Set valid assembly
    await simulateSuccessfulAssembly(app);
    expect(app['hasValidAssembly']).toBe(true);

    // Destroy should reset
    app.destroy();
    expect(app['hasValidAssembly']).toBe(false);
  });

  it('should reset hasValidAssembly on error', async () => {
    mockBridge.assemble.mockRejectedValue(new Error('fail'));

    await app.handleAssemble();

    expect(app['hasValidAssembly']).toBe(false);
  });
});
```

## Future Consideration: State Library

As the application grows, consider a state management library if:
- More than 10 boolean flags exist
- State synchronization bugs become frequent
- Multiple components need the same state
- State persistence becomes complex

Candidates:
- Zustand (minimal, TypeScript-friendly)
- Jotai (atomic state)
- Custom Simple Store (see Architecture document)

## Real Examples

- `src/ui/App.ts` - Main application state
- `src/emulator/EmulatorBridge.ts` - Subscription-based state updates
- `src/ui/Toolbar.ts` - Derived state for button enabled/disabled
