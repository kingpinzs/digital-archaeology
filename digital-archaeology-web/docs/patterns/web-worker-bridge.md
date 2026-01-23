# Web Worker + Bridge Pattern

**Action Item #2 from Epic 3 Retrospective**

This pattern provides a clean, Promise-based API for communicating with WASM modules running in Web Workers.

## Overview

The pattern consists of three layers:

```
┌─────────────────┐
│   UI / App      │  Uses Promise-based API
└────────┬────────┘
         │
┌────────▼────────┐
│     Bridge      │  Translates Promises to postMessage
└────────┬────────┘
         │
┌────────▼────────┐
│   Web Worker    │  Loads WASM, executes commands
└─────────────────┘
```

## When to Use

Use this pattern when:
- Running WASM modules that could block the UI
- Long-running computations (assembly, execution)
- Operations that need to report progress

## Implementation

### 1. Define Command/Event Types

```typescript
// types.ts
export type AssemblerCommand =
  | { type: 'ASSEMBLE'; payload: { source: string } };

export type AssemblerEvent =
  | { type: 'WORKER_READY' }
  | { type: 'ASSEMBLY_RESULT'; payload: AssemblyResult }
  | { type: 'ERROR'; payload: { message: string } };
```

### 2. Create the Worker

```typescript
// assembler.worker.ts
import type { AssemblerCommand, AssemblerEvent } from './types';

let wasmModule: AssemblerModule | null = null;

// Type guard for commands
function isAssemblerCommand(data: unknown): data is AssemblerCommand {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return obj.type === 'ASSEMBLE' && typeof obj.payload?.source === 'string';
}

// Initialize WASM
async function init(): Promise<void> {
  const createModule = await import('/wasm/assembler.js');
  wasmModule = await createModule.default();
  self.postMessage({ type: 'WORKER_READY' } satisfies AssemblerEvent);
}

// Handle messages
self.onmessage = (event: MessageEvent) => {
  if (!isAssemblerCommand(event.data)) {
    console.warn('Unknown message:', event.data);
    return;
  }

  if (!wasmModule) {
    self.postMessage({
      type: 'ERROR',
      payload: { message: 'WASM not initialized' }
    } satisfies AssemblerEvent);
    return;
  }

  switch (event.data.type) {
    case 'ASSEMBLE':
      handleAssemble(wasmModule, event.data.payload.source);
      break;
  }
};

init();
```

### 3. Create the Bridge Class

```typescript
// AssemblerBridge.ts
export class AssemblerBridge {
  private worker: Worker | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      this.worker = new Worker(
        new URL('./assembler.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        this.worker?.terminate();
        reject(new Error('Initialization timed out'));
      }, 30000);

      const handleInit = (event: MessageEvent<AssemblerEvent>) => {
        if (event.data.type === 'WORKER_READY') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleInit);
          this.initialized = true;
          resolve();
        } else if (event.data.type === 'ERROR') {
          clearTimeout(timeout);
          reject(new Error(event.data.payload.message));
        }
      };

      this.worker.addEventListener('message', handleInit);
    });
  }

  async assemble(source: string): Promise<AssemblyResult> {
    if (!this.worker || !this.initialized) {
      throw new Error('Bridge not initialized');
    }

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<AssemblerEvent>) => {
        if (event.data.type === 'ASSEMBLY_RESULT') {
          this.worker?.removeEventListener('message', handleMessage);
          resolve(event.data.payload);
        } else if (event.data.type === 'ERROR') {
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(event.data.payload.message));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({
        type: 'ASSEMBLE',
        payload: { source }
      } satisfies AssemblerCommand);
    });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.initialized = false;
  }
}
```

### 4. Usage in UI Code

```typescript
// App.ts
const bridge = new AssemblerBridge();

async function mount(): Promise<void> {
  await bridge.init();
}

async function handleAssemble(): Promise<void> {
  try {
    const result = await bridge.assemble(editor.getValue());
    if (result.success) {
      showBinary(result.binary);
    } else {
      showErrors(result.errors);
    }
  } catch (error) {
    showError(error.message);
  }
}

function destroy(): void {
  bridge.terminate();
}
```

## Event Subscriptions (EmulatorBridge Extension)

For long-running operations that emit multiple events, add subscription methods:

```typescript
export class EmulatorBridge {
  private stateUpdateSubscribers = new Set<(state: CPUState) => void>();
  private haltedSubscribers = new Set<() => void>();

  // Subscribe to state updates
  onStateUpdate(callback: (state: CPUState) => void): () => void {
    this.stateUpdateSubscribers.add(callback);
    return () => this.stateUpdateSubscribers.delete(callback);
  }

  // Subscribe to halt events
  onHalted(callback: () => void): () => void {
    this.haltedSubscribers.add(callback);
    return () => this.haltedSubscribers.delete(callback);
  }

  // Dispatch events to subscribers
  private handleWorkerEvent(event: EmulatorEvent): void {
    switch (event.type) {
      case 'STATE_UPDATE':
        this.stateUpdateSubscribers.forEach(cb => cb(event.payload));
        break;
      case 'HALTED':
        this.haltedSubscribers.forEach(cb => cb());
        break;
    }
  }
}
```

## Testing

Mock the Bridge class in tests:

```typescript
const mockBridge = {
  init: vi.fn().mockResolvedValue(undefined),
  assemble: vi.fn().mockResolvedValue({ success: true, binary: new Uint8Array() }),
  terminate: vi.fn(),
};

vi.mock('./AssemblerBridge', () => ({
  AssemblerBridge: vi.fn(() => mockBridge),
}));
```

## Best Practices

1. **Always validate messages** - Use type guards for both commands and events
2. **Handle timeouts** - Workers can hang; always set timeouts
3. **Clean up listeners** - Remove event listeners after receiving expected response
4. **Terminate on unmount** - Call `terminate()` when component unmounts
5. **Use `satisfies`** - TypeScript's `satisfies` operator ensures type safety without casting

## Real Examples

- `src/emulator/AssemblerBridge.ts` - Assembly operations
- `src/emulator/EmulatorBridge.ts` - CPU execution with subscriptions
- `src/emulator/assembler.worker.ts` - Assembler worker
- `src/emulator/emulator.worker.ts` - Emulator worker
