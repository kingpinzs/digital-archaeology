# Event Listener Cleanup Pattern

**Action Item #3 from Epic 3 Retrospective**

Proper event listener cleanup prevents memory leaks and unexpected behavior when components are unmounted and remounted.

## The Problem

Event listeners that aren't cleaned up cause:
- Memory leaks (listeners accumulate on remount)
- Double-firing (same event triggers multiple handlers)
- Stale closures (handlers reference old state)

## Pattern 1: Store Bound Handlers

When using class methods as event handlers, store the bound reference for cleanup:

```typescript
class MenuBar {
  private container: HTMLElement | null = null;
  private boundClickOutsideHandler: ((e: MouseEvent) => void) | null = null;

  mount(container: HTMLElement): void {
    this.container = container;

    // Bind and store the handler
    this.boundClickOutsideHandler = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.boundClickOutsideHandler);
  }

  destroy(): void {
    // Remove using the same bound reference
    if (this.boundClickOutsideHandler) {
      document.removeEventListener('click', this.boundClickOutsideHandler);
      this.boundClickOutsideHandler = null;
    }
    this.container = null;
  }

  private handleClickOutside(event: MouseEvent): void {
    // Handler logic
  }
}
```

## Pattern 2: Disposable Pattern (Monaco-style)

For APIs that return disposables, collect them for cleanup:

```typescript
class Editor {
  private disposables: Array<{ dispose: () => void }> = [];

  mount(container: HTMLElement): void {
    const editor = monaco.editor.create(container, options);

    // Collect disposables
    this.disposables.push(
      editor.onDidChangeCursorPosition(this.handleCursorChange),
      editor.onDidChangeModelContent(this.handleContentChange),
      editor.addAction(this.undoAction)
    );
  }

  destroy(): void {
    // Dispose all in reverse order
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }
}
```

## Pattern 3: Unsubscribe Functions

For subscription-based APIs, store unsubscribe functions:

```typescript
class App {
  private unsubscribers: Array<() => void> = [];

  mount(): void {
    const bridge = new EmulatorBridge();

    // Store unsubscribe functions
    this.unsubscribers.push(
      bridge.onStateUpdate(this.handleStateUpdate),
      bridge.onHalted(this.handleHalted),
      bridge.onError(this.handleError)
    );
  }

  destroy(): void {
    // Call all unsubscribers
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
```

## Pattern 4: AbortController (Modern)

For multiple listeners that should be removed together:

```typescript
class Panel {
  private abortController: AbortController | null = null;

  mount(container: HTMLElement): void {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    // All listeners tied to same signal
    container.addEventListener('click', this.handleClick, { signal });
    container.addEventListener('keydown', this.handleKeydown, { signal });
    window.addEventListener('resize', this.handleResize, { signal });
  }

  destroy(): void {
    // Abort removes all listeners at once
    this.abortController?.abort();
    this.abortController = null;
  }
}
```

## Pattern 5: Worker Message Handlers

Special care needed for worker communication:

```typescript
class EmulatorBridge {
  private worker: Worker | null = null;
  private boundMessageHandler: ((e: MessageEvent) => void) | null = null;

  async init(): Promise<void> {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url));

    // Initial listener for READY event
    const handleInit = (event: MessageEvent) => {
      if (event.data.type === 'READY') {
        this.worker?.removeEventListener('message', handleInit);
        this.setupPermanentListener();
      }
    };

    this.worker.addEventListener('message', handleInit);
  }

  private setupPermanentListener(): void {
    // Store bound handler for cleanup
    this.boundMessageHandler = (event: MessageEvent) => {
      this.handleWorkerEvent(event.data);
    };
    this.worker?.addEventListener('message', this.boundMessageHandler);
  }

  terminate(): void {
    // Remove listener before terminating
    if (this.boundMessageHandler && this.worker) {
      this.worker.removeEventListener('message', this.boundMessageHandler);
      this.boundMessageHandler = null;
    }
    this.worker?.terminate();
    this.worker = null;
  }
}
```

## Checklist for Every Component

When implementing `destroy()`, ensure cleanup of:

- [ ] Document-level event listeners (`click`, `keydown`)
- [ ] Window-level event listeners (`resize`, `beforeunload`)
- [ ] Worker message handlers
- [ ] Monaco editor disposables
- [ ] Subscription unsubscribers
- [ ] Timers (`setTimeout`, `setInterval`)
- [ ] Animation frames (`requestAnimationFrame`)
- [ ] Observers (`ResizeObserver`, `IntersectionObserver`)

## Testing Cleanup

Verify cleanup in tests:

```typescript
describe('MenuBar', () => {
  it('should remove document listener on destroy', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const menuBar = new MenuBar();
    menuBar.mount(container);

    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));

    menuBar.destroy();

    // Verify same function reference was removed
    const addedHandler = addSpy.mock.calls[0][1];
    expect(removeSpy).toHaveBeenCalledWith('click', addedHandler);
  });
});
```

## Real Examples

- `src/ui/MenuBar.ts` - Document click listener for menu close
- `src/ui/PanelResizer.ts` - Mouse move/up listeners for drag
- `src/emulator/EmulatorBridge.ts` - Worker message handler
- `src/editor/Editor.ts` - Monaco disposables
